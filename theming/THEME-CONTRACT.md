# Theme Contract

Este repositório **não fornece tema visual de nenhuma empresa específica**. Toda skill deste repo que gera HTML recebe o tema como parâmetro externo — nunca hardcoded.

Cada empresa/usuário fornece seu próprio arquivo CSS com as variáveis abaixo. Qualquer arquivo que defina essas variáveis é compatível com as skills de geração de HTML deste repo.

## Variáveis obrigatórias

```css
:root {
  /* Cores */
  --color-primary: #000000;
  --color-secondary: #000000;
  --color-background: #ffffff;
  --color-text: #000000;
  --color-text-muted: #666666;
  --color-border: #cccccc;

  /* Tipografia */
  --font-family-base: sans-serif;
  --font-family-heading: sans-serif;

  /* Espaçamento */
  --spacing-unit: 8px;
  --radius-base: 4px;
}
```

## Variáveis opcionais

```css
:root {
  --color-success: #000000;
  --color-warning: #000000;
  --color-danger: #000000;
  --logo-url: none;
}
```

## Como usar

Skills que geram HTML aceitam um parâmetro `--theme-css <path>` (ou equivalente documentado no `SKILL.md` de cada uma) apontando para um arquivo que define essas variáveis. Se nenhum tema for informado, a skill aplica um fallback neutro mínimo (sem cor/marca de nenhuma empresa).

Ver [`example-theme/theme.css`](./example-theme/theme.css) para um exemplo de referência — **não usar em produção**, é só demonstração do contrato.
