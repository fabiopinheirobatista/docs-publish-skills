# docs-publish-skills

Skills reutilizáveis para gerar documentação (Wikis, manuais em HTML) a partir de markdown ou de dados de projeto — agnósticas de empresa e de framework de planejamento.

## Princípios

- **Zero branding fixo**: nenhuma skill embute tema visual de nenhuma empresa. O tema (cores, fontes, espaçamento) é sempre fornecido externamente pelo usuário, seguindo o [Theme Contract](./theming/THEME-CONTRACT.md). Sem tema informado, aplica-se um fallback neutro.
- **GSD opcional**: skills que podem se beneficiar de um projeto estruturado em [GSD](https://github.com/opengsd/gsd-core) detectam automaticamente `.planning/ROADMAP.md`, mas nunca exigem GSD — sempre aceitam um schema genérico (YAML/JSON) como alternativa.
- **Multi-empresa**: pensado para ser usado em qualquer organização, não só na Accenture.

## Instalação

```bash
npm install
```

## Skills

### [md-to-html](./skills/md-to-html/SKILL.md)
Converte um arquivo markdown em uma página HTML standalone.
```bash
node skills/md-to-html/convert.js --input doc.md --output doc.html --theme-css tema.css
```

### [status-dashboard](./skills/status-dashboard/SKILL.md)
Gera um dashboard executivo (em produção / em desenvolvimento / no roadmap) em linguagem de negócio.
```bash
node skills/status-dashboard/generate.js --input items.yaml --output dashboard.html --theme-css tema.css
```

### [milestone-timeline](./skills/milestone-timeline/SKILL.md)
Transforma marcos técnicos em uma timeline visual traduzida para impacto de negócio.
```bash
node skills/milestone-timeline/generate.js --input marcos.yaml --output timeline.html --theme-css tema.css
```

### [inline-svg-to-asset](./skills/inline-svg-to-asset/SKILL.md)
Extrai SVG inline de HTML/markdown para arquivos `.svg` externos (compatibilidade com visualizadores que bloqueiam `<script>` em SVG inline, ex. preview do Azure Repos).
```bash
node skills/inline-svg-to-asset/extract.js --input pagina.html --assets-dir assets
```

## Testes

```bash
npm test
```

## Estrutura

```
docs-publish-skills/
  skills/
    _shared/              # módulos comuns (tema, parser GSD, leitor YAML/JSON)
    md-to-html/
    status-dashboard/
    milestone-timeline/
    inline-svg-to-asset/
  theming/
    THEME-CONTRACT.md     # contrato de variáveis CSS que qualquer tema externo deve seguir
    example-theme/        # tema de demonstração (não usar em produção)
```
