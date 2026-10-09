"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  extractTitle,
  convertMarkdownToHtml,
  buildHtmlDocument,
  resolveTheme,
  run,
  FALLBACK_THEME_CSS,
} = require("./convert.js");

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

test("extractTitle usa o primeiro H1 do markdown", () => {
  const title = extractTitle("# Titulo Principal\n\nTexto.", "fallback");
  assert.strictEqual(title, "Titulo Principal");
});

test("extractTitle usa fallback quando nao ha H1", () => {
  const title = extractTitle("Sem titulo aqui.", "fallback");
  assert.strictEqual(title, "fallback");
});

test("convertMarkdownToHtml converte elementos basicos", () => {
  const html = convertMarkdownToHtml("# Ola\n\n**negrito** e [link](https://exemplo.com)");
  assert.match(html, /<h1/);
  assert.match(html, /<strong>negrito<\/strong>/);
  assert.match(html, /<a href="https:\/\/exemplo.com">link<\/a>/);
});

test("resolveTheme retorna fallback neutro quando nao ha tema", () => {
  const css = resolveTheme(null);
  assert.strictEqual(css, FALLBACK_THEME_CSS);
});

test("resolveTheme lanca erro quando o tema nao existe", () => {
  assert.throws(() => resolveTheme("./tema-inexistente.css"), /nao encontrado/);
});

test("buildHtmlDocument embute titulo, tema e corpo", () => {
  const html = buildHtmlDocument({
    title: "Pagina de Teste",
    bodyHtml: "<p>conteudo</p>",
    themeCss: ":root { --color-primary: #000; }",
  });
  assert.match(html, /<title>Pagina de Teste<\/title>/);
  assert.match(html, /--color-primary: #000;/);
  assert.match(html, /<p>conteudo<\/p>/);
});

test("run gera arquivo HTML a partir de um markdown real", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "md-to-html-test-"));
  const inputPath = path.join(tmpDir, "input.md");
  const outputPath = path.join(tmpDir, "output.html");
  fs.writeFileSync(inputPath, "# Documento\n\nConteudo de teste.");

  const result = run({ input: inputPath, output: outputPath, themeCss: null });

  assert.strictEqual(result, outputPath);
  const html = fs.readFileSync(outputPath, "utf8");
  assert.match(html, /<title>Documento<\/title>/);
  assert.match(html, /Conteudo de teste\./);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("run lanca erro quando o markdown de entrada nao existe", () => {
  assert.throws(
    () => run({ input: "./nao-existe.md", output: "./saida.html", themeCss: null }),
    /nao encontrado/
  );
});
