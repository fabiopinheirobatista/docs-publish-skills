#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { resolveTheme, buildHtmlDocument } = require("../_shared/html-document.js");
const { loadRoadmapMilestones, hasStructuredRoadmap } = require("../_shared/planning-roadmap.js");
const { loadDataFile, isDirectory } = require("../_shared/data-source.js");

const EXTRA_STYLES = `.timeline {
  position: relative;
  padding-left: calc(var(--spacing-unit) * 3);
  border-left: 2px solid var(--color-border);
}
.timeline-item {
  position: relative;
  margin-bottom: calc(var(--spacing-unit) * 3);
}
.timeline-item::before {
  content: "";
  position: absolute;
  left: calc(var(--spacing-unit) * -3.4);
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}
.timeline-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.timeline-impact {
  font-weight: bold;
  margin: calc(var(--spacing-unit) / 2) 0;
}
.timeline-tech {
  color: var(--color-text-muted);
  font-size: 0.9rem;
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

function loadMilestones(input) {
  if (isDirectory(input)) {
    if (hasStructuredRoadmap(input)) {
      return loadRoadmapMilestones(input);
    }
    throw new Error(
      `Diretorio informado (${input}) nao contem .planning/ROADMAP.md. Para projetos que nao usam esse formato, aponte --input para um arquivo .yaml/.yml/.json seguindo o schema generico.`
    );
  }
  const data = loadDataFile(input);
  if (!data || !Array.isArray(data.marcos)) {
    throw new Error("Schema invalido: esperado um objeto com a chave 'marcos' (lista de {data, descricao_tecnica, impacto_negocio}).");
  }
  return data.marcos;
}

function sortByDate(milestones) {
  return [...milestones].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

function buildTimelineHtml(milestones) {
  const sorted = sortByDate(milestones);
  if (!sorted.length) {
    return `<p class="status-empty">Nenhum marco encontrado.</p>`;
  }
  const items = sorted
    .map(
      (m) => `  <div class="timeline-item">
    <div class="timeline-date">${escapeHtml(m.data)}</div>
    <div class="timeline-impact">${escapeHtml(m.impacto_negocio)}</div>
    <div class="timeline-tech">${escapeHtml(m.descricao_tecnica)}</div>
  </div>`
    )
    .join("\n");
  return `<div class="timeline">\n${items}\n</div>`;
}

function run(args) {
  if (!args.input || !args.output) {
    throw new Error("Uso: generate.js --input <diretorio-com-roadmap|arquivo.yaml|arquivo.json> --output <arquivo.html> [--theme-css <tema.css>]");
  }

  const milestones = loadMilestones(args.input);
  const themeCss = resolveTheme(args.themeCss);
  const bodyHtml = buildTimelineHtml(milestones);
  const html = buildHtmlDocument({
    title: "Linha do Tempo de Entregas",
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
  loadMilestones,
  sortByDate,
  buildTimelineHtml,
  run,
};
