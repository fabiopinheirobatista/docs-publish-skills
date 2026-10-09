#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const { resolveTheme, buildHtmlDocument, FALLBACK_THEME_CSS } = require("../_shared/html-document.js");

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

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function convertMarkdownToHtml(markdown) {
  return marked.parse(markdown);
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
