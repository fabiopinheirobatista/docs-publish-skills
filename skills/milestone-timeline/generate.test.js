"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadMilestones, sortByDate, buildTimelineHtml, run } = require("./generate.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`FAIL - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

test("loadMilestones le schema generico YAML", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "milestone-test-"));
  const inputPath = path.join(tmpDir, "marcos.yaml");
  fs.writeFileSync(
    inputPath,
    `marcos:
  - data: "2026-01-15"
    descricao_tecnica: "Grafo hibrido de roteamento"
    impacto_negocio: "Roteamento inteligente entre atendentes virtuais"
`
  );

  const marcos = loadMilestones(inputPath);
  assert.strictEqual(marcos.length, 1);
  assert.strictEqual(marcos[0].impacto_negocio, "Roteamento inteligente entre atendentes virtuais");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("loadMilestones detecta roadmap estruturado via .planning/ROADMAP.md", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "milestone-roadmap-test-"));
  fs.mkdirSync(path.join(tmpDir, ".planning"));
  fs.writeFileSync(
    path.join(tmpDir, ".planning", "ROADMAP.md"),
    `## Progress

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 1. Base | 2/2 | Concluida | 2026-03-01 |
| 2. Extra | 0/1 | Planejada | — |
`
  );

  const marcos = loadMilestones(tmpDir);
  assert.strictEqual(marcos.length, 1);
  assert.strictEqual(marcos[0].data, "2026-03-01");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("sortByDate ordena marcos cronologicamente", () => {
  const sorted = sortByDate([
    { data: "2026-05-01", descricao_tecnica: "b", impacto_negocio: "b" },
    { data: "2026-01-01", descricao_tecnica: "a", impacto_negocio: "a" },
  ]);
  assert.strictEqual(sorted[0].data, "2026-01-01");
  assert.strictEqual(sorted[1].data, "2026-05-01");
});

test("buildTimelineHtml exibe impacto_negocio como texto principal", () => {
  const html = buildTimelineHtml([
    { data: "2026-01-01", descricao_tecnica: "Fase 13 - grafo hibrido", impacto_negocio: "Roteamento inteligente" },
  ]);
  assert.match(html, /timeline-impact">Roteamento inteligente</);
  assert.match(html, /timeline-tech">Fase 13 - grafo hibrido</);
});

test("buildTimelineHtml escapa HTML dos campos", () => {
  const html = buildTimelineHtml([
    { data: "2026-01-01", descricao_tecnica: "<b>x</b>", impacto_negocio: "<script>1</script>" },
  ]);
  assert.doesNotMatch(html, /<script>1/);
});

test("run gera arquivo HTML completo", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "milestone-run-test-"));
  const inputPath = path.join(tmpDir, "marcos.json");
  const outputPath = path.join(tmpDir, "timeline.html");
  fs.writeFileSync(
    inputPath,
    JSON.stringify({ marcos: [{ data: "2026-01-01", descricao_tecnica: "x", impacto_negocio: "y" }] })
  );

  const result = run({ input: inputPath, output: outputPath, themeCss: null });

  assert.strictEqual(result, outputPath);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<title>Linha do Tempo de Entregas<\/title>/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
