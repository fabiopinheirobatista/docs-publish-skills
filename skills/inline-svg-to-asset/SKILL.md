---
name: inline-svg-to-asset
description: Detecta SVG inline dentro de HTML ou markdown e extrai para arquivo .svg externo em assets/, substituindo a referência por uma tag <img>.
---

# inline-svg-to-asset

## Quando usar

Quando um visualizador não renderiza corretamente SVG inline com `<script>` embutido — caso real observado em preview de repositórios Git (ex.: Azure Repos) que bloqueiam `<script>` dentro de SVG inline por segurança.

## Como usar

```
inline-svg-to-asset --input <arquivo.html|arquivo.md> --assets-dir <pasta/assets>
```

- `--input`: arquivo HTML ou markdown contendo um ou mais blocos `<svg>...</svg>` inline
- `--assets-dir`: pasta de destino onde os arquivos `.svg` extraídos serão salvos

## Comportamento

1. Localiza cada bloco `<svg>...</svg>` inline no arquivo de entrada.
2. Extrai cada bloco para um arquivo `.svg` individual em `--assets-dir` (nome derivado de um identificador do diagrama, ou sequencial se não houver).
3. Substitui o bloco inline original por `<img src="assets/<nome>.svg" alt="...">`.

## Dependências

Nenhuma. Puramente estrutural/sintático — não depende de GSD nem de tema visual (não usa o [Theme Contract](../../theming/THEME-CONTRACT.md), já que não gera HTML novo, só reestrutura o existente).

## Inputs

- Arquivo HTML ou markdown com SVG inline

## Outputs

- Arquivo(s) `.svg` externos em `assets/`
- Arquivo de entrada atualizado, com as referências inline substituídas por `<img>`

## Escopo desta versão

Define o contrato da skill. A lógica de parsing/extração ainda não está implementada.
