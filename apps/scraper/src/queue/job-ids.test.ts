import { describe, expect, it } from "vitest";
import {
  getAutmogArchiveJobId,
  getAutmogImageDeleteJobId,
  getAutmogImageUploadJobId,
} from "./job-ids.js";

describe("scraper job ids", () => {
  it("creates deterministic archive job ids independent of source id order", () => {
    expect(getAutmogArchiveJobId(["2", "1"])).toBe(
      getAutmogArchiveJobId(["1", "2"]),
    );
  });

  it("creates deterministic image job ids", () => {
    expect(
      getAutmogImageUploadJobId({
        imageId: "image-id",
        sourceHash: "sha256:image",
      }),
    ).toBe("autmog:image:upload:image-id:sha256:image");
    expect(getAutmogImageDeleteJobId({ imageId: "image-id" })).toBe(
      "autmog:image:delete:image-id",
    );
  });
});
