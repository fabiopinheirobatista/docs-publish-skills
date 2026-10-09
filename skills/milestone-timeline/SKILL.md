---
name: milestone-timeline
description: Transforma uma lista de marcos/entregas técnicas em uma timeline visual HTML, traduzida para o que cada entrega significou para o negócio.
---

# milestone-timeline

## Quando usar

Quando for preciso apresentar um histórico de entregas para público não-técnico, mostrando o impacto de negócio de cada marco em vez de termos de implementação.

## Como usar

```
milestone-timeline --input <fonte> [--theme-css <tema.css>] --output <arquivo.html>
```

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

## Escopo desta versão

Define o contrato da skill. A lógica de leitura de fontes e geração do HTML ainda não está implementada.
