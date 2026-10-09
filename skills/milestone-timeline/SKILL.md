---
name: milestone-timeline
description: Transforma uma lista de marcos/entregas técnicas em uma timeline visual HTML, traduzida para o que cada entrega significou para o negócio.
---

# milestone-timeline

## Quando usar

Quando for preciso apresentar um histórico de entregas para público não-técnico, mostrando o impacto de negócio de cada marco em vez de termos de implementação.

## Como usar

```
node skills/milestone-timeline/generate.js --input <fonte> --output <arquivo.html> [--theme-css <tema.css>]
```

`<fonte>` pode ser:
- um diretório de projeto GSD (detectado por `.planning/ROADMAP.md`), ou
- um arquivo `.yaml`/`.yml`/`.json` seguindo o schema genérico abaixo

### Fonte de dados (GSD opcional)

- Se `--input` apontar para um diretório com `.planning/phases/`, a skill pode usar essa estrutura como fonte alternativa de marcos.
- Caso contrário, `--input` aponta para um arquivo genérico (YAML/JSON) com o schema abaixo.

**GSD nunca é obrigatório.**

### Schema genérico

```yaml
marcos:
  - data: "2026-01-15"
    descricao_tecnica: "Descrição técnica do que foi entregue"
    impacto_negocio: "O que isso significou para o negócio, em linguagem simples"
```

## Dependências

Nenhuma dependência obrigatória. GSD é uma fonte alternativa, não um requisito.

## Inputs

- Fonte de dados (GSD ou schema genérico)
- (opcional) Tema CSS conforme [Theme Contract](../../theming/THEME-CONTRACT.md)

## Outputs

- HTML com timeline visual ordenada por data, exibindo `impacto_negocio` como texto principal (não `descricao_tecnica`).

## Exemplo

Ver [`example/marcos.yaml`](./example/marcos.yaml) e o resultado em [`example/output.html`](./example/output.html).

## Testes

```
node skills/milestone-timeline/generate.test.js
```

## Escopo desta versão

Lógica implementada: detecção de projeto GSD (lê a tabela "## Progress" de `.planning/ROADMAP.md`, usando apenas fases com data de conclusão real), leitura do schema genérico, ordenação cronológica e geração do HTML.

**Importante sobre o modo GSD:** o GSD não tem campo de "impacto de negócio" — no modo GSD, `impacto_negocio` e `descricao_tecnica` usam o mesmo texto (nome da fase + status). Para a tradução real pra linguagem de negócio, use o schema genérico com `impacto_negocio` preenchido manualmente.
