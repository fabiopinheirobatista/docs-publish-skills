"use strict";

const fs = require("fs");

const FALLBACK_THEME_CSS = `:root {
  --color-primary: #1a1a1a;
  --color-secondary: #4d4d4d;
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --color-text-muted: #6b6b6b;
  --color-border: #d9d9d9;
  --color-success: #2f6f4f;
  --color-warning: #8a6d1f;
  --color-danger: #8a2f2f;
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
  max-width: 960px;
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

function resolveTheme(themeCssPath) {
  if (!themeCssPath) {
    return FALLBACK_THEME_CSS;
  }
  if (!fs.existsSync(themeCssPath)) {
    throw new Error(`Arquivo de tema nao encontrado: ${themeCssPath}`);
  }
  return fs.readFileSync(themeCssPath, "utf8");
}

function buildHtmlDocument({ title, bodyHtml, themeCss, extraStyles }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
${themeCss}

${BASE_STRUCTURAL_CSS}
${extraStyles ? "\n" + extraStyles : ""}
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

module.exports = {
  FALLBACK_THEME_CSS,
  BASE_STRUCTURAL_CSS,
  resolveTheme,
  buildHtmlDocument,
};
