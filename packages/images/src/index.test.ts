import { describe, expect, it, vi } from "vitest";
import {
  buildPreviewImageKitFolderPath,
  createImageStorage,
  deletePreviewImageKitFolder,
} from "./index.js";

describe("createImageStorage", () => {
  it("skips image mutations in dry-run mode", async () => {
    const storage = createImageStorage({ dryRun: true });

    await expect(
      storage.uploadRemoteImage({
        fileName: "test.webp",
        sourceUrl: "https://cdn.example.test/image.jpg",
      }),
    ).resolves.toBeNull();
    await expect(storage.updateFile("file-id", {})).resolves.toBeNull();
    await expect(storage.deleteFile("file-id")).resolves.toBe("skipped");
    await expect(storage.deleteFolder("/preview/pr-52")).resolves.toBe(
      "skipped",
    );
  });

  it("requires ImageKit config outside dry-run mode", () => {
    expect(() => createImageStorage({})).toThrow(
      "ImageKit private key is required unless dry-run is on.",
    );
  });

  it("reuses an existing ImageKit image with the same target path", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = toUrl(input);

      if (url.pathname === "/v1/files") {
        return jsonResponse([
          {
            fileId: "existing-file-id",
            filePath: "/products/pens/123/source-image.webp",
            height: 1000,
            thumbnail: "https://ik.imagekit.io/fieldlog/thumb.webp",
            url: "https://ik.imagekit.io/fieldlog/products/pens/123/source-image.webp",
            width: 1000,
          },
        ]);
      }

      throw new Error(
        `Unexpected ImageKit request: ${init?.method} ${url.href}`,
      );
    });
    const storage = createImageStorage({
      fetch: fetchMock,
      privateKey: "private_test",
    });

    await expect(
      storage.uploadRemoteImage({
        fileName: "source-image.webp",
        folder: "/products/pens/123",
        sourceUrl: "https://cdn.example.test/source-image.jpg",
      }),
    ).resolves.toEqual({
      fileId: "existing-file-id",
      filePath: "/products/pens/123/source-image.webp",
      height: 1000,
      thumbnailUrl: "https://ik.imagekit.io/fieldlog/thumb.webp",
      url: "https://ik.imagekit.io/fieldlog/products/pens/123/source-image.webp",
      width: 1000,
    });
    expect(
      fetchMock.mock.calls.map(([input]) => toUrl(input).pathname),
    ).toEqual(["/v1/files"]);
  });

  it("uploads a remote image when ImageKit does not have the target path", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = toUrl(input);

      if (url.pathname === "/v1/files") {
        return jsonResponse([]);
      }

      if (url.pathname === "/api/v1/files/upload") {
        return jsonResponse({
          fileId: "uploaded-file-id",
          filePath: "/products/pens/123/source-image.webp",
          height: 1000,
          thumbnailUrl: "https://ik.imagekit.io/fieldlog/thumb.webp",
          url: "https://ik.imagekit.io/fieldlog/products/pens/123/source-image.webp",
          width: 1000,
        });
      }

      throw new Error(`Unexpected ImageKit request: ${url.href}`);
    });
    const storage = createImageStorage({
      fetch: fetchMock,
      privateKey: "private_test",
    });

    await expect(
      storage.uploadRemoteImage({
        fileName: "source-image.webp",
        folder: "/products/pens/123",
        sourceUrl: "https://cdn.example.test/source-image.jpg",
      }),
    ).resolves.toEqual({
      fileId: "uploaded-file-id",
      filePath: "/products/pens/123/source-image.webp",
      height: 1000,
      thumbnailUrl: "https://ik.imagekit.io/fieldlog/thumb.webp",
      url: "https://ik.imagekit.io/fieldlog/products/pens/123/source-image.webp",
      width: 1000,
    });
    expect(
      fetchMock.mock.calls
        .map(([input]) => toUrl(input).pathname)
        .filter((pathname) => pathname === "/api/v1/files/upload"),
    ).toHaveLength(1);
  });

  it("deletes preview ImageKit folders", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = toUrl(input);

      if (url.pathname === "/v1/folder") {
        expect(init?.method).toBe("DELETE");
        expect(JSON.parse(String(init?.body))).toEqual({
          folderPath: "/preview/pr-52",
        });

        return jsonResponse({});
      }

      throw new Error(`Unexpected ImageKit request: ${url.href}`);
    });

    await expect(
      deletePreviewImageKitFolder({
        fetch: fetchMock,
        privateKey: "private_test",
        prNumber: 52,
      }),
    ).resolves.toEqual({
      folderPath: "/preview/pr-52",
      status: "deleted",
    });
  });

  it("treats missing preview ImageKit folders as already cleaned up", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = toUrl(input);

      if (url.pathname === "/v1/folder") {
        return jsonResponse(
          {
            message: "Folder not found.",
          },
          404,
        );
      }

      throw new Error(`Unexpected ImageKit request: ${url.href}`);
    });

    await expect(
      deletePreviewImageKitFolder({
        fetch: fetchMock,
        privateKey: "private_test",
        prNumber: 52,
      }),
    ).resolves.toEqual({
      folderPath: "/preview/pr-52",
      status: "missing",
    });
  });

  it("only builds positive PR preview folder paths", () => {
    expect(buildPreviewImageKitFolderPath(52)).toBe("/preview/pr-52");
    expect(() => buildPreviewImageKitFolderPath(0)).toThrow(
      "ImageKit preview cleanup requires a positive PR number.",
    );
  });

  it("refuses to delete non-PR ImageKit folders", async () => {
    const storage = createImageStorage({
      fetch: vi.fn<typeof fetch>(),
      privateKey: "private_test",
    });

    await expect(storage.deleteFolder("/preview")).rejects.toThrow(
      "ImageKit preview cleanup can only delete /preview/pr-<number> folders.",
    );
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function toUrl(input: Parameters<typeof fetch>[0]): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  return new URL(input.url);
}
