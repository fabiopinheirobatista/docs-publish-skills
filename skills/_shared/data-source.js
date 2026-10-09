"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * Loads a generic data file (YAML or JSON) by extension.
 */
function loadDataFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo de dados nao encontrado: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") {
    return JSON.parse(content);
  }
  if (ext === ".yaml" || ext === ".yml") {
    return yaml.load(content);
  }
  throw new Error(`Extensao de arquivo de dados nao suportada: ${ext} (use .yaml, .yml ou .json)`);
}

function isDirectory(inputPath) {
  return fs.existsSync(inputPath) && fs.statSync(inputPath).isDirectory();
}

module.exports = {
  loadDataFile,
  isDirectory,
};
