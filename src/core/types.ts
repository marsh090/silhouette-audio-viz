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
