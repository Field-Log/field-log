import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

const htmlToMarkdownProcessor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: "-",
    fences: true,
  });

const markdownToHtmlProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

export function htmlToMarkdown(html: string | null | undefined): string | null {
  if (!html) {
    return null;
  }

  const markdown = String(htmlToMarkdownProcessor.processSync(html)).trim();

  return markdown.length > 0 ? markdown : null;
}

export function markdownToHtml(
  markdown: string | null | undefined,
): string | null {
  if (!markdown) {
    return null;
  }

  const html = String(markdownToHtmlProcessor.processSync(markdown)).trim();

  return html.length > 0 ? html : null;
}
