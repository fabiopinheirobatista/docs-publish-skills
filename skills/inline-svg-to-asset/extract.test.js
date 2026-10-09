"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { extractSvgBlocks, sanitizeName, deriveNames, run } = require("./extract.js");

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

test("extractSvgBlocks encontra um unico bloco simples", () => {
  const html = `<p>antes</p><svg id="foo"><circle r="1" /></svg><p>depois</p>`;
  const blocks = extractSvgBlocks(html);
  assert.strictEqual(blocks.length, 1);
  assert.strictEqual(blocks[0].content, `<svg id="foo"><circle r="1" /></svg>`);
});

test("extractSvgBlocks encontra multiplos blocos no mesmo arquivo", () => {
  const html = `<svg id="a"></svg>texto<svg id="b"></svg>`;
  const blocks = extractSvgBlocks(html);
  assert.strictEqual(blocks.length, 2);
  assert.match(blocks[0].content, /id="a"/);
  assert.match(blocks[1].content, /id="b"/);
});

test("extractSvgBlocks nao quebra um svg com svg aninhado (sprite)", () => {
  const html = `<svg id="outer"><svg id="inner"></svg></svg>`;
  const blocks = extractSvgBlocks(html);
  assert.strictEqual(blocks.length, 1);
  assert.match(blocks[0].content, /id="outer"/);
  assert.match(blocks[0].content, /id="inner"/);
});

test("extractSvgBlocks lida com svg self-closing", () => {
  const html = `<svg id="empty" />`;
  const blocks = extractSvgBlocks(html);
  assert.strictEqual(blocks.length, 1);
});

test("extractSvgBlocks retorna vazio quando nao ha svg", () => {
  const blocks = extractSvgBlocks("<p>sem diagramas aqui</p>");
  assert.strictEqual(blocks.length, 0);
});

test("sanitizeName remove caracteres invalidos", () => {
  assert.strictEqual(sanitizeName("Fluxo do Pedido!"), "Fluxo-do-Pedido");
});

test("deriveNames usa id quando disponivel e evita colisao", () => {
  const blocks = [{ content: '<svg id="fluxo">' }, { content: '<svg id="fluxo">' }, { content: "<svg>" }];
  const names = deriveNames(blocks);
  assert.deepStrictEqual(names, ["fluxo", "fluxo-2", "diagram-3"]);
});

test("run extrai SVGs para assets-dir e atualiza o arquivo de entrada", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "svg-extract-test-"));
  const inputPath = path.join(tmpDir, "pagina.html");
  const assetsDir = path.join(tmpDir, "assets");
  fs.writeFileSync(
    inputPath,
    `<html><body><svg id="fluxo-principal"><rect width="10" height="10"/></svg></body></html>`
  );

  const result = run({ input: inputPath, assetsDir });

  assert.strictEqual(result.assetsWritten.length, 1);
  assert.ok(fs.existsSync(path.join(assetsDir, "fluxo-principal.svg")));

  const updated = fs.readFileSync(inputPath, "utf8");
  assert.doesNotMatch(updated, /<svg/);
  assert.match(updated, /<img src="assets\/fluxo-principal\.svg" alt="fluxo-principal">/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("run nao faz nada quando nao ha svg inline", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "svg-extract-noop-test-"));
  const inputPath = path.join(tmpDir, "pagina.html");
  const assetsDir = path.join(tmpDir, "assets");
  fs.writeFileSync(inputPath, `<html><body><p>sem svg</p></body></html>`);

  const result = run({ input: inputPath, assetsDir });

  assert.strictEqual(result.updatedFile, null);
  assert.strictEqual(result.assetsWritten.length, 0);
  assert.strictEqual(fs.existsSync(assetsDir), false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("run extrai multiplos SVGs preservando o restante do conteudo", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "svg-extract-multi-test-"));
  const inputPath = path.join(tmpDir, "pagina.html");
  const assetsDir = path.join(tmpDir, "assets");
  fs.writeFileSync(
    inputPath,
    `<h1>Titulo</h1><svg id="um"><rect/></svg><p>meio</p><svg id="dois"><rect/></svg><p>fim</p>`
  );

  const result = run({ input: inputPath, assetsDir });

  assert.strictEqual(result.assetsWritten.length, 2);
  const updated = fs.readFileSync(inputPath, "utf8");
  assert.match(updated, /<h1>Titulo<\/h1>/);
  assert.match(updated, /<p>meio<\/p>/);
  assert.match(updated, /<p>fim<\/p>/);
  assert.match(updated, /alt="um"/);
  assert.match(updated, /alt="dois"/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
