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
    const stdout = execFileSync(process.execPath, [CLI_PATH, ...cliArgs], { encoding: "utf8" });
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

test("[integration] CLI gera timeline completa a partir de YAML generico", () => {
  const tmpDir = makeTmpDir("milestone-it-yaml-");
  const inputPath = path.join(tmpDir, "marcos.yaml");
  const outputPath = path.join(tmpDir, "timeline.html");
  fs.writeFileSync(
    inputPath,
    `marcos:
  - data: "2026-02-01"
    descricao_tecnica: "Segundo marco tecnico"
    impacto_negocio: "Segundo impacto de negocio"
  - data: "2026-01-01"
    descricao_tecnica: "Primeiro marco tecnico"
    impacto_negocio: "Primeiro impacto de negocio"
`
  );

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.match(result.stdout, /Gerado:/);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /Primeiro impacto de negocio/);
  assert.match(html, /Segundo impacto de negocio/);
  const firstIndex = html.indexOf("Primeiro impacto de negocio");
  const secondIndex = html.indexOf("Segundo impacto de negocio");
  assert.ok(firstIndex < secondIndex, "marcos devem aparecer em ordem cronologica");

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI gera timeline a partir de JSON generico", () => {
  const tmpDir = makeTmpDir("milestone-it-json-");
  const inputPath = path.join(tmpDir, "marcos.json");
  const outputPath = path.join(tmpDir, "timeline.html");
  fs.writeFileSync(
    inputPath,
    JSON.stringify({
      marcos: [{ data: "2026-01-01", descricao_tecnica: "tecnico", impacto_negocio: "impacto unico" }],
    })
  );

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /impacto unico/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI aplica tema externo quando --theme-css e informado", () => {
  const tmpDir = makeTmpDir("milestone-it-theme-");
  const inputPath = path.join(tmpDir, "marcos.yaml");
  const themePath = path.join(tmpDir, "tema.css");
  const outputPath = path.join(tmpDir, "timeline.html");
  fs.writeFileSync(inputPath, `marcos:\n  - data: "2026-01-01"\n    descricao_tecnica: "x"\n    impacto_negocio: "y"\n`);
  fs.writeFileSync(themePath, `:root { --color-primary: #00ff00; }`);

  const result = runCli(["--input", inputPath, "--output", outputPath, "--theme-css", themePath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /--color-primary: #00ff00;/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI detecta roadmap estruturado sintetico via .planning/ROADMAP.md", () => {
  const tmpDir = makeTmpDir("milestone-it-roadmap-");
  const planningDir = path.join(tmpDir, ".planning");
  const outputPath = path.join(tmpDir, "timeline.html");
  fs.mkdirSync(planningDir);
  fs.writeFileSync(
    path.join(planningDir, "ROADMAP.md"),
    `## Progress

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 1. Fundacao Ficticia | 2/2 | Concluida | 2026-04-01 |
| 2. Fase Pendente | 0/1 | Planejada | — |
`
  );

  const result = runCli(["--input", tmpDir, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /Fundacao Ficticia/);
  assert.doesNotMatch(html, /Fase Pendente/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando o diretorio nao tem roadmap estruturado nem schema valido", () => {
  const tmpDir = makeTmpDir("milestone-it-invalid-dir-");
  const outputPath = path.join(tmpDir, "out", "timeline.html");

  const result = runCli(["--input", tmpDir, "--output", outputPath]);

  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /ROADMAP\.md/);
  assert.strictEqual(fs.existsSync(outputPath), false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando faltam argumentos obrigatorios", () => {
  const result = runCli(["--input", "marcos.yaml"]);
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /Uso: generate\.js/);
});

test("[integration] CLI cria diretorios intermediarios do output quando necessario", () => {
  const tmpDir = makeTmpDir("milestone-it-nested-output-");
  const inputPath = path.join(tmpDir, "marcos.yaml");
  const outputPath = path.join(tmpDir, "nested", "dir", "timeline.html");
  fs.writeFileSync(inputPath, `marcos:\n  - data: "2026-01-01"\n    descricao_tecnica: "x"\n    impacto_negocio: "y"\n`);

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
