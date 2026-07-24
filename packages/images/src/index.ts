import sharp from "sharp";

type FetchLike = typeof fetch;

export type ImageStorageProvider = "bunny";

export type ImageStorageConfig = {
  bunnyStorageAccessKey?: string;
  bunnyStorageEndpoint?: string;
  bunnyStorageZoneName?: string;
  cdnBaseUrl?: string;
  dryRun?: boolean;
  fetch?: FetchLike;
  provider?: string;
  remoteImageMaxBytes?: number;
};

export type ImageUploadInput = {
  fileName: string;
  folder?: string;
  overwriteFile?: boolean;
  overwriteTags?: boolean;
  tags?: string[];
  useUniqueFileName?: boolean;
};

export type RemoteImageUploadInput = ImageUploadInput & {
  sourceUrl: string;
};

export type ImageUpdateInput = {
  tags?: string[];
};

export type ImageUploadResult = {
  fileId: string;
  filePath: string;
  height: number;
  provider: ImageStorageProvider;
  thumbnailUrl: string;
  url: string;
  width: number;
};

export type ImageUpdateResult = {
  fileId: string;
  filePath: string;
  provider: ImageStorageProvider;
  thumbnailUrl?: string;
  url: string;
};

export type ImageFolderDeleteResult = "deleted" | "missing" | "skipped";

export type ImageStorage = {
  deleteFile: (fileId: string) => Promise<"deleted" | "skipped">;
  deleteFolder: (folderPath: string) => Promise<ImageFolderDeleteResult>;
  updateFile: (
    fileId: string,
    input: ImageUpdateInput,
  ) => Promise<ImageUpdateResult | null>;
  uploadImage: (input: ImageUploadInput) => Promise<ImageUploadResult | null>;
  uploadRemoteImage: (
    input: RemoteImageUploadInput,
  ) => Promise<ImageUploadResult | null>;
};

type BunnyStorageConfig = {
  accessKey: string;
  cdnBaseUrl: string;
  endpoint: string;
  fetch: FetchLike;
  remoteImageMaxBytes: number;
  zoneName: string;
};

type BunnyStorageObject = {
  IsDirectory?: boolean;
  ObjectName?: string;
};

type ProcessedImage = {
  buffer: Buffer;
  height: number;
  width: number;
};

const defaultImageStorageProvider = "bunny";
const defaultRemoteImageMaxBytes = 50 * 1024 * 1024;
const uploadMaxDimension = 2_000;
const uploadWebpQuality = 85;
const thumbnailWidth = 500;

export function createImageStorage(config: ImageStorageConfig): ImageStorage {
  if (config.dryRun) {
    return createDryRunImageStorage();
  }

  const provider = normalizeProvider(config.provider);

  if (provider !== "bunny") {
    throw new Error(`Unsupported image storage provider: ${provider}.`);
  }

  return createBunnyImageStorage(readBunnyConfig(config));
}

export async function deletePreviewImageFolder(input: {
  bunnyStorageAccessKey?: string;
  bunnyStorageEndpoint?: string;
  bunnyStorageZoneName?: string;
  cdnBaseUrl?: string;
  dryRun?: boolean;
  fetch?: FetchLike;
  prNumber: number;
}): Promise<{
  folderPath: string;
  status: ImageFolderDeleteResult;
}> {
  const folderPath = buildPreviewImageFolderPath(input.prNumber);
  const storage = createImageStorage({
    bunnyStorageAccessKey: input.bunnyStorageAccessKey,
    bunnyStorageEndpoint: input.bunnyStorageEndpoint,
    bunnyStorageZoneName: input.bunnyStorageZoneName,
    cdnBaseUrl: input.cdnBaseUrl,
    dryRun: input.dryRun,
    fetch: input.fetch,
  });
  const status = await storage.deleteFolder(folderPath);

  return {
    folderPath,
    status,
  };
}

export function buildPreviewImageFolderPath(prNumber: number): string {
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error("Image preview cleanup requires a positive PR number.");
  }

  return `/preview/pr-${prNumber}`;
}

