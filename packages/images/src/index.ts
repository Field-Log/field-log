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

export type ImageStorage = {
  deleteFile: (fileId: string) => Promise<"deleted" | "skipped">;
  updateFile: (
    fileId: string,
    input: ImageUpdateInput,
  ) => Promise<ImageUpdateResult | null>;
  uploadImage: (input: ImageUploadInput) => Promise<ImageUploadResult | null>;
  uploadRemoteImage: (
    input: RemoteImageUploadInput,
  ) => Promise<ImageUploadResult | null>;
};

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
    async updateFile(fileId, input) {
      const response = await imageKit.files.update(fileId, input);

      return mapUpdateResponse(response);
    },
    async uploadImage(input) {
      const response = await imageKit.files.upload(input);

      return mapUploadResponse(response);
    },
    async uploadRemoteImage(input) {
      const { sourceUrl, ...uploadInput } = input;
      const uploadResponse = await imageKit.files.upload({
        ...uploadInput,
        file: sourceUrl,
      });

      return mapUploadResponse(uploadResponse);
    },
  };
}

function createDryRunImageStorage(): ImageStorage {
  return {
    async deleteFile() {
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
