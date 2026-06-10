# Silhouette Audio Visualizer — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the browser app and deliver a playable preview — audio MP3 driving bar visualization on line and circle shapes, with live `pointCount` and `peakHeight` controls.

**Architecture:** Vite + TypeScript monolith. Core types and pure functions in `src/core/` with no DOM dependency. Shape providers generate `EmissionSource`. `SpectrumMapper` resamples FFT to `pointCount` energies. `BarsRenderer` draws on canvas. `FramePipeline` orchestrates the animation loop.

**Tech Stack:** TypeScript, Vite, Vitest, Web Audio API, Canvas 2D, plain HTML controls.

**Spec:** `docs/superpowers/specs/2026-06-10-silhouette-audio-viz-design.md`

---

## File Map (Phase 1)

| File | Responsibility |
|---|---|
| `package.json` | deps: vite, typescript, vitest |
| `index.html` | canvas + file input + sliders |
| `src/main.ts` | bootstrap `App` |
| `src/core/types.ts` | all shared interfaces |
| `src/core/color-gradient.ts` | gradient sampling |
| `src/core/shape-path.ts` | resample path to N points + normals |
| `src/core/shape-providers/line-provider.ts` | line shape |
| `src/core/shape-providers/circle-provider.ts` | circle shape |
| `src/core/audio-analyzer.ts` | Web Audio FFT wrapper |
| `src/core/spectrum-mapper.ts` | FFT → energies |
| `src/render/bars-renderer.ts` | draw bars on canvas |
| `src/pipeline/frame-pipeline.ts` | rAF loop |
| `src/ui/controls.ts` | wire sliders to VisualConfig |
| `src/ui/app.ts` | glue everything |
| `src/core/spectrum-mapper.test.ts` | unit tests |
| `src/core/shape-path.test.ts` | unit tests |

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "silhouette-audio-viz",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Silhouette Audio Viz</title>
    <style>
      * { box-sizing: border-box; margin: 0; }
      body { background: #0a0a12; color: #eee; font-family: system-ui, sans-serif; }
      #app { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; }
      canvas { background: #000; border-radius: 8px; max-width: 100%; }
      .controls { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }
      label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
      input[type="range"] { width: 160px; }
    </style>
  </head>
  <body>
    <div id="app">
      <canvas id="viz" width="800" height="500"></canvas>
      <div class="controls" id="controls"></div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create .gitignore**

```
node_modules
dist
*.local
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`  
Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Verify dev server starts**

Run: `npm run dev`  
Expected: Vite serves on `http://localhost:5173` (blank page OK).

---

### Task 2: Core types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Write types**

```typescript
export interface ShapePath {
  points: Float32Array;
  pointCount: number;
}

export interface SampledPoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  tx: number;
  ty: number;
  arcIndex: number;
}

export interface EmissionSource {
  type: 'path' | 'mask';
  sampled: SampledPoint[];
  path?: ShapePath;
}

export interface AudioFrame {
  frequencies: Float32Array;
  time: number;
}

export interface ColorGradient {
  stops: Array<{ position: number; r: number; g: number; b: number }>;
}

export interface VisualConfig {
  pointCount: number;
  peakHeight: number;
  minHeight: number;
  renderMode: 'bars' | 'wave';
  barWidth: number;
  barGap: number;
  barRoundness: number;
  waveLayers: number;
  waveSymmetry: boolean;
  waveSmoothing: number;
  colorMode: 'mono' | 'gradient' | 'frequency';
  colorGradient: ColorGradient;
  glowIntensity: number;
  smoothing: number;
}

export interface MappedFrame {
  energies: Float32Array;
  colors: Float32Array;
}

export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  pointCount: 128,
  peakHeight: 1.0,
  minHeight: 0.02,
  renderMode: 'bars',
  barWidth: 4,
  barGap: 2,
  barRoundness: 2,
  waveLayers: 3,
  waveSymmetry: true,
  waveSmoothing: 0.5,
  colorMode: 'gradient',
  colorGradient: {
    stops: [
      { position: 0, r: 0, g: 255, b: 255 },
      { position: 0.5, r: 100, g: 100, b: 255 },
      { position: 1, r: 255, g: 0, b: 200 },
    ],
  },
  glowIntensity: 0.8,
  smoothing: 0.7,
};

export type ShapeKind = 'line' | 'circle';
```

- [ ] **Step 2: Create stub main.ts**

```typescript
import { DEFAULT_VISUAL_CONFIG } from './core/types';

console.log('silhouette-audio-viz', DEFAULT_VISUAL_CONFIG.pointCount);
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`  
Expected: no errors.

---

### Task 3: Shape path sampling

**Files:**
- Create: `src/core/shape-path.ts`, `src/core/shape-path.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { samplePath, makeCirclePath, makeLinePath } from './shape-path';

describe('samplePath', () => {
  it('returns pointCount sampled points', () => {
    const path = makeCirclePath(0.5, 0.5, 0.3);
    const sampled = samplePath(path, 64);
    expect(sampled).toHaveLength(64);
  });

  it('circle normals point outward', () => {
    const path = makeCirclePath(0.5, 0.5, 0.3);
    const sampled = samplePath(path, 8);
    const top = sampled[0];
    expect(top.ny).toBeLessThan(0);
  });

  it('line has constant normal', () => {
    const path = makeLinePath(0.1, 0.5, 0.9, 0.5);
    const sampled = samplePath(path, 16);
    for (const p of sampled) {
      expect(p.ny).toBeCloseTo(-1, 1);
    }
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test`  
Expected: FAIL — module not found.

- [ ] **Step 3: Implement shape-path.ts**

```typescript
import type { ShapePath, SampledPoint } from './types';

export function makeLinePath(x0: number, y0: number, x1: number, y1: number): ShapePath {
  return { points: new Float32Array([x0, y0, x1, y1]), pointCount: 2 };
}

export function makeCirclePath(cx: number, cy: number, r: number, segments = 256): ShapePath {
  const points = new Float32Array(segments * 2);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points[i * 2] = cx + Math.cos(a) * r;
    points[i * 2 + 1] = cy + Math.sin(a) * r;
  }
  return { points, pointCount: segments };
}

export function samplePath(path: ShapePath, count: number): SampledPoint[] {
  const { points, pointCount } = path;
  const arcLengths: number[] = [0];
  let total = 0;

  for (let i = 0; i < pointCount; i++) {
    const i0 = i % pointCount;
    const i1 = (i + 1) % pointCount;
    const dx = points[i1 * 2] - points[i0 * 2];
    const dy = points[i1 * 2 + 1] - points[i0 * 2 + 1];
    total += Math.hypot(dx, dy);
    arcLengths.push(total);
  }

  const result: SampledPoint[] = [];

  for (let s = 0; s < count; s++) {
    const t = (s / count) * total;
    let seg = 0;
    while (seg < pointCount && arcLengths[seg + 1] < t) seg++;

    const segStart = arcLengths[seg];
    const segLen = arcLengths[seg + 1] - segStart || 1;
    const local = (t - segStart) / segLen;

    const i0 = seg % pointCount;
    const i1 = (seg + 1) % pointCount;
    const x0 = points[i0 * 2], y0 = points[i0 * 2 + 1];
    const x1 = points[i1 * 2], y1 = points[i1 * 2 + 1];

    const x = x0 + (x1 - x0) * local;
    const y = y0 + (y1 - y0) * local;

    const tx = x1 - x0;
    const ty = y1 - y0;
    const tLen = Math.hypot(tx, ty) || 1;
    const ntx = tx / tLen;
    const nty = ty / tLen;
    const nx = -nty;
    const ny = ntx;

    result.push({ x, y, nx, ny, tx: ntx, ty: nty, arcIndex: s / count });
  }

  return result;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test`  
Expected: all tests PASS.

---

### Task 4: Shape providers

**Files:**
- Create: `src/core/shape-providers/line-provider.ts`, `src/core/shape-providers/circle-provider.ts`

- [ ] **Step 1: Implement line-provider.ts**

```typescript
import { makeLinePath, samplePath } from '../shape-path';
import type { EmissionSource, VisualConfig } from '../types';

export class LineProvider {
  constructor(
    private x0 = 0.1,
    private y0 = 0.5,
    private x1 = 0.9,
    private y1 = 0.5,
  ) {}

  getEmissionSource(config: VisualConfig): EmissionSource {
    const path = makeLinePath(this.x0, this.y0, this.x1, this.y1);
    return { type: 'path', path, sampled: samplePath(path, config.pointCount) };
  }
}
```

- [ ] **Step 2: Implement circle-provider.ts**

```typescript
import { makeCirclePath, samplePath } from '../shape-path';
import type { EmissionSource, VisualConfig } from '../types';

export class CircleProvider {
  constructor(
    private cx = 0.5,
    private cy = 0.5,
    private r = 0.35,
  ) {}

  getEmissionSource(config: VisualConfig): EmissionSource {
    const path = makeCirclePath(this.cx, this.cy, this.r);
    return { type: 'path', path, sampled: samplePath(path, config.pointCount) };
  }
}
```

---

### Task 5: Color gradient + spectrum mapper

**Files:**
- Create: `src/core/color-gradient.ts`, `src/core/spectrum-mapper.ts`, `src/core/spectrum-mapper.test.ts`

- [ ] **Step 1: Write failing spectrum mapper tests**

```typescript
import { describe, it, expect } from 'vitest';
import { SpectrumMapper } from './spectrum-mapper';
import { DEFAULT_VISUAL_CONFIG } from './types';

describe('SpectrumMapper', () => {
  it('resamples to pointCount', () => {
    const mapper = new SpectrumMapper(DEFAULT_VISUAL_CONFIG);
    const freqs = new Float32Array(64).fill(0.5);
    const frame = mapper.map({ frequencies: freqs, time: 0 });
    expect(frame.energies.length).toBe(DEFAULT_VISUAL_CONFIG.pointCount);
  });

  it('applies peakHeight multiplier', () => {
    const config = { ...DEFAULT_VISUAL_CONFIG, peakHeight: 2.0, smoothing: 0 };
    const mapper = new SpectrumMapper(config);
    const freqs = new Float32Array(64).fill(1.0);
    const frame = mapper.map({ frequencies: freqs, time: 0 });
    expect(frame.energies[0]).toBeGreaterThan(1.5);
  });

  it('respects minHeight floor', () => {
    const config = { ...DEFAULT_VISUAL_CONFIG, minHeight: 0.1, smoothing: 0 };
    const mapper = new SpectrumMapper(config);
    const freqs = new Float32Array(64).fill(0);
    const frame = mapper.map({ frequencies: freqs, time: 0 });
    expect(frame.energies[0]).toBeGreaterThanOrEqual(0.1);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test`

- [ ] **Step 3: Implement color-gradient.ts**

```typescript
import type { ColorGradient } from './types';

export function sampleGradient(gradient: ColorGradient, t: number): [number, number, number] {
  const { stops } = gradient;
  const clamped = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < stops.length - 1 && stops[i + 1].position < clamped) i++;

  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const range = b.position - a.position || 1;
  const local = (clamped - a.position) / range;

  return [
    a.r + (b.r - a.r) * local,
    a.g + (b.g - a.g) * local,
    a.b + (b.b - a.b) * local,
  ];
}
```

- [ ] **Step 4: Implement spectrum-mapper.ts**

```typescript
import type { AudioFrame, MappedFrame, VisualConfig } from './types';
import { sampleGradient } from './color-gradient';

export class SpectrumMapper {
  private smoothed: Float32Array;

  constructor(private config: VisualConfig) {
    this.smoothed = new Float32Array(config.pointCount);
  }

  updateConfig(config: VisualConfig): void {
    if (config.pointCount !== this.config.pointCount) {
      this.smoothed = new Float32Array(config.pointCount);
    }
    this.config = config;
  }

  map(audio: AudioFrame): MappedFrame {
    const { pointCount, peakHeight, minHeight, smoothing, colorMode, colorGradient } = this.config;
    const energies = new Float32Array(pointCount);
    const colors = new Float32Array(pointCount * 3);
    const src = audio.frequencies;
    const srcLen = src.length;

    for (let i = 0; i < pointCount; i++) {
      const srcIdx = (i / pointCount) * (srcLen - 1);
      const i0 = Math.floor(srcIdx);
      const i1 = Math.min(i0 + 1, srcLen - 1);
      const frac = srcIdx - i0;
      const raw = (src[i0] * (1 - frac) + src[i1] * frac) / 255;

      this.smoothed[i] = this.smoothed[i] * smoothing + raw * (1 - smoothing);
      const h = Math.max(minHeight, this.smoothed[i] * peakHeight);
      energies[i] = h;

      let r = 255, g = 255, b = 255;
      if (colorMode === 'gradient' || colorMode === 'frequency') {
        const t = colorMode === 'frequency' ? i / pointCount : i / pointCount;
        [r, g, b] = sampleGradient(colorGradient, t);
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    return { energies, colors };
  }
}
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test`

---

### Task 6: Audio analyzer

**Files:**
- Create: `src/media/audio-source.ts`, `src/core/audio-analyzer.ts`

- [ ] **Step 1: Implement audio-source.ts**

```typescript
export async function loadAudioFile(file: File): Promise<HTMLAudioElement> {
  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  audio.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
    audio.addEventListener('error', () => reject(new Error('Failed to load audio')), { once: true });
    audio.load();
  });
  return audio;
}
```

- [ ] **Step 2: Implement audio-analyzer.ts**

```typescript
import type { AudioFrame } from './types';

export class AudioAnalyzer {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private buffer: Uint8Array;
  private source: MediaElementAudioSourceNode | null = null;

  constructor(fftSize = 256) {
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.connect(this.context.destination);
  }

  connect(audio: HTMLAudioElement): void {
    if (this.source) this.source.disconnect();
    this.source = this.context.createMediaElementSource(audio);
    this.source.connect(this.analyser);
  }

  async resume(): Promise<void> {
    if (this.context.state === 'suspended') await this.context.resume();
  }

  getFrame(): AudioFrame {
    this.analyser.getByteFrequencyData(this.buffer);
    return {
      frequencies: Float32Array.from(this.buffer),
      time: this.context.currentTime,
    };
  }

  get currentTime(): number {
    return this.context.currentTime;
  }
}
```

---

### Task 7: Bars renderer

**Files:**
- Create: `src/render/bars-renderer.ts`

- [ ] **Step 1: Implement bars-renderer.ts**

```typescript
import type { EmissionSource, MappedFrame, VisualConfig } from '../core/types';

export class BarsRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    source: EmissionSource,
    frame: MappedFrame,
    config: VisualConfig,
    width: number,
    height: number,
  ): void {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width, height);
    const maxBarPx = scale * 0.25;

    const { sampled } = source;
    const { energies, colors } = frame;

    for (let i = 0; i < sampled.length; i++) {
      const p = sampled[i];
      const energy = energies[i];
      const barLen = energy * maxBarPx;

      const px = p.x * width;
      const py = p.y * height;
      const nx = p.nx;
      const ny = p.ny;

      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];

      ctx.strokeStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.lineWidth = config.barWidth;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + nx * barLen, py + ny * barLen);
      ctx.stroke();
    }
  }
}
```

---

### Task 8: Frame pipeline + UI + App

**Files:**
- Create: `src/pipeline/frame-pipeline.ts`, `src/ui/controls.ts`, `src/ui/app.ts`, `src/main.ts`

- [ ] **Step 1: Implement frame-pipeline.ts**

```typescript
export type FrameCallback = (dt: number) => void;

export class FramePipeline {
  private running = false;
  private rafId = 0;
  private lastTime = 0;

  constructor(private onFrame: FrameCallback) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.onFrame(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}
```

- [ ] **Step 2: Implement controls.ts**

```typescript
import type { ShapeKind, VisualConfig } from '../core/types';

export interface ControlCallbacks {
  onConfigChange: (config: VisualConfig) => void;
  onShapeChange: (shape: ShapeKind) => void;
  onAudioFile: (file: File) => void;
  onPlay: () => void;
  onPause: () => void;
}

export function mountControls(container: HTMLElement, config: VisualConfig, cb: ControlCallbacks): void {
  container.innerHTML = `
    <label>Áudio <input type="file" accept="audio/*" id="audio-file" /></label>
    <label>Forma
      <select id="shape">
        <option value="line">Linha</option>
        <option value="circle">Círculo</option>
      </select>
    </label>
    <label>Pontos <input type="range" id="point-count" min="16" max="512" step="8" value="${config.pointCount}" />
      <span id="point-count-val">${config.pointCount}</span></label>
    <label>Altura dos picos <input type="range" id="peak-height" min="0.1" max="3" step="0.1" value="${config.peakHeight}" />
      <span id="peak-height-val">${config.peakHeight}</span></label>
    <button id="play">Play</button>
    <button id="pause">Pause</button>
  `;

  container.querySelector('#audio-file')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) cb.onAudioFile(file);
  });

  container.querySelector('#shape')!.addEventListener('change', (e) => {
    cb.onShapeChange((e.target as HTMLSelectElement).value as ShapeKind);
  });

  const bindRange = (id: string, valId: string, key: keyof VisualConfig) => {
    const input = container.querySelector(`#${id}`) as HTMLInputElement;
    const val = container.querySelector(`#${valId}`)!;
    input.addEventListener('input', () => {
      val.textContent = input.value;
      cb.onConfigChange({ ...config, [key]: parseFloat(input.value) });
    });
  };

  bindRange('point-count', 'point-count-val', 'pointCount');
  bindRange('peak-height', 'peak-height-val', 'peakHeight');

  container.querySelector('#play')!.addEventListener('click', () => cb.onPlay());
  container.querySelector('#pause')!.addEventListener('click', () => cb.onPause());
}
```

- [ ] **Step 3: Implement app.ts**

```typescript
import { AudioAnalyzer } from '../core/audio-analyzer';
import { SpectrumMapper } from '../core/spectrum-mapper';
import { CircleProvider } from '../core/shape-providers/circle-provider';
import { LineProvider } from '../core/shape-providers/line-provider';
import { DEFAULT_VISUAL_CONFIG, type ShapeKind, type VisualConfig } from '../core/types';
import { loadAudioFile } from '../media/audio-source';
import { FramePipeline } from '../pipeline/frame-pipeline';
import { BarsRenderer } from '../render/bars-renderer';
import { mountControls } from './controls';