function createBunnyImageStorage(config: BunnyStorageConfig): ImageStorage {
  return {
    async deleteFile(fileId) {
      await bunnyRequest(config, normalizeBunnyObjectPath(fileId), {
        expectedStatuses: [200, 404],
        method: "DELETE",
      });

      return "deleted";
    },
    async deleteFolder(folderPath) {
      const normalizedFolderPath = normalizePreviewFolderPath(folderPath);
      const deletedFiles = await deleteBunnyPrefix(
        config,
        normalizedFolderPath,
      );

      return deletedFiles === 0 ? "missing" : "deleted";
    },
    async updateFile(fileId) {
      const filePath = normalizeImageFilePath(fileId);

      return {
        fileId: filePath,
        filePath,
        provider: "bunny",
        thumbnailUrl: buildImageUrl(config.cdnBaseUrl, filePath, {
          format: "webp",
          quality: String(uploadWebpQuality),
          width: String(thumbnailWidth),
        }),
        url: buildImageUrl(config.cdnBaseUrl, filePath),
      };
    },
    async uploadImage() {
      throw new Error("Direct image uploads require a remote source URL.");
    },
    async uploadRemoteImage(input) {
      const targetFilePath = buildImageFilePath(input);
      const existingFile = await findExistingBunnyFile(config, targetFilePath);

      if (existingFile) {
        return existingFile;
      }

      const image = await fetchAndProcessRemoteImage(config, input.sourceUrl);
      await bunnyRequest(config, normalizeBunnyObjectPath(targetFilePath), {
        body: new Uint8Array(image.buffer),
        expectedStatuses: [200, 201],
        headers: {
          "content-type": "image/webp",
        },
        method: "PUT",
      });

      return mapBunnyImage(config, targetFilePath, image);
    },
  };
}

async function deleteBunnyPrefix(
  config: BunnyStorageConfig,
  folderPath: string,
): Promise<number> {
  const objects = await listBunnyFolder(config, folderPath);
  let deletedFiles = 0;

  for (const object of objects) {
    if (!object.ObjectName) {
      continue;
    }

    const objectPath = `${normalizeBunnyObjectPath(folderPath)}/${object.ObjectName}`;

    if (object.IsDirectory) {
      deletedFiles += await deleteBunnyPrefix(config, objectPath);
      continue;
    }

    await bunnyRequest(config, objectPath, {
      expectedStatuses: [200, 404],
      method: "DELETE",
    });
    deletedFiles += 1;
  }

  return deletedFiles;
}

async function findExistingBunnyFile(
  config: BunnyStorageConfig,
  filePath: string,
): Promise<ImageUploadResult | null> {
  const folderPath = filePath.replace(/\/[^/]+$/u, "") || "/";
  const fileName = filePath.split("/").at(-1);
  const objects = await listBunnyFolder(config, folderPath);
  const existingFile = objects.find(
    (object) => !object.IsDirectory && object.ObjectName === fileName,
  );

  if (!existingFile) {
    return null;
  }

  return {
    fileId: filePath,
    filePath,
    height: 0,
    provider: "bunny",
    thumbnailUrl: buildImageUrl(config.cdnBaseUrl, filePath, {
      format: "webp",
      quality: String(uploadWebpQuality),
      width: String(thumbnailWidth),
    }),
    url: buildImageUrl(config.cdnBaseUrl, filePath),
    width: 0,
  };
}

async function listBunnyFolder(
  config: BunnyStorageConfig,
  folderPath: string,
): Promise<BunnyStorageObject[]> {
  const response = await bunnyRequest(
    config,
    normalizeBunnyFolderPath(folderPath),
    {
      expectedStatuses: [200, 404],
      method: "GET",
    },
  );

  if (response.status === 404) {
    return [];
  }

  const body = await response.json();

  if (!Array.isArray(body)) {
    throw new Error("Bunny storage list response was not an array.");
  }

  return body as BunnyStorageObject[];
}

