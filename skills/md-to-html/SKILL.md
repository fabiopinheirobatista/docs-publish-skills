---
name: md-to-html
description: Converte um arquivo markdown em HTML, aplicando um tema visual fornecido externamente pelo usuário (nunca embutido na skill).
---

# md-to-html

## Quando usar

Sempre que precisar transformar um documento markdown (wiki, manual, release notes) em uma página HTML apresentável, sem acoplar a aparência a nenhuma marca específica.

## Como usar

```
md-to-html --input <arquivo.md> --output <arquivo.html> [--theme-css <tema.css>]
```

- `--input`: arquivo markdown de origem (obrigatório)
- `--output`: caminho do HTML gerado (obrigatório)
- `--theme-css`: caminho para um arquivo CSS que segue o [Theme Contract](../../theming/THEME-CONTRACT.md) (opcional — se omitido, aplica fallback neutro sem marca)

## Dependências

Nenhuma. Não depende de GSD, `.planning/`, ou qualquer estrutura de projeto específica. Funciona com qualquer arquivo markdown isolado.

## Inputs

- Arquivo markdown válido
- (opcional) Arquivo de tema CSS conforme o Theme Contract

## Outputs

- Arquivo HTML standalone, com o CSS do tema vinculado (via `<link>` ou inline, a definir na implementação) e conteúdo markdown convertido.

## Escopo desta versão

Este documento define o contrato da skill (inputs, outputs, dependências). A lógica de parsing/geração de HTML ainda não está implementada — é a base estrutural para implementação posterior.
