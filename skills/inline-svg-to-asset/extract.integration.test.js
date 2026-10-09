"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const CLI_PATH = path.join(__dirname, "extract.js");

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

test("[integration] CLI extrai um SVG inline para assets-dir e atualiza o arquivo", () => {
  const tmpDir = makeTmpDir("svg-it-single-");
  const inputPath = path.join(tmpDir, "pagina.html");
  const assetsDir = path.join(tmpDir, "assets");
  fs.writeFileSync(
    inputPath,
    `<html><body><h1>Titulo</h1><svg id="fluxo-principal"><rect width="10" height="10"/></svg></body></html>`
  );

  const result = runCli(["--input", inputPath, "--assets-dir", assetsDir]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.match(result.stdout, /Extraidos 1 SVG/);
  assert.ok(fs.existsSync(path.join(assetsDir, "fluxo-principal.svg")));

  const updated = fs.readFileSync(inputPath, "utf8");
  assert.doesNotMatch(updated, /<svg/);
  assert.match(updated, /<img src="assets\/fluxo-principal\.svg" alt="fluxo-principal">/);
  assert.match(updated, /<h1>Titulo<\/h1>/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI extrai multiplos SVGs preservando o restante do markdown", () => {
  const tmpDir = makeTmpDir("svg-it-multi-");
  const inputPath = path.join(tmpDir, "wiki.md");
  const assetsDir = path.join(tmpDir, "assets");
  fs.writeFileSync(
    inputPath,
    `# Arquitetura\n\n<svg id="visao-geral"><rect/></svg>\n\nTexto entre diagramas.\n\n<svg id="fluxo-dados"><rect/></svg>\n`
  );

  const result = runCli(["--input", inputPath, "--assets-dir", assetsDir]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.match(result.stdout, /Extraidos 2 SVG/);
  assert.ok(fs.existsSync(path.join(assetsDir, "visao-geral.svg")));
  assert.ok(fs.existsSync(path.join(assetsDir, "fluxo-dados.svg")));

  const updated = fs.readFileSync(inputPath, "utf8");
  assert.match(updated, /# Arquitetura/);
  assert.match(updated, /Texto entre diagramas\./);
  assert.match(updated, /alt="visao-geral"/);
  assert.match(updated, /alt="fluxo-dados"/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI nao faz nada quando nao ha SVG inline", () => {
  const tmpDir = makeTmpDir("svg-it-noop-");
  const inputPath = path.join(tmpDir, "pagina.html");
  const assetsDir = path.join(tmpDir, "assets");
  const original = `<html><body><p>sem diagramas</p></body></html>`;
  fs.writeFileSync(inputPath, original);

  const result = runCli(["--input", inputPath, "--assets-dir", assetsDir]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.match(result.stdout, /Nenhum SVG inline encontrado/);
  assert.strictEqual(fs.existsSync(assetsDir), false);
  assert.strictEqual(fs.readFileSync(inputPath, "utf8"), original);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando o arquivo de entrada nao existe", () => {
  const tmpDir = makeTmpDir("svg-it-missing-input-");
  const assetsDir = path.join(tmpDir, "assets");

  const result = runCli(["--input", path.join(tmpDir, "nao-existe.html"), "--assets-dir", assetsDir]);

  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /nao encontrado/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("[integration] CLI falha com mensagem clara quando faltam argumentos obrigatorios", () => {
  const result = runCli(["--input", "pagina.html"]);
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /Uso: extract\.js/);
});

test("[integration] CLI cria assets-dir quando ele ainda nao existe", () => {
  const tmpDir = makeTmpDir("svg-it-create-assets-dir-");
  const inputPath = path.join(tmpDir, "pagina.html");
  const assetsDir = path.join(tmpDir, "novo", "assets");
  fs.writeFileSync(inputPath, `<svg id="x"><rect/></svg>`);

  const result = runCli(["--input", inputPath, "--assets-dir", assetsDir]);

  assert.strictEqual(result.status, 0, `CLI falhou: ${result.stderr}`);
  assert.ok(fs.existsSync(path.join(assetsDir, "x.svg")));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
