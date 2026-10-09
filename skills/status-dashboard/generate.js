#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { resolveTheme, buildHtmlDocument } = require("../_shared/html-document.js");
const { loadRoadmapItems, hasStructuredRoadmap } = require("../_shared/planning-roadmap.js");
const { loadDataFile, isDirectory } = require("../_shared/data-source.js");

const STATUS_LABELS = {
  producao: "Em produção",
  desenvolvimento: "Em desenvolvimento",
  roadmap: "No roadmap",
};

const STATUS_ORDER = ["producao", "desenvolvimento", "roadmap"];

const EXTRA_STYLES = `.status-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: calc(var(--spacing-unit) * 3);
}
.status-column h2 {
  font-size: 1.1rem;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-unit);
}
.status-column[data-status="producao"] h2 { border-color: var(--color-success); }
.status-column[data-status="desenvolvimento"] h2 { border-color: var(--color-warning); }
.status-column[data-status="roadmap"] h2 { border-color: var(--color-text-muted); }
.status-card {
  background: color-mix(in srgb, var(--color-border) 15%, transparent);
  border-radius: var(--radius-base);
  padding: calc(var(--spacing-unit) * 1.5);
  margin-bottom: var(--spacing-unit);
}
.status-card .categoria {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: calc(var(--spacing-unit) / 2);
}
.status-empty {
  color: var(--color-text-muted);
  font-style: italic;
}`;

function parseArgs(argv) {
  const args = { input: null, output: null, themeCss: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i];
    else if (arg === "--output") args.output = argv[++i];
    else if (arg === "--theme-css") args.themeCss = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadItems(input) {
  if (isDirectory(input)) {
    if (hasStructuredRoadmap(input)) {
      return loadRoadmapItems(input);
    }
    throw new Error(
      `Diretorio informado (${input}) nao contem .planning/ROADMAP.md. Para projetos que nao usam esse formato, aponte --input para um arquivo .yaml/.yml/.json seguindo o schema generico.`
    );
  }
  const data = loadDataFile(input);
  if (!data || !Array.isArray(data.items)) {
    throw new Error("Schema invalido: esperado um objeto com a chave 'items' (lista de {nome, status, categoria}).");
  }
  return data.items;
}

function groupByStatus(items) {
  const groups = { producao: [], desenvolvimento: [], roadmap: [] };
  for (const item of items) {
    const status = STATUS_ORDER.includes(item.status) ? item.status : "roadmap";
    groups[status].push(item);
  }
  return groups;
}

function renderColumn(status, items) {
  const label = STATUS_LABELS[status];
  const cards = items.length
    ? items
        .map(
          (item) => `  <div class="status-card">
    <strong>${escapeHtml(item.nome)}</strong>
    <span class="categoria">${escapeHtml(item.categoria || "")}</span>
  </div>`
        )
        .join("\n")
    : `  <p class="status-empty">Nenhum item.</p>`;

  return `<div class="status-column" data-status="${status}">
<h2>${label}</h2>
${cards}
</div>`;
}

function buildDashboardHtml(items) {
  const groups = groupByStatus(items);
  const columns = STATUS_ORDER.map((status) => renderColumn(status, groups[status])).join("\n");
  return `<div class="status-board">\n${columns}\n</div>`;
}

function run(args) {
  if (!args.input || !args.output) {
    throw new Error("Uso: generate.js --input <diretorio-com-roadmap|arquivo.yaml|arquivo.json> --output <arquivo.html> [--theme-css <tema.css>]");
  }

  const items = loadItems(args.input);
  const themeCss = resolveTheme(args.themeCss);
  const bodyHtml = buildDashboardHtml(items);
  const html = buildHtmlDocument({
    title: "Dashboard de Status",
    bodyHtml,
    themeCss,
    extraStyles: EXTRA_STYLES,
  });

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
    console.log("Uso: generate.js --input <diretorio-com-roadmap|arquivo.yaml|arquivo.json> --output <arquivo.html> [--theme-css <tema.css>]");
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
  loadItems,
  groupByStatus,
  buildDashboardHtml,
  run,
  STATUS_LABELS,
  STATUS_ORDER,
};
