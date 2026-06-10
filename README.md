# Silhouette Audio Viz

Visualizador de áudio no browser. Mapeia FFT em tempo real como barras ou ondas ao longo de contornos configuráveis — de formas geométricas simples até silhuetas extraídas de imagens e vídeo.

## Status

**Fase 1** — preview com linha/círculo, modo barras, controles `pointCount` e `peakHeight`.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`, carregue um MP3 e clique Play.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm test` | Testes unitários (Vitest) |

## Documentação

- Design: `docs/superpowers/specs/2026-06-10-silhouette-audio-viz-design.md`
- Plano Fase 1: `docs/superpowers/plans/2026-06-10-silhouette-audio-viz-phase1.md`

## Stack

TypeScript, Vite, Web Audio API, Canvas 2D — zero dependências de runtime.
