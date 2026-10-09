#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const TAG_REGEX = /<svg\b[^>]*?(\/)?>|<\/svg\s*>/gi;
const ID_REGEX = /<svg\b[^>]*\bid=["']([^"']+)["']/i;

/**
 * Finds top-level <svg>...</svg> blocks, tracking nesting depth so a nested
 * <svg> (icon sprites, embedded diagrams) does not split a parent block.
 */
function extractSvgBlocks(content) {
  TAG_REGEX.lastIndex = 0;
  let match;
  let depth = 0;
  let blockStart = -1;
  const blocks = [];

  while ((match = TAG_REGEX.exec(content)) !== null) {
    const token = match[0];
    const isClosingTag = /^<\/svg/i.test(token);
    const isSelfClosing = !isClosingTag && /\/>$/.test(token);

    if (isClosingTag) {
      depth -= 1;
      if (depth === 0 && blockStart !== -1) {
        const end = match.index + token.length;
        blocks.push({ start: blockStart, end, content: content.slice(blockStart, end) });
        blockStart = -1;
      }
    } else if (isSelfClosing) {
      if (depth === 0) {
        const start = match.index;
        const end = match.index + token.length;
        blocks.push({ start, end, content: content.slice(start, end) });
      }
    } else {
      if (depth === 0) {
        blockStart = match.index;
      }
      depth += 1;
    }
  }

  return blocks;
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "diagram";
}

function deriveNames(blocks) {
  const used = new Set();
  return blocks.map((block, index) => {
    const idMatch = block.content.match(ID_REGEX);
    let base = idMatch ? sanitizeName(idMatch[1]) : `diagram-${index + 1}`;
    let name = base;
    let suffix = 2;
    while (used.has(name)) {
      name = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(name);
    return name;
  });
}

function toPosixPath(p) {
  return p.split(path.sep).join("/");
}

function run(args) {
  if (!args.input || !args.assetsDir) {
    throw new Error("Uso: extract.js --input <arquivo.html|arquivo.md> --assets-dir <pasta/assets>");
  }
  if (!fs.existsSync(args.input)) {
    throw new Error(`Arquivo de entrada nao encontrado: ${args.input}`);
  }

  const content = fs.readFileSync(args.input, "utf8");
  const blocks = extractSvgBlocks(content);

  if (blocks.length === 0) {
    return { updatedFile: null, assetsWritten: [] };
  }

  if (!fs.existsSync(args.assetsDir)) {
    fs.mkdirSync(args.assetsDir, { recursive: true });
  }

  const names = deriveNames(blocks);
  const assetsWritten = [];
  const inputDir = path.dirname(args.input);
  const relativeAssetsDir = toPosixPath(path.relative(inputDir, args.assetsDir) || ".");

  let updated = content;
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    const name = names[i];
    const assetPath = path.join(args.assetsDir, `${name}.svg`);
    fs.writeFileSync(assetPath, block.content, "utf8");
    assetsWritten.unshift(assetPath);

    const src = `${relativeAssetsDir}/${name}.svg`;
    const replacement = `<img src="${src}" alt="${name}">`;
    updated = updated.slice(0, block.start) + replacement + updated.slice(block.end);
  }

  fs.writeFileSync(args.input, updated, "utf8");

  return { updatedFile: args.input, assetsWritten };
}

function parseArgs(argv) {
  const args = { input: null, assetsDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i];
    else if (arg === "--assets-dir") args.assetsDir = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Uso: extract.js --input <arquivo.html|arquivo.md> --assets-dir <pasta/assets>");
    process.exit(0);
  }
  try {
    const result = run(args);
    if (result.assetsWritten.length === 0) {
      console.log("Nenhum SVG inline encontrado — nada a fazer.");
    } else {
      console.log(`Extraidos ${result.assetsWritten.length} SVG(s):`);
      result.assetsWritten.forEach((p) => console.log(`  - ${p}`));
      console.log(`Atualizado: ${result.updatedFile}`);
    }
  } catch (err) {
    console.error(`ERRO: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  extractSvgBlocks,
  sanitizeName,
  deriveNames,
  run,
  parseArgs,
};
