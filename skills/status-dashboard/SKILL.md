---
name: status-dashboard
description: Gera um dashboard executivo em HTML (em produção / em desenvolvimento / no roadmap) em linguagem de negócio, a partir de dados de status de qualquer projeto.
---

# status-dashboard

## Quando usar

Quando for preciso comunicar o status de capacidades/features de um produto para público não-técnico (executivos, stakeholders de negócio), sem jargão de implementação.

## Como usar

```
node skills/status-dashboard/generate.js --input <fonte> --output <arquivo.html> [--theme-css <tema.css>]
```

`<fonte>` pode ser:
- um diretório de projeto GSD (detectado por `.planning/ROADMAP.md`), ou
- um arquivo `.yaml`/`.yml`/`.json` seguindo o schema genérico abaixo

### Detecção automática de fonte (GSD opcional)

A skill tenta detectar, nesta ordem, se o projeto usa GSD:

1. Se existir `.planning/ROADMAP.md` e/ou `.planning/STATE.md` no diretório indicado por `--input`, usa esses arquivos como fonte de dados (fases e seus status).
2. Caso contrário, `--input` deve apontar para um arquivo genérico (YAML ou JSON) com o schema abaixo.

**GSD nunca é obrigatório.** A skill funciona sem qualquer estrutura GSD.

### Schema genérico (quando não há GSD)

```yaml
items:
  - nome: "Nome da capacidade"
    status: "producao" # producao | desenvolvimento | roadmap
    categoria: "Categoria de negócio"
```

## Dependências

Nenhuma dependência obrigatória de GSD. Quando GSD está presente, é usado como conveniência — nunca como requisito.

## Inputs

- Fonte de dados (GSD ou schema genérico)
- (opcional) Tema CSS conforme [Theme Contract](../../theming/THEME-CONTRACT.md)

## Outputs

- HTML com dashboard agrupado por status (produção / desenvolvimento / roadmap), em linguagem de negócio — sem nomes de fases técnicas, sem jargão.

## Exemplo

Ver [`example/items.yaml`](./example/items.yaml) e o resultado em [`example/output.html`](./example/output.html).

## Testes

```
node skills/status-dashboard/generate.test.js
node skills/status-dashboard/generate.integration.test.js
```

Os testes de integração invocam o CLI real como subprocesso (`node generate.js --input ... --output ...`), usando apenas fixtures sintéticas geradas em diretórios temporários — cobrem os caminhos YAML, JSON, GSD sintético, tema externo, fallback de tema, e os erros de uso/diretório inválido.

## Escopo desta versão

Lógica implementada: detecção de projeto GSD (lê `.planning/ROADMAP.md`, classifica fases concluídas como "produção" e o restante por heurística de palavras-chave — ver `skills/_shared/gsd-roadmap.js`), leitura do schema genérico (YAML/JSON), agrupamento por status e geração do HTML.

**Importante sobre o modo GSD:** o GSD não tem conceito nativo de "categoria de negócio" nem linguagem de negócio traduzida — a skill usa o título da fase como está. Para controle preciso da linguagem exibida, use o schema genérico.
