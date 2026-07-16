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
        imageId: 1000,
        sourceHash: "sha256:image",
      }),
    ).toBe("autmog--image--upload--1000--sha256%3Aimage");
    expect(getAutmogImageDeleteJobId({ imageId: 1000 })).toBe(
      "autmog--image--delete--1000",
    );
  });

  it("creates BullMQ-safe job ids without colon separators", () => {
    const jobIds = [
      getAutmogArchiveJobId(["2", "1"]),
      getAutmogImageUploadJobId({
        imageId: 1000,
        sourceHash: "sha256:image",
      }),
      getAutmogImageDeleteJobId({ imageId: 1000 }),
    ];

    expect(jobIds.every((jobId) => !jobId.includes(":"))).toBe(true);
  });
});