export class App {
  private config: VisualConfig = { ...DEFAULT_VISUAL_CONFIG };
  private shape: ShapeKind = 'circle';
  private analyzer = new AudioAnalyzer();
  private mapper = new SpectrumMapper(this.config);
  private renderer = new BarsRenderer();
  private lineProvider = new LineProvider();
  private circleProvider = new CircleProvider();
  private pipeline: FramePipeline;
  private audio: HTMLAudioElement | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    controlsEl: HTMLElement,
  ) {
    this.pipeline = new FramePipeline(() => this.tick());
    mountControls(controlsEl, this.config, {
      onConfigChange: (c) => {
        this.config = c;
        this.mapper.updateConfig(c);
      },
      onShapeChange: (s) => { this.shape = s; },
      onAudioFile: (f) => this.loadAudio(f),
      onPlay: () => this.play(),
      onPause: () => this.pause(),
    });
  }

  private getProvider() {
    return this.shape === 'line' ? this.lineProvider : this.circleProvider;
  }

  private async loadAudio(file: File): Promise<void> {
    this.audio = await loadAudioFile(file);
    this.analyzer.connect(this.audio);
  }

  private async play(): Promise<void> {
    await this.analyzer.resume();
    this.audio?.play();
    this.pipeline.start();
  }

  private pause(): void {
    this.audio?.pause();
    this.pipeline.stop();
  }

  private tick(): void {
    const ctx = this.canvas.getContext('2d')!;
    const source = this.getProvider().getEmissionSource(this.config);
    const audioFrame = this.analyzer.getFrame();
    const mapped = this.mapper.map(audioFrame);
    this.renderer.draw(ctx, source, mapped, this.config, this.canvas.width, this.canvas.height);
  }
}
```

- [ ] **Step 4: Wire main.ts**

```typescript
import { App } from './ui/app';

const canvas = document.querySelector('#viz') as HTMLCanvasElement;
const controls = document.querySelector('#controls') as HTMLElement;
new App(canvas, controls);
```

---

### Task 9: Manual verification

- [ ] **Step 1: Run dev server**

Run: `npm run dev`

- [ ] **Step 2: Manual test checklist**

1. Open `http://localhost:5173`
2. Upload an MP3 file
3. Click Play — bars should animate on circle
4. Switch to Line — bars along horizontal line
5. Drag "Pontos" slider — bar count changes live
6. Drag "Altura dos picos" — bar height changes live

- [ ] **Step 3: Run unit tests**

Run: `npm test`  
Expected: all PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`  
Expected: `dist/` created without errors.

---

## Phase 1 Complete When

- [ ] Vite app runs in browser
- [ ] MP3 drives bar visualization on line and circle
- [ ] `pointCount` and `peakHeight` sliders work live
- [ ] Unit tests pass for `shape-path` and `spectrum-mapper`
- [ ] Production build succeeds

## Next Plan

Phase 2: `wave-renderer.ts` with glow layers, symmetry, and gradient — see spec section 7.2.
