"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const CLI_PATH = path.join(__dirname, "generate.js");

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

function runCli(cliArgs) {
  try {
    const stdout = execFileSync(process.execPath, [CLI_PATH, ...cliArgs], {
      encoding: "utf8",
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      status: typeof err.status === "number" ? err.status : 1,
      stdout: err.stdout ? err.stdout.toString() : "",
      stderr: err.stderr ? err.stderr.toString() : "",
    };
  }
}

function makeTmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("[integration] CLI gera dashboard completo a partir de YAML generico", () => {
  const tmpDir = makeTmpDir("status-dashboard-it-yaml-");
  const inputPath = path.join(tmpDir, "items.yaml");
  const outputPath = path.join(tmpDir, "dashboard.html");
  fs.writeFileSync(
    inputPath,
    `items:
  - nome: "Capacidade Alpha"
    status: "producao"
    categoria: "Atendimento"
  - nome: "Capacidade Beta"
    status: "desenvolvimento"
    categoria: "Vendas"
  - nome: "Capacidade Gama"
    status: "roadmap"
    categoria: "Expansao"
`
  );

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.match(result.stdout, /Gerado:/);
  assert.ok(fs.existsSync(outputPath), "arquivo de saida nao foi criado");

  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /Em produção/);
  assert.match(html, /Em desenvolvimento/);
  assert.match(html, /No roadmap/);
  assert.match(html, /Capacidade Alpha/);
  assert.match(html, /Capacidade Beta/);
  assert.match(html, /Capacidade Gama/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI gera dashboard a partir de JSON generico", () => {
  const tmpDir = makeTmpDir("status-dashboard-it-json-");
  const inputPath = path.join(tmpDir, "items.json");
  const outputPath = path.join(tmpDir, "dashboard.html");
  fs.writeFileSync(
    inputPath,
    JSON.stringify({
      items: [{ nome: "Capacidade Unica", status: "producao", categoria: "Geral" }],
    })
  );

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /Capacidade Unica/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI aplica tema externo quando --theme-css e informado", () => {
  const tmpDir = makeTmpDir("status-dashboard-it-theme-");
  const inputPath = path.join(tmpDir, "items.yaml");
  const themePath = path.join(tmpDir, "tema.css");
  const outputPath = path.join(tmpDir, "dashboard.html");
  fs.writeFileSync(inputPath, `items:\n  - nome: "X"\n    status: "producao"\n    categoria: "Y"\n`);
  fs.writeFileSync(themePath, `:root { --color-primary: #ff00ff; --marcador-de-teste: 1; }`);

  const result = runCli(["--input", inputPath, "--output", outputPath, "--theme-css", themePath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /--color-primary: #ff00ff;/);
  assert.match(html, /--marcador-de-teste: 1;/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI usa fallback neutro quando --theme-css nao e informado", () => {
  const tmpDir = makeTmpDir("status-dashboard-it-fallback-");
  const inputPath = path.join(tmpDir, "items.yaml");
  const outputPath = path.join(tmpDir, "dashboard.html");
  fs.writeFileSync(inputPath, `items:\n  - nome: "X"\n    status: "producao"\n    categoria: "Y"\n`);

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /--color-primary: #1a1a1a;/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI detecta roadmap estruturado sintetico via .planning/ROADMAP.md", () => {
  const tmpDir = makeTmpDir("status-dashboard-it-roadmap-");
  const planningDir = path.join(tmpDir, ".planning");
  const outputPath = path.join(tmpDir, "dashboard.html");
  fs.mkdirSync(planningDir);
  fs.writeFileSync(
    path.join(planningDir, "ROADMAP.md"),
    `# Roadmap: Produto Ficticio de Teste

## Phases

- [x] **Phase 1: Fundacao** - infraestrutura pronta
- [ ] **Phase 2: Integracao** - em andamento com fornecedor ficticio
- [ ] **Phase 3: Expansao** - planejada, aguardando priorizacao
`
  );

  const result = runCli(["--input", tmpDir, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /Phase 1: Fundacao/);
  assert.match(html, /Phase 2: Integracao/);
  assert.match(html, /Phase 3: Expansao/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando o diretorio nao tem roadmap estruturado nem schema valido", () => {
  const tmpDir = makeTmpDir("status-dashboard-it-invalid-dir-");
  const outputPath = path.join(tmpDir, "out", "dashboard.html");

  const result = runCli(["--input", tmpDir, "--output", outputPath]);

  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /ROADMAP\.md/);
  assert.strictEqual(fs.existsSync(outputPath), false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando faltam argumentos obrigatorios", () => {
  const result = runCli(["--input", "qualquer.yaml"]);
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /Uso: generate\.js/);
});

test("[integration] CLI cria diretorios intermediarios do output quando necessario", () => {
  const tmpDir = makeTmpDir("status-dashboard-it-nested-output-");
  const inputPath = path.join(tmpDir, "items.yaml");
  const outputPath = path.join(tmpDir, "nested", "dir", "dashboard.html");
  fs.writeFileSync(inputPath, `items:\n  - nome: "X"\n    status: "roadmap"\n    categoria: "Y"\n`);

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
