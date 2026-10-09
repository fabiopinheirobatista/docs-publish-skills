#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const FALLBACK_THEME_CSS = `:root {
  --color-primary: #1a1a1a;
  --color-secondary: #4d4d4d;
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --color-text-muted: #6b6b6b;
  --color-border: #d9d9d9;
  --font-family-base: sans-serif;
  --font-family-heading: sans-serif;
  --spacing-unit: 8px;
  --radius-base: 4px;
}`;

const BASE_STRUCTURAL_CSS = `body {
  margin: 0;
  padding: calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 2);
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family-base);
  line-height: 1.6;
}
.content {
  max-width: 820px;
  margin: 0 auto;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-heading);
  color: var(--color-text);
}
a {
  color: var(--color-primary);
}
hr {
  border: none;
  border-top: 1px solid var(--color-border);
}
code, pre {
  background: color-mix(in srgb, var(--color-border) 30%, transparent);
  border-radius: var(--radius-base);
}
pre {
  padding: calc(var(--spacing-unit) * 1.5);
  overflow-x: auto;
}
blockquote {
  margin: 0;
  padding-left: calc(var(--spacing-unit) * 2);
  border-left: 3px solid var(--color-border);
  color: var(--color-text-muted);
}
table {
  border-collapse: collapse;
  width: 100%;
}
th, td {
  border: 1px solid var(--color-border);
  padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
}`;

function parseArgs(argv) {
  const args = { input: null, output: null, themeCss: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") {
      args.input = argv[++i];
    } else if (arg === "--output") {
      args.output = argv[++i];
    } else if (arg === "--theme-css") {
      args.themeCss = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }
  return args;
}

function resolveTheme(themeCssPath) {
  if (!themeCssPath) {
    return FALLBACK_THEME_CSS;
  }
  if (!fs.existsSync(themeCssPath)) {
    throw new Error(`Arquivo de tema nao encontrado: ${themeCssPath}`);
  }
  return fs.readFileSync(themeCssPath, "utf8");
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function convertMarkdownToHtml(markdown) {
  return marked.parse(markdown);
}

function buildHtmlDocument({ title, bodyHtml, themeCss }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
${themeCss}

${BASE_STRUCTURAL_CSS}
</style>
</head>
<body>
<div class="content">
${bodyHtml}
</div>
</body>
</html>
`;
}

function run(args) {
  if (!args.input || !args.output) {
    throw new Error("Uso: convert.js --input <arquivo.md> --output <arquivo.html> [--theme-css <tema.css>]");
  }
  if (!fs.existsSync(args.input)) {
    throw new Error(`Arquivo de entrada nao encontrado: ${args.input}`);
  }

  const markdown = fs.readFileSync(args.input, "utf8");
  const themeCss = resolveTheme(args.themeCss);
  const title = extractTitle(markdown, path.basename(args.input, path.extname(args.input)));
  const bodyHtml = convertMarkdownToHtml(markdown);
  const html = buildHtmlDocument({ title, bodyHtml, themeCss });

  const outputDir = path.dirname(args.output);
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(args.output, html, "utf8");

  return args.output;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Uso: convert.js --input <arquivo.md> --output <arquivo.html> [--theme-css <tema.css>]");
    process.exit(0);
  }
  try {
    const output = run(args);
    console.log(`Gerado: ${output}`);
  } catch (err) {
    console.error(`ERRO: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  parseArgs,
  resolveTheme,
  extractTitle,
  convertMarkdownToHtml,
  buildHtmlDocument,
  run,
  FALLBACK_THEME_CSS,
};
