"use strict";

const fs = require("fs");
const path = require("path");

const DEV_KEYWORDS = /em andamento|em execu[cç][aã]o|ativa|in progress|em migra[cç][aã]o/i;
const ROADMAP_KEYWORDS = /planejad|bloquead|backlog|a decidir|tbd|blocked|planned/i;

function findRoadmapPath(inputDir) {
  const candidate = path.join(inputDir, ".planning", "ROADMAP.md");
  return fs.existsSync(candidate) ? candidate : null;
}

function isGsdProject(inputDir) {
  return findRoadmapPath(inputDir) !== null;
}

/**
 * Parses the "## Phases" checkbox list from a GSD ROADMAP.md:
 *   - [x] **Phase 1: Titulo** - descricao
 *   - [ ] **Phase 2: Titulo** - descricao
 */
function parsePhaseCheckboxList(roadmapContent) {
  const lines = roadmapContent.split(/\r?\n/);
  const items = [];
  const lineRegex = /^- \[([ xX])\]\s+\*\*(.+?)\*\*\s*-?\s*(.*)$/;

  for (const line of lines) {
    const match = line.match(lineRegex);
    if (!match) continue;
    const [, checkbox, title, description] = match;
    items.push({
      title: title.trim(),
      checked: checkbox.toLowerCase() === "x",
      description: description.trim(),
    });
  }
  return items;
}

/**
 * Parses the "## Progress" markdown table from a GSD ROADMAP.md:
 *   | Phase | Plans Complete | Status | Completed |
 *   |-------|-----------------|--------|-----------|
 *   | 1. Fundacao | -/- | Concluida | 2026-07-31 |
 */
function parseProgressTable(roadmapContent) {
  const lines = roadmapContent.split(/\r?\n/);
  const rows = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (inTable) break;
      continue;
    }
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length < 3) continue;
    if (/^-+$/.test(cells[0].replace(/\s/g, ""))) continue;
    if (/^phase$/i.test(cells[0])) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;

    rows.push({
      phase: cells[0],
      plansComplete: cells[1] || "",
      status: cells[2] || "",
      completed: cells[3] || "",
    });
  }
  return rows;
}

/**
 * Best-effort classification into producao / desenvolvimento / roadmap.
 * GSD has no native concept of these three business buckets, so this is a
 * heuristic over the checkbox state + free-text description. For precise
 * control, use the generic schema instead of GSD auto-detection.
 */
function classifyPhase({ checked, description }) {
  if (checked) return "producao";
  if (DEV_KEYWORDS.test(description)) return "desenvolvimento";
  if (ROADMAP_KEYWORDS.test(description)) return "roadmap";
  return "roadmap";
}

function loadRoadmapItems(inputDir) {
  const roadmapPath = findRoadmapPath(inputDir);
  if (!roadmapPath) return null;
  const content = fs.readFileSync(roadmapPath, "utf8");
  const phases = parsePhaseCheckboxList(content);
  return phases.map((phase) => ({
    nome: phase.title,
    status: classifyPhase(phase),
    categoria: "Geral",
  }));
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function loadRoadmapMilestones(inputDir) {
  const roadmapPath = findRoadmapPath(inputDir);
  if (!roadmapPath) return null;
  const content = fs.readFileSync(roadmapPath, "utf8");
  const rows = parseProgressTable(content);
  return rows
    .filter((row) => DATE_REGEX.test(row.completed.trim()))
    .map((row) => ({
      data: row.completed.trim(),
      descricao_tecnica: `${row.phase} — ${row.status}`,
      impacto_negocio: `${row.phase} — ${row.status}`,
    }));
}

module.exports = {
  isGsdProject,
  findRoadmapPath,
  parsePhaseCheckboxList,
  parseProgressTable,
  classifyPhase,
  loadRoadmapItems,
  loadRoadmapMilestones,
};
