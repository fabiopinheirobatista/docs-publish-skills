"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadItems, groupByStatus, buildDashboardHtml, run } = require("./generate.js");

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

test("loadItems le schema generico YAML", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "status-dashboard-test-"));
  const inputPath = path.join(tmpDir, "items.yaml");
  fs.writeFileSync(
    inputPath,
    `items:
  - nome: "Chat com IA"
    status: "producao"
    categoria: "Atendimento"
  - nome: "Recomendacao personalizada"
    status: "desenvolvimento"
    categoria: "Vendas"
`
  );

  const items = loadItems(inputPath);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].nome, "Chat com IA");
  assert.strictEqual(items[1].status, "desenvolvimento");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("loadItems le schema generico JSON", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "status-dashboard-test-"));
  const inputPath = path.join(tmpDir, "items.json");
  fs.writeFileSync(
    inputPath,
    JSON.stringify({ items: [{ nome: "Capacidade X", status: "roadmap", categoria: "Geral" }] })
  );

  const items = loadItems(inputPath);
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].status, "roadmap");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("loadItems detecta roadmap estruturado via .planning/ROADMAP.md", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "status-dashboard-roadmap-test-"));
  fs.mkdirSync(path.join(tmpDir, ".planning"));
  fs.writeFileSync(
    path.join(tmpDir, ".planning", "ROADMAP.md"),
    "## Phases\n\n- [x] **Phase 1: Base** - pronto\n- [ ] **Phase 2: Novo** - planejada\n"
  );

  const items = loadItems(tmpDir);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].status, "producao");
  assert.strictEqual(items[1].status, "roadmap");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("loadItems lanca erro para diretorio sem roadmap estruturado", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "status-dashboard-no-roadmap-test-"));
  assert.throws(() => loadItems(tmpDir), /nao contem \.planning\/ROADMAP\.md/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("groupByStatus agrupa itens por status valido e cai em roadmap se invalido", () => {
  const groups = groupByStatus([
    { nome: "A", status: "producao" },
    { nome: "B", status: "desconhecido" },
  ]);
  assert.strictEqual(groups.producao.length, 1);
  assert.strictEqual(groups.roadmap.length, 1);
  assert.strictEqual(groups.roadmap[0].nome, "B");
});

test("buildDashboardHtml gera as 3 colunas com rotulos de negocio", () => {
  const html = buildDashboardHtml([{ nome: "Capacidade A", status: "producao", categoria: "Vendas" }]);
  assert.match(html, /Em produção/);
  assert.match(html, /Em desenvolvimento/);
  assert.match(html, /No roadmap/);
  assert.match(html, /Capacidade A/);
  assert.match(html, /Vendas/);
});

test("buildDashboardHtml escapa HTML do conteudo do item", () => {
  const html = buildDashboardHtml([{ nome: "<script>alert(1)</script>", status: "producao", categoria: "" }]);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test("run gera arquivo HTML completo a partir do schema generico", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "status-dashboard-run-test-"));
  const inputPath = path.join(tmpDir, "items.yaml");
  const outputPath = path.join(tmpDir, "dashboard.html");
  fs.writeFileSync(inputPath, `items:\n  - nome: "Teste"\n    status: "producao"\n    categoria: "Geral"\n`);

  const result = run({ input: inputPath, output: outputPath, themeCss: null });

  assert.strictEqual(result, outputPath);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<title>Dashboard de Status<\/title>/);
  assert.match(html, /Teste/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