async function fetchAndProcessRemoteImage(
  config: BunnyStorageConfig,
  sourceUrl: string,
): Promise<ProcessedImage> {
  const response = await config.fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch remote image: ${response.status}.`);
  }

  const contentLength = response.headers.get("content-length");

  if (contentLength && Number(contentLength) > config.remoteImageMaxBytes) {
    throw new Error("Remote image is larger than the configured maximum size.");
  }

  const inputBuffer = Buffer.from(await response.arrayBuffer());

  if (inputBuffer.byteLength > config.remoteImageMaxBytes) {
    throw new Error("Remote image is larger than the configured maximum size.");
  }

  const { data, info } = await sharp(inputBuffer)
    .rotate()
    .resize({
      fit: "inside",
      height: uploadMaxDimension,
      withoutEnlargement: true,
      width: uploadMaxDimension,
    })
    .webp({ quality: uploadWebpQuality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    height: info.height,
    width: info.width,
  };
}

async function bunnyRequest(
  config: BunnyStorageConfig,
  objectPath: string,
  input: {
    body?: BodyInit;
    expectedStatuses: number[];
    headers?: HeadersInit;
    method: "DELETE" | "GET" | "PUT";
  },
): Promise<Response> {
  const url = buildBunnyStorageUrl(config, objectPath);
  const response = await config.fetch(url, {
    body: input.body,
    headers: {
      AccessKey: config.accessKey,
      ...input.headers,
    },
    method: input.method,
  });

  if (!input.expectedStatuses.includes(response.status)) {
    throw new Error(`Bunny storage request failed: ${response.status}.`);
  }

  return response;
}

function readBunnyConfig(config: ImageStorageConfig): BunnyStorageConfig {
  const accessKey = config.bunnyStorageAccessKey?.trim();
  const endpoint = config.bunnyStorageEndpoint?.trim();
  const zoneName = config.bunnyStorageZoneName?.trim();
  const cdnBaseUrl = config.cdnBaseUrl?.trim();

  if (!accessKey) {
    throw new Error(
      "BUNNY_STORAGE_ACCESS_KEY is required unless dry-run is on.",
    );
  }

  if (!endpoint) {
    throw new Error("BUNNY_STORAGE_ENDPOINT is required unless dry-run is on.");
  }

  if (!zoneName) {
    throw new Error(
      "BUNNY_STORAGE_ZONE_NAME is required unless dry-run is on.",
    );
  }

  if (!cdnBaseUrl) {
    throw new Error("IMAGE_CDN_BASE_URL is required unless dry-run is on.");
  }

  return {
    accessKey,
    cdnBaseUrl: normalizeBaseUrl(cdnBaseUrl),
    endpoint: normalizeBaseUrl(endpoint),
    fetch: config.fetch ?? fetch,
    remoteImageMaxBytes:
      config.remoteImageMaxBytes ?? defaultRemoteImageMaxBytes,
    zoneName,
  };
}

function normalizeProvider(provider: string | undefined): ImageStorageProvider {
  const normalizedProvider = provider?.trim() || defaultImageStorageProvider;

  if (normalizedProvider === "bunny") {
    return normalizedProvider;
  }

  throw new Error(`Unsupported image storage provider: ${normalizedProvider}.`);
}

function buildImageFilePath(
  input: Pick<ImageUploadInput, "fileName" | "folder">,
) {
  return `${normalizeImageFolder(input.folder)}${normalizeImageFileName(
    input.fileName,
  )}`;
}

function normalizeImageFolder(folder: string | undefined): string {
  const trimmedFolder = folder?.trim();

  if (!trimmedFolder) {
    return "/";
  }

  return `/${trimmedFolder.replace(/^\/+|\/+$/gu, "")}/`;
}

function normalizeImageFileName(fileName: string): string {
  const normalizedFileName = fileName.trim().replace(/^\/+/u, "");

  if (!normalizedFileName || normalizedFileName.includes("/")) {
    throw new Error("Image file name must be a single path segment.");
  }

  return normalizedFileName;
}

function normalizeImageFilePath(filePath: string): string {
  const normalizedPath = `/${filePath.trim().replace(/^\/+|\/+$/gu, "")}`;

  if (normalizedPath === "/") {
    throw new Error("Image file path is required.");
  }

  return normalizedPath;
}

function normalizePreviewFolderPath(folderPath: string): string {
  const normalizedFolder = normalizeImageFolder(folderPath).replace(/\/$/u, "");

  if (!/^\/preview\/pr-[1-9]\d*$/u.test(normalizedFolder)) {
    throw new Error(
      "Image preview cleanup can only delete /preview/pr-<number> folders.",
    );
  }

  return normalizedFolder;
}

function normalizeBunnyObjectPath(objectPath: string): string {
  const normalizedPath = objectPath.trim().replace(/^\/+|\/+$/gu, "");

  if (!normalizedPath) {
    throw new Error("Bunny object path is required.");
  }

  return normalizedPath;
}

function normalizeBunnyFolderPath(folderPath: string): string {
  const normalizedPath = folderPath.trim().replace(/^\/+|\/+$/gu, "");

  return normalizedPath ? `${normalizedPath}/` : "";
}

function buildBunnyStorageUrl(
  config: Pick<BunnyStorageConfig, "endpoint" | "zoneName">,
  objectPath: string,
): string {
  return `${config.endpoint}/${config.zoneName}/${objectPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function buildImageUrl(
  cdnBaseUrl: string,
  filePath: string,
  query?: Record<string, string>,
): string {
  const url = new URL(
    filePath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/"),
    `${cdnBaseUrl}/`,
  );

  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function mapBunnyImage(
  config: BunnyStorageConfig,
  filePath: string,
  image: Pick<ProcessedImage, "height" | "width">,
): ImageUploadResult {
  return {
    fileId: filePath,
    filePath,
    height: image.height,
    provider: "bunny",
    thumbnailUrl: buildImageUrl(config.cdnBaseUrl, filePath, {
      format: "webp",
      quality: String(uploadWebpQuality),
      width: String(thumbnailWidth),
    }),
    url: buildImageUrl(config.cdnBaseUrl, filePath),
    width: image.width,
  };
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/u, "");
}

function createDryRunImageStorage(): ImageStorage {
  return {
    async deleteFile() {
      return "skipped";
    },
    async deleteFolder() {
      return "skipped";
    },
    async updateFile() {
      return null;
    },
    async uploadImage() {
      return null;
    },
    async uploadRemoteImage() {
      return null;
    },
  };
}
