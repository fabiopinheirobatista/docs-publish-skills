"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  parsePhaseCheckboxList,
  parseProgressTable,
  classifyPhase,
  loadRoadmapItems,
  loadRoadmapMilestones,
  isGsdProject,
} = require("./gsd-roadmap.js");

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

const SAMPLE_ROADMAP = `# Roadmap: Produto Exemplo

## Phases

- [x] **Phase 1: Fundacao** - infraestrutura basica operacional
- [x] **Phase 2: Autenticacao** - login e sessao implementados
- [ ] **Phase 3: Integracao Externa** - em andamento, ligando ao parceiro X
- [ ] **Phase 4: Relatorios** - bloqueada (contrato do parceiro pendente)
- [ ] **Phase 5: Mobile** - planejada, aguardando priorizacao

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 1. Fundacao | 3/3 | Concluida | 2026-01-10 |
| 2. Autenticacao | 2/2 | Concluida | 2026-02-15 |
| 3. Integracao Externa | 1/4 | Em andamento | — |
| 4. Relatorios | 0/2 | Bloqueada | — |
| 5. Mobile | 0/0 | Planejada | — |
`;

test("parsePhaseCheckboxList extrai titulo, checked e descricao", () => {
  const items = parsePhaseCheckboxList(SAMPLE_ROADMAP);
  assert.strictEqual(items.length, 5);
  assert.deepStrictEqual(items[0], {
    title: "Phase 1: Fundacao",
    checked: true,
    description: "infraestrutura basica operacional",
  });
  assert.strictEqual(items[2].checked, false);
  assert.match(items[2].description, /em andamento/);
});

test("parseProgressTable extrai linhas da tabela de progresso", () => {
  const rows = parseProgressTable(SAMPLE_ROADMAP);
  assert.strictEqual(rows.length, 5);
  assert.deepStrictEqual(rows[0], {
    phase: "1. Fundacao",
    plansComplete: "3/3",
    status: "Concluida",
    completed: "2026-01-10",
  });
  assert.strictEqual(rows[3].status, "Bloqueada");
});

test("classifyPhase marca fases concluidas como producao", () => {
  assert.strictEqual(classifyPhase({ checked: true, description: "" }), "producao");
});

test("classifyPhase marca descricao com 'em andamento' como desenvolvimento", () => {
  assert.strictEqual(
    classifyPhase({ checked: false, description: "em andamento, ligando ao parceiro X" }),
    "desenvolvimento"
  );
});

test("classifyPhase marca bloqueada/planejada como roadmap", () => {
  assert.strictEqual(classifyPhase({ checked: false, description: "bloqueada (contrato pendente)" }), "roadmap");
  assert.strictEqual(classifyPhase({ checked: false, description: "planejada, aguardando priorizacao" }), "roadmap");
});

test("isGsdProject / loadRoadmapItems / loadRoadmapMilestones usam .planning/ROADMAP.md", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gsd-roadmap-test-"));
  const planningDir = path.join(tmpDir, ".planning");
  fs.mkdirSync(planningDir);
  fs.writeFileSync(path.join(planningDir, "ROADMAP.md"), SAMPLE_ROADMAP);

  assert.strictEqual(isGsdProject(tmpDir), true);

  const items = loadRoadmapItems(tmpDir);
  assert.strictEqual(items.length, 5);
  assert.deepStrictEqual(items[0], { nome: "Phase 1: Fundacao", status: "producao", categoria: "Geral" });
  assert.strictEqual(items[2].status, "desenvolvimento");
  assert.strictEqual(items[3].status, "roadmap");

  const milestones = loadRoadmapMilestones(tmpDir);
  assert.strictEqual(milestones.length, 2);
  assert.strictEqual(milestones[0].data, "2026-01-10");
  assert.strictEqual(milestones[1].data, "2026-02-15");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("isGsdProject retorna false quando nao ha .planning/ROADMAP.md", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "no-gsd-test-"));
  assert.strictEqual(isGsdProject(tmpDir), false);
  assert.strictEqual(loadRoadmapItems(tmpDir), null);
  assert.strictEqual(loadRoadmapMilestones(tmpDir), null);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
