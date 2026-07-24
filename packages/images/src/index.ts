import ImageKit from "@imagekit/nodejs";

type FetchLike = typeof fetch;

export type ImageStorageConfig = {
  dryRun?: boolean;
  fetch?: FetchLike;
  privateKey?: string;
  publicKey?: string;
  urlEndpoint?: string;
};

export type ImageUploadInput = ImageKit.FileUploadParams;

export type RemoteImageUploadInput = Omit<ImageUploadInput, "file"> & {
  sourceUrl: string;
};

export type ImageUpdateInput = ImageKit.UpdateFileRequest;

export type ImageUploadResult = {
  fileId: string;
  filePath: string;
  height: number;
  thumbnailUrl: string;
  url: string;
  width: number;
};

export type ImageUpdateResult = {
  fileId: string;
  filePath: string;
  height?: number;
  thumbnailUrl?: string;
  url: string;
  width?: number;
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

const imageKitListLimit = 100;

export function createImageStorage(config: ImageStorageConfig): ImageStorage {
  if (config.dryRun) {
    return createDryRunImageStorage();
  }

  if (!config.privateKey) {
    throw new Error("ImageKit private key is required unless dry-run is on.");
  }

  const imageKit = new ImageKit({
    fetch: config.fetch,
    privateKey: config.privateKey,
  });

  return {
    async deleteFile(fileId) {
      await imageKit.files.delete(fileId);
      return "deleted";
    },
    async deleteFolder(folderPath) {
      try {
        await imageKit.folders.delete({
          folderPath: normalizeImageKitFolderPath(folderPath),
        });
      } catch (error) {
        if (isImageKitNotFoundError(error)) {
          return "missing";
        }

        throw error;
      }

      return "deleted";
    },
    async updateFile(fileId, input) {
      const response = await imageKit.files.update(fileId, input);

      return mapUpdateResponse(response);
    },
    async uploadImage(input) {
      const existingFile = await findExistingImage(imageKit, input);

      if (existingFile) {
        return existingFile;
      }

      const response = await imageKit.files.upload(input);

      return mapUploadResponse(response);
    },
    async uploadRemoteImage(input) {
      const existingFile = await findExistingImage(imageKit, input);

      if (existingFile) {
        return existingFile;
      }

      const { sourceUrl, ...uploadInput } = input;
      const uploadResponse = await imageKit.files.upload({
        ...uploadInput,
        file: sourceUrl,
      });

      return mapUploadResponse(uploadResponse);
    },
  };
}

export async function deletePreviewImageKitFolder(input: {
  dryRun?: boolean;
  fetch?: FetchLike;
  privateKey?: string;
  prNumber: number;
}): Promise<{
  folderPath: string;
  status: ImageFolderDeleteResult;
}> {
  const folderPath = buildPreviewImageKitFolderPath(input.prNumber);
  const storage = createImageStorage({
    dryRun: input.dryRun,
    fetch: input.fetch,
    privateKey: input.privateKey,
  });
  const status = await storage.deleteFolder(folderPath);

  return {
    folderPath,
    status,
  };
}

export function buildPreviewImageKitFolderPath(prNumber: number): string {
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error("ImageKit preview cleanup requires a positive PR number.");
  }

  return `/preview/pr-${prNumber}`;
}

async function findExistingImage(
  imageKit: ImageKit,
  input: Pick<ImageUploadInput, "fileName" | "folder">,
): Promise<ImageUploadResult | null> {
  const targetFilePath = buildImageKitFilePath(input);
  const folderPath = normalizeImageKitFolder(input.folder);
  const assets = await imageKit.assets.list({
    fileType: "image",
    limit: imageKitListLimit,
    path: folderPath,
    type: "file",
  });
  const existingFile = assets
    .filter(isCompleteImageFile)
    .find((asset) => asset.filePath === targetFilePath);

  return existingFile ? mapExistingFile(existingFile) : null;
}

function buildImageKitFilePath(
  input: Pick<ImageUploadInput, "fileName" | "folder">,
): string {
  return `${normalizeImageKitFolder(input.folder)}${input.fileName}`;
}

function normalizeImageKitFolder(folder: string | undefined): string {
  const trimmedFolder = folder?.trim();

  if (!trimmedFolder) {
    return "/";
  }

  return `/${trimmedFolder.replace(/^\/+|\/+$/g, "")}/`;
}

function normalizeImageKitFolderPath(folderPath: string): string {
  const normalizedFolder = normalizeImageKitFolder(folderPath).replace(
    /\/$/u,
    "",
  );

  if (!/^\/preview\/pr-[1-9]\d*$/u.test(normalizedFolder)) {
    throw new Error(
      "ImageKit preview cleanup can only delete /preview/pr-<number> folders.",
    );
  }

  return normalizedFolder;
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

function isImageKitNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 404
  );
}

function mapUploadResponse(
  response: ImageKit.FileUploadResponse,
): ImageUploadResult {
  assertUploadResponse(response);

  return {
    fileId: response.fileId,
    filePath: response.filePath,
    height: response.height,
    thumbnailUrl: response.thumbnailUrl,
    url: response.url,
    width: response.width,
  };
}

function mapExistingFile(response: CompleteImageKitFile): ImageUploadResult {
  return {
    fileId: response.fileId,
    filePath: response.filePath,
    height: response.height,
    thumbnailUrl: response.thumbnail,
    url: response.url,
    width: response.width,
  };
}

function mapUpdateResponse(
  response: ImageKit.FileUpdateResponse,
): ImageUpdateResult {
  assertUpdateResponse(response);

  return {
    fileId: response.fileId,
    filePath: response.filePath,
    height: response.height,
    thumbnailUrl: response.thumbnail,
    url: response.url,
    width: response.width,
  };
}

function assertUploadResponse(
  response: ImageKit.FileUploadResponse,
): asserts response is ImageKit.FileUploadResponse & {
  fileId: string;
  filePath: string;
  height: number;
  thumbnailUrl: string;
  url: string;
  width: number;
} {
  if (
    !response.fileId ||
    !response.filePath ||
    typeof response.height !== "number" ||
    !response.thumbnailUrl ||
    !response.url ||
    typeof response.width !== "number"
  ) {
    throw new Error("ImageKit upload response did not include image details.");
  }
}

function assertUpdateResponse(
  response: ImageKit.FileUpdateResponse,
): asserts response is ImageKit.FileUpdateResponse & {
  fileId: string;
  filePath: string;
  url: string;
} {
  if (!response.fileId || !response.filePath || !response.url) {
    throw new Error("ImageKit update response did not include image details.");
  }
}

type CompleteImageKitFile = ImageKit.File & {
  fileId: string;
  filePath: string;
  height: number;
  thumbnail: string;
  url: string;
  width: number;
};

function isCompleteImageFile(
  response: ImageKit.File,
): response is CompleteImageKitFile {
  return (
    Boolean(response.fileId) &&
    Boolean(response.filePath) &&
    typeof response.height === "number" &&
    Boolean(response.thumbnail) &&
    Boolean(response.url) &&
    typeof response.width === "number"
  );
}
