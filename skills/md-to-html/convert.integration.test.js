"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const CLI_PATH = path.join(__dirname, "convert.js");

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

test("[integration] CLI converte markdown para HTML com tema externo", () => {
  const tmpDir = makeTmpDir("md-to-html-it-theme-");
  const inputPath = path.join(tmpDir, "doc.md");
  const themePath = path.join(tmpDir, "tema.css");
  const outputPath = path.join(tmpDir, "doc.html");
  fs.writeFileSync(inputPath, "# Titulo do Documento\n\nConteudo com **negrito**.");
  fs.writeFileSync(themePath, ":root { --color-primary: #123456; --marcador-de-teste: 1; }");

  const result = runCli(["--input", inputPath, "--output", outputPath, "--theme-css", themePath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.match(result.stdout, /Gerado:/);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /<title>Titulo do Documento<\/title>/);
  assert.match(html, /<strong>negrito<\/strong>/);
  assert.match(html, /--color-primary: #123456;/);
  assert.match(html, /--marcador-de-teste: 1;/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI usa fallback neutro quando --theme-css nao e informado", () => {
  const tmpDir = makeTmpDir("md-to-html-it-fallback-");
  const inputPath = path.join(tmpDir, "doc.md");
  const outputPath = path.join(tmpDir, "doc.html");
  fs.writeFileSync(inputPath, "# Titulo\n\nTexto.");

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /--color-primary: #1a1a1a;/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI usa nome do arquivo como titulo quando nao ha H1", () => {
  const tmpDir = makeTmpDir("md-to-html-it-title-fallback-");
  const inputPath = path.join(tmpDir, "relatorio-mensal.md");
  const outputPath = path.join(tmpDir, "saida.html");
  fs.writeFileSync(inputPath, "Apenas um paragrafo, sem titulo.");

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<title>relatorio-mensal<\/title>/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando o markdown de entrada nao existe", () => {
  const tmpDir = makeTmpDir("md-to-html-it-missing-input-");
  const outputPath = path.join(tmpDir, "saida.html");

  const result = runCli(["--input", path.join(tmpDir, "nao-existe.md"), "--output", outputPath]);

  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /nao encontrado/);
  assert.strictEqual(fs.existsSync(outputPath), false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando o tema informado nao existe", () => {
  const tmpDir = makeTmpDir("md-to-html-it-missing-theme-");
  const inputPath = path.join(tmpDir, "doc.md");
  const outputPath = path.join(tmpDir, "doc.html");
  fs.writeFileSync(inputPath, "# X");

  const result = runCli([
    "--input",
    inputPath,
    "--output",
    outputPath,
    "--theme-css",
    path.join(tmpDir, "nao-existe.css"),
  ]);

  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /Arquivo de tema nao encontrado/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando faltam argumentos obrigatorios", () => {
  const result = runCli(["--input", "doc.md"]);
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /Uso: convert\.js/);
});

test("[integration] CLI cria diretorios intermediarios do output quando necessario", () => {
  const tmpDir = makeTmpDir("md-to-html-it-nested-output-");
  const inputPath = path.join(tmpDir, "doc.md");
  const outputPath = path.join(tmpDir, "nested", "dir", "doc.html");
  fs.writeFileSync(inputPath, "# X");

  const result = runCli(["--input", inputPath, "--output", outputPath]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.ok(fs.existsSync(outputPath));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
