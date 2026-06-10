# Silhouette Audio Visualizer — Design Spec

**Date:** 2026-06-10  
**Status:** Approved  
**Goal:** Browser app that visualizes audio as bars or smooth waves emanating from configurable shapes — including silhouettes extracted from images and video (Bad Apple style).

---

## 1. Overview

A modular browser monolith that maps real-time FFT audio data onto emission points along a shape contour. Shapes range from simple geometry (line, circle, polygon) to silhouettes derived from images or video frames.

**Inspiration:** [SebLague/Smoke-Simulation](https://github.com/SebLague/Smoke-Simulation) — reuse only the silhouette pipeline (solid cells + outline detection). Visual output is **bars** or **wave**, not smoke/fluid simulation.

**Delivery priority:** Interactive preview first (Phases 1–5), video export later (Phase 6).

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type-safe interfaces for core contracts; easy refactoring |
| Build | Vite | Minimal config, fast HMR |
| UI | HTML + TS modules | No framework overhead for slider-heavy controls |
| Audio | Web Audio API (`AnalyserNode`) | Zero dependencies; native FFT |
| Media decode | `<audio>`, `<video>`, `requestVideoFrameCallback` | Standard browser APIs for MP3/MP4/WAV/OGG |
| Image processing | Canvas 2D + OffscreenCanvas in Worker | Grayscale, blur, threshold without blocking UI |
| Render | Canvas 2D | Bars, smooth curves, gradient glow layers |
| Frame cache | IndexedDB | Persist preprocessed video silhouettes |
| Export (Phase 6) | MediaRecorder + `canvas.captureStream()` | Record preview output to WebM |

No external dependencies in v1.

---

## 3. Architecture

```
src/
├── core/
│   ├── types.ts
│   ├── mask-grid.ts
│   ├── outline-extractor.ts
│   ├── shape-providers/
│   │   ├── shape-provider.ts
│   │   ├── line-provider.ts
│   │   ├── circle-provider.ts
│   │   ├── polygon-provider.ts
│   │   ├── image-mask-provider.ts
│   │   └── video-mask-sequence.ts
│   ├── audio-analyzer.ts
│   ├── spectrum-mapper.ts
│   └── color-gradient.ts
├── render/
│   ├── render-backend.ts
│   ├── bars-renderer.ts
│   ├── wave-renderer.ts
│   └── composite-renderer.ts
├── media/
│   ├── audio-source.ts
│   ├── video-decoder.ts
│   └── frame-processor.ts
├── pipeline/
│   ├── playback-clock.ts
│   └── frame-pipeline.ts
├── export/
│   └── video-recorder.ts
├── workers/
│   └── mask-preprocess.worker.ts
└── ui/
    ├── controls.ts
    └── app.ts
```

### Data flow

```
Media Input → Shape Provider → EmissionSource
Audio Input → AudioAnalyzer → AudioFrame
EmissionSource + AudioFrame + VisualConfig → SpectrumMapper → MappedFrame
MappedFrame → BarsRenderer | WaveRenderer → Canvas
(Optional) MaskGrid B&W → CompositeRenderer background
```

---

## 4. Core Types

```typescript
/** Closed path in normalized 0..1 coordinates */
interface ShapePath {
  points: Float32Array; // [x0,y0, x1,y1, ...]
  pointCount: number;
}

/** Binary grid — "solid cells" (Seb-style) */
interface MaskGrid {
  width: number;
  height: number;
  data: Uint8Array; // 0 = empty, 1 = solid
}

/** Single emission point on a silhouette outline */
interface OutlinePoint {
  x: number;
  y: number;
  nx: number; // outward normal
  ny: number;
  arcIndex: number; // 0..1 position along contour
}

interface EmissionSource {
  type: 'path' | 'mask';
  path?: ShapePath;
  outline?: OutlinePoint[];
  mask?: MaskGrid;
}

interface AudioFrame {
  frequencies: Float32Array;
  time: number;
}

interface VisualConfig {
  pointCount: number;       // 32..512 — mapped detail level
  peakHeight: number;       // 0.0..2.0 — amplitude multiplier
  minHeight: number;        // floor for bar/wave height

  renderMode: 'bars' | 'wave';

  // Bars
  barWidth: number;
  barGap: number;
  barRoundness: number;

  // Wave
  waveLayers: number;       // 2..5 glow layers
  waveSymmetry: boolean;    // mirror above/below axis
  waveSmoothing: number;    // curve tension 0..1

  // Color
  colorMode: 'mono' | 'gradient' | 'frequency';
  colorGradient: ColorGradient;
  glowIntensity: number;

  // Temporal
  smoothing: number;        // 0..0.95 inter-frame smoothing
}

interface MappedFrame {
  energies: Float32Array;   // length = pointCount
  colors: Float32Array;     // RGBA per point, or gradient indices
}
```

---

## 5. Shape Providers

All implement:

```typescript
interface ShapeProvider {
  getEmissionSource(time?: number): EmissionSource;
}
```

| Provider | Input | Output |
|---|---|---|
| `LineProvider` | length, orientation | `ShapePath` as straight segment |
| `CircleProvider` | radius, center | `ShapePath` as circle |
| `PolygonProvider` | sides (3=triangle, 4=square, N) | `ShapePath` |
| `ImageMaskProvider` | uploaded image + preprocess config | `MaskGrid` → outline |
| `VideoMaskSequenceProvider` | uploaded video, preprocessed | `MaskGrid[]` indexed by frame |

### Silhouette pipeline (image & video)

```
Frame/Image → Grayscale → Optional Gaussian Blur → Threshold → MaskGrid
MaskGrid → Outline Extractor → OutlinePoint[] (sorted by arcIndex)
```

**Outline extraction:** For each cell where `mask[x,y] === 1`, check 4- or 8-connected neighbors. If any neighbor is `0`, cell is on contour. Normal = average of vectors toward empty neighbors.

**Video preprocessing (Worker):** Decode all frames at reduced resolution (240p–360p). Store `MaskGrid[]` + `OutlinePoint[][]` in IndexedDB. Show progress bar on first load.

---

## 6. Audio Pipeline

1. Load audio via `<audio>` or extract track from `<video>`
2. `AudioContext` → `MediaElementSource` → `AnalyserNode` → output
3. Each animation frame: `getByteFrequencyData()` or `getFloatFrequencyData()`
4. `SpectrumMapper`:
   - Resample raw FFT bins to `pointCount` values (linear interpolation)
   - Apply temporal smoothing: `smoothed[i] = smoothed[i] * smoothing + raw[i] * (1 - smoothing)`
   - Scale by `peakHeight`, clamp with `minHeight`
5. Map resampled bin `i` to emission point at `arcIndex = i / pointCount`

**Master clock:** `audioContext.currentTime` synchronizes video silhouette frames.

---

## 7. Render Modes

### 7.1 Bars (`bars`)

Reference: monochrome vertical bars with rounded caps.

- Draw perpendicular to contour tangent (outward along normal for closed shapes)
- Rounded caps via `ctx.lineCap = 'round'` or arc at bar tip
- Width and gap from `barWidth`, `barGap`
- Height = `energy[i] × peakHeight`
- Color from `colorMode` / `colorGradient`

### 7.2 Wave (`wave`)

Reference: colorful symmetrical waveform with glow layers.

- Smooth curve through sampled points (Catmull-Rom or cubic Bézier)
- Symmetrical: mirror above and below local tangent axis when `waveSymmetry` is true
- Multiple semi-transparent stroke layers (`waveLayers`) with decreasing opacity → glow
- Color gradient along contour parameter (cyan → blue → violet → magenta)
- Bright white/core line at center (high intensity)
- `waveSmoothing` controls curve tension
- `pointCount` controls curve detail

### 7.3 Contour emission (all shapes)

For non-linear shapes, each point `(x, y)` with normal `(nx, ny)` and tangent `(tx, ty)`:

- **Bars:** segment from `(x,y)` to `(x + nx × h, y + ny × h)`
- **Wave:** oscillation along tangent, amplitude `h`, mirrored along normal

---

## 8. Composite (video / Bad Apple mode)

Per frame:

1. Draw `MaskGrid` as black silhouette on white (or inverted) background
2. Overlay bars/wave from `MappedFrame` expanding outward from outline
3. Audio drives wave amplitude in real time

User may supply separate audio file or use video's embedded audio track.

---

## 9. UI Controls

| Control | Maps to |
|---|---|
| Shape selector | line / circle / triangle / square / image / video |
| Render mode | `bars` / `wave` |
| Point count slider | `pointCount` |
| Peak height slider | `peakHeight` |
| Color gradient editor | `colorGradient` |
| Bar width / gap | `barWidth`, `barGap` |
| Wave layers / smoothing | `waveLayers`, `waveSmoothing` |
| Preprocess (image/video) | grayscale, blur, threshold |
| Play / pause | playback clock |
| Export (Phase 6) | MediaRecorder start/stop |

All `VisualConfig` fields adjustable live during playback.

---

## 10. Implementation Phases

| Phase | Scope | Deliverable |
|---|---|---|
| **1** | Line + circle, MP3, bars mode, pointCount, peakHeight | Playable geometric visualizer |
| **2** | Wave mode with glow layers + color gradient | Both visual styles |
| **3** | Polygons + full live controls | Complete style customization |
| **4** | Image upload → silhouette → bars/wave on contour | Custom shape from photo |
| **5** | Video preprocessing worker, sync, Bad Apple composite | Full video silhouette mode |
| **6** | MediaRecorder export | Download WebM |

---

## 11. Performance & Limits

| Concern | Mitigation |
|---|---|
| Noisy silhouette | Blur before threshold; optional morphological cleanup |
| Long video preprocess | Worker + IndexedDB cache; progress UI |
| Many outline points | Downsample outline to `pointCount`; don't render every pixel |
| A/V sync drift | `audioContext.currentTime` as single clock |
| Holes in silhouette (v1) | Largest external contour only; holes deferred |
| Canvas performance | Cap internal grid at 360p; scale to display size |

---

## 12. Out of Scope (v1)

- Navier-Stokes / smoke / fluid field simulation
- WebGL renderer
- ffmpeg.wasm export
- Multiple disconnected contours (holes, islands)
- Desktop/native app

---

## 13. Success Criteria

1. Load MP3 and see bars react in real time on a circle
2. Switch to wave mode with gradient glow
3. Adjust point count and peak height live
4. Upload image → silhouette → audio wave on object outline
5. Upload Bad Apple video → preprocessed silhouette animation + synced audio visualization
6. (Phase 6) Export recording as WebM
