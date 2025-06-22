import React from "react";
import DOMPurify from "dompurify";

// Simple markdown parser function
const parseMarkdown = (markdown: string): string => {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Inline code
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // Links
  // Links (must come before image regex)
  html = html.replace(
    /(?<!\!)\[([^\]]+)\]\((\S+?)(?:\s+"(.*?)")?\)/g,
    (_match, text, url, title) => {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${url}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    }
  );

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^\)]+)\)/g,
    '<img src="$2" alt="$1" />'
  );

  // Unordered lists
  html = html.replace(/^\* (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, (match) => {
    if (!match.includes("<ul>")) {
      return `<ol>${match}</ol>`;
    }
    return match;
  });

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");
  html = html.replace(/^\*\*\*$/gm, "<hr>");

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>|<ol>|<blockquote>|<hr>|<pre>)/g, "$1");
  html = html.replace(
    /(<\/ul>|<\/ol>|<\/blockquote>|<hr>|<\/pre>)<\/p>/g,
    "$1"
  );

  // Unordered lists (supports `-` and `*`)
  html = html.replace(/^(?:\*|-)\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gms, (match) => {
    const lines = match.split("\n").filter(Boolean).join("");
    return `<ul>${lines}</ul>`;
  });

  // Ordered lists (supports 1. 2. etc.)
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gms, (match) => {
    if (!match.includes("<ul>")) {
      const lines = match.split("\n").filter(Boolean).join("");
      return `<ol>${lines}</ol>`;
    }
    return match;
  });

  return html;
};

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
  sanitizeConfig?: DOMPurify.Config;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdown,
  className = "",
  sanitizeConfig = {},
}) => {
  // Default DOMPurify configuration
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "a",
      "img",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "src",
      "alt",
      "width",
      "height",
      "class",
      "id",
    ],
    ALLOW_DATA_ATTR: false,
    ...sanitizeConfig,
  };

  // Parse markdown to HTML
  const htmlContent = parseMarkdown(markdown);

  // Sanitize the HTML with DOMPurify
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, defaultConfig);

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default MarkdownRenderer;
