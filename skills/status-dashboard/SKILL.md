---
name: status-dashboard
description: Gera um dashboard executivo em HTML (em produção / em desenvolvimento / no roadmap) em linguagem de negócio, a partir de dados de status de qualquer projeto.
---

# status-dashboard

## Quando usar

Quando for preciso comunicar o status de capacidades/features de um produto para público não-técnico (executivos, stakeholders de negócio), sem jargão de implementação.

## Como usar

```
status-dashboard --input <fonte> [--theme-css <tema.css>] --output <arquivo.html>
```

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

## Escopo desta versão

Define o contrato da skill. A lógica de leitura/parsing de GSD e do schema genérico, e a geração do HTML, ainda não estão implementadas.
