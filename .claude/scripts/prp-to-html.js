#!/usr/bin/env node

/**
 * PRP to HTML Converter
 *
 * Converts a PRP markdown file to a styled HTML document for browser viewing.
 *
 * Usage:
 *   node .claude/scripts/prp-to-html.js PRPs/scheduling/prp-scheduling.md
 *
 * Output:
 *   PRPs/scheduling/prp-scheduling.html
 */

import fs from "fs";
import path from "path";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node prp-to-html.js <path-to-prp.md>");
  console.error("Example: node prp-to-html.js PRPs/scheduling/prp-scheduling.md");
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Error: File not found: ${inputPath}`);
  process.exit(1);
}

const markdown = fs.readFileSync(inputPath, "utf-8");
const outputPath = inputPath.replace(/\.md$/, ".html");
const featureName = path.basename(inputPath, ".md").replace(/^prp-/, "");

/**
 * Simple markdown to HTML converter
 * Handles common markdown patterns used in PRPs
 */
function markdownToHtml(md) {
  let html = md;

  // Escape HTML entities first (except in code blocks)
  // We'll handle code blocks separately

  // Extract code blocks to protect them
  const codeBlocks = [];
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length;
    codeBlocks.push({ lang: lang || "text", code: escapeHtml(code.trim()) });
    return `__CODE_BLOCK_${index}__`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline">$1</code>');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 id="$1">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 id="$1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 id="$1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 id="$1">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Checkboxes
  html = html.replace(/- \[x\] (.+)/g, '<li class="task done"><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/- \[ \] (.+)/g, '<li class="task"><input type="checkbox" disabled> $1</li>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, "<ul>\n$1</ul>\n");

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split("|").map((c) => c.trim());
    // Check if it's a separator row
    if (cells.every((c) => /^[-:]+$/.test(c))) {
      return "__TABLE_SEP__";
    }
    return "<tr>" + cells.map((c) => `<td>${c}</td>`).join("") + "</tr>";
  });

  // Wrap tables
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, (match) => {
    // Convert first row to header
    const rows = match.trim().split("\n").filter((r) => r && r !== "__TABLE_SEP__");
    if (rows.length > 0) {
      rows[0] = rows[0].replace(/<td>/g, "<th>").replace(/<\/td>/g, "</th>");
    }
    return "<table>\n<thead>\n" + rows[0] + "\n</thead>\n<tbody>\n" + rows.slice(1).join("\n") + "\n</tbody>\n</table>\n";
  });
  html = html.replace(/__TABLE_SEP__\n?/g, "");

  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr>");

  // Images (must come before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="screenshot"><img src="$2" alt="$1" loading="lazy"><figcaption>$1</figcaption></figure>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Paragraphs - wrap loose text
  html = html.replace(/^(?!<[a-z]|__CODE)(.+)$/gm, "<p>$1</p>");

  // Fix double-wrapped paragraphs
  html = html.replace(/<p><(h[1-4]|ul|li|table|hr)/g, "<$1");
  html = html.replace(/<\/(h[1-4]|ul|li|table)><\/p>/g, "</$1>");

  // Restore code blocks with syntax highlighting class
  codeBlocks.forEach((block, index) => {
    const collapsible = block.code.split("\n").length > 15;
    const codeHtml = collapsible
      ? `<details class="code-block"><summary>Code (${block.lang}) - click to expand</summary><pre><code class="language-${block.lang}">${block.code}</code></pre></details>`
      : `<pre><code class="language-${block.lang}">${block.code}</code></pre>`;
    html = html.replace(`__CODE_BLOCK_${index}__`, codeHtml);
  });

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Extract table of contents from headers
 */
function extractToc(md) {
  const headers = [];
  const regex = /^(#{1,3}) (.+)$/gm;
  let match;

  while ((match = regex.exec(md)) !== null) {
    headers.push({
      level: match[1].length,
      text: match[2],
      id: match[2].replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()
    });
  }

  return headers;
}

/**
 * Generate HTML document
 */
function generateHtml(markdown, featureName) {
  const toc = extractToc(markdown);
  const content = markdownToHtml(markdown);
  const timestamp = new Date().toISOString();

  const tocHtml = toc
    .map((h) => {
      const indent = (h.level - 1) * 16;
      return `<a href="#${h.text}" style="padding-left: ${indent}px">${h.text}</a>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRP: ${featureName}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #1a1a1a;
      --text-muted: #666666;
      --border: #e5e5e5;
      --code-bg: #f6f8fa;
      --accent: #0066cc;
      --success: #22863a;
      --warning: #b08800;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1a1a;
        --text: #e5e5e5;
        --text-muted: #999999;
        --border: #333333;
        --code-bg: #2d2d2d;
        --accent: #58a6ff;
        --success: #3fb950;
        --warning: #d29922;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--bg);
      margin: 0;
      padding: 0;
    }

    .container {
      display: flex;
      max-width: 1400px;
      margin: 0 auto;
    }

    nav.toc {
      width: 280px;
      padding: 24px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      border-right: 1px solid var(--border);
      flex-shrink: 0;
    }

    nav.toc h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    nav.toc a {
      display: block;
      padding: 6px 0;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      border-left: 2px solid transparent;
      transition: all 0.2s;
    }

    nav.toc a:hover {
      color: var(--accent);
      border-left-color: var(--accent);
    }

    main {
      flex: 1;
      padding: 48px;
      max-width: 900px;
      min-width: 0;
    }

    h1, h2, h3, h4 {
      margin-top: 32px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 {
      font-size: 32px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border);
      margin-top: 0;
    }

    h2 {
      font-size: 24px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    h3 { font-size: 20px; }
    h4 { font-size: 16px; }

    p {
      margin: 16px 0;
    }

    a {
      color: var(--accent);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    code.inline {
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "SF Mono", "Fira Code", Consolas, monospace;
      font-size: 0.9em;
    }

    pre {
      background: var(--code-bg);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
    }

    pre code {
      font-family: "SF Mono", "Fira Code", Consolas, monospace;
      font-size: 14px;
      line-height: 1.5;
    }

    details.code-block {
      margin: 16px 0;
    }

    details.code-block summary {
      cursor: pointer;
      padding: 8px 12px;
      background: var(--code-bg);
      border-radius: 8px 8px 0 0;
      font-size: 14px;
      color: var(--text-muted);
    }

    details.code-block[open] summary {
      border-radius: 8px 8px 0 0;
    }

    details.code-block pre {
      margin-top: 0;
      border-radius: 0 0 8px 8px;
    }

    ul, ol {
      margin: 16px 0;
      padding-left: 24px;
    }

    li {
      margin: 8px 0;
    }

    li.task {
      list-style: none;
      margin-left: -24px;
    }

    li.task input {
      margin-right: 8px;
    }

    li.task.done {
      color: var(--success);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid var(--border);
    }

    th {
      background: var(--code-bg);
      font-weight: 600;
    }

    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 32px 0;
    }

    figure.screenshot {
      margin: 24px 0;
      padding: 0;
    }

    figure.screenshot img {
      max-width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    figure.screenshot figcaption {
      margin-top: 8px;
      font-size: 14px;
      color: var(--text-muted);
      text-align: center;
      font-style: italic;
    }

    .meta {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 32px;
    }

    @media (max-width: 900px) {
      .container {
        flex-direction: column;
      }

      nav.toc {
        width: 100%;
        height: auto;
        position: relative;
        border-right: none;
        border-bottom: 1px solid var(--border);
      }

      main {
        padding: 24px;
      }
    }

    @media print {
      nav.toc {
        display: none;
      }

      main {
        padding: 0;
        max-width: 100%;
      }

      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <nav class="toc">
      <h2>Contents</h2>
      ${tocHtml}
    </nav>
    <main>
      <div class="meta">
        Generated: ${timestamp}
      </div>
      ${content}
    </main>
  </div>
</body>
</html>`;
}

// Main execution
const html = generateHtml(markdown, featureName);
fs.writeFileSync(outputPath, html);
console.log(`✅ Generated: ${outputPath}`);
