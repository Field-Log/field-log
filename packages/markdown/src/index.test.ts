import { describe, expect, it } from "vitest";
import { htmlToMarkdown, markdownToHtml } from "./index.js";

describe("htmlToMarkdown", () => {
  it("converts Shopify-style HTML to markdown", () => {
    expect(
      htmlToMarkdown(
        '<p>Machined <strong>titanium</strong> pen with <a href="https://example.com">details</a>.</p>',
      ),
    ).toBe("Machined **titanium** pen with [details](https://example.com).");
  });

  it("preserves images and list structure", () => {
    expect(
      htmlToMarkdown(
        '<ul><li>One</li><li>Two</li></ul><p><img src="https://example.com/pen.jpg" alt="Pen"></p>',
      ),
    ).toBe("- One\n- Two\n\n![Pen](https://example.com/pen.jpg)");
  });

  it("returns null for empty input", () => {
    expect(htmlToMarkdown(null)).toBeNull();
    expect(htmlToMarkdown("")).toBeNull();
  });
});

describe("markdownToHtml", () => {
  it("supports GFM tables and task lists", () => {
    expect(
      markdownToHtml("| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] Done"),
    ).toContain("<table>");
    expect(markdownToHtml("- [x] Done")).toContain(
      'type="checkbox" checked disabled',
    );
  });

  it("sanitizes unsafe HTML", () => {
    const html = markdownToHtml('[unsafe](javascript:alert("x"))');

    expect(html).toContain("unsafe");
    expect(html).not.toContain("javascript:");
  });
});
