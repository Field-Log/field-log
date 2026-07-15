import ImageKit from "imagekit";

export type ImageStorageUploadInput = {
  sourceProductId: string;
  sourceHash: string;
  sourceImageId: string | null;
  sourceUrl: string;
};

export type ImageStorageUploadResult = {
  fileId: string;
  filePath: string;
  url: string;
};

export type ImageStorage = {
  deleteFile: (fileId: string) => Promise<"deleted" | "skipped">;
  uploadAutmogPenImage: (
    input: ImageStorageUploadInput,
  ) => Promise<ImageStorageUploadResult | null>;
};

export type ImageKitStorageConfig = {
  dryRun?: boolean;
  privateKey?: string;
  publicKey?: string;
  urlEndpoint?: string;
};

export function createImageStorage(
  config: ImageKitStorageConfig,
): ImageStorage {
  if (config.dryRun) {
    return createDryRunImageStorage();
  }

  if (!config.privateKey || !config.publicKey || !config.urlEndpoint) {
    throw new Error("ImageKit configuration is required unless dry-run is on.");
  }

  const imageKit = new ImageKit({
    privateKey: config.privateKey,
    publicKey: config.publicKey,
    urlEndpoint: config.urlEndpoint,
  });

  return {
    async deleteFile(fileId) {
      await imageKit.deleteFile(fileId);
      return "deleted";
    },
    async uploadAutmogPenImage(input) {
      const fileName = getAutmogImageFileName(input);
      const folder = `/scrapers/autmog/pens/${input.sourceProductId}`;
      const response = await imageKit.upload({
        file: input.sourceUrl,
        fileName,
        folder,
        overwriteFile: true,
        overwriteTags: true,
        tags: [
          "scraper",
          "autmog",
          "autmog-pen",
          `source-product:${input.sourceProductId}`,
        ],
        transformation: {
          pre: "w-2000,h-2000,c-at_max,q-85,f-webp",
        },
        useUniqueFileName: false,
      });

      return {
        fileId: response.fileId,
        filePath: response.filePath,
        url: response.url,
      };
    },
  };
}

function createDryRunImageStorage(): ImageStorage {
  return {
    async deleteFile() {
      return "skipped";
    },
    async uploadAutmogPenImage() {
      return null;
    },
  };
}

function getAutmogImageFileName(input: ImageStorageUploadInput): string {
  const suffix = input.sourceImageId ?? input.sourceHash.replace("sha256:", "");

  return `${suffix}.webp`;
}
