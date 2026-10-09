---
name: md-to-html
description: Converte um arquivo markdown em HTML, aplicando um tema visual fornecido externamente pelo usuário (nunca embutido na skill).
---

# md-to-html

## Quando usar

Sempre que precisar transformar um documento markdown (wiki, manual, release notes) em uma página HTML apresentável, sem acoplar a aparência a nenhuma marca específica.

## Como usar

```
node skills/md-to-html/convert.js --input <arquivo.md> --output <arquivo.html> [--theme-css <tema.css>]
```

- `--input`: arquivo markdown de origem (obrigatório)
- `--output`: caminho do HTML gerado (obrigatório)
- `--theme-css`: caminho para um arquivo CSS que segue o [Theme Contract](../../theming/THEME-CONTRACT.md) (opcional — se omitido, aplica um fallback neutro embutido, sem marca de nenhuma empresa)

Requer Node.js. Dependência de parsing: [`marked`](https://www.npmjs.com/package/marked) (ver `package.json` na raiz do repo — rodar `npm install` antes do primeiro uso).

## Dependências

Nenhuma dependência de `.planning/` ou qualquer estrutura de projeto específica. Funciona com qualquer arquivo markdown isolado.

## Inputs

- Arquivo markdown válido
- (opcional) Arquivo de tema CSS conforme o Theme Contract

## Outputs

- Arquivo HTML standalone (um único arquivo, CSS do tema embutido inline em `<style>`), com título extraído do primeiro `# Heading` do markdown (ou do nome do arquivo, se não houver) e o conteúdo convertido.

## Exemplo

Ver [`example/input.md`](./example/input.md) e o resultado gerado em [`example/output.html`](./example/output.html) (gerado com `theming/example-theme/theme.css`).

## Testes

```
node skills/md-to-html/convert.test.js
```

## Escopo desta versão

Lógica de conversão implementada (`convert.js`): extração de título, parsing markdown → HTML via `marked`, resolução de tema (arquivo externo ou fallback neutro), geração de documento HTML standalone. Cobertura de testes básica em `convert.test.js`.
