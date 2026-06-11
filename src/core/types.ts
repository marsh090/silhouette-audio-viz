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

export type ShapeLayout = 'fullWidth' | 'fitted';

export interface MaskGrid {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface OutlinePoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  arcIndex: number;
}

export interface EmissionSource {
  type: 'path' | 'mask';
  sampled: SampledPoint[];
  layout?: ShapeLayout;
  closed?: boolean;
  path?: ShapePath;
  mask?: MaskGrid;
  outline?: OutlinePoint[];
}

export interface AudioFrame {
  frequencies: Float32Array;
  time: number;
}

export interface ColorGradient {
  stops: Array<{ position: number; r: number; g: number; b: number }>;
}

export type BarDirection = 'inward' | 'outward';
export type BarNormalMode = 'local' | 'hybrid' | 'radial';

export interface VisualConfig {
  pointCount: number;
  peakHeight: number;
  intensity: number;
  minHeight: number;
  renderMode: 'bars' | 'wave';
  barWidth: number;
  barGap: number;
  barRoundness: number;
  barDirection: BarDirection;
  waveLayers: number;
  waveSymmetry: boolean;
  waveSmoothing: number;
  colorMode: 'mono' | 'gradient' | 'frequency';
  gradientColorStart: string;
  gradientColorEnd: string;
  colorGradient: ColorGradient;
  glowIntensity: number;
  smoothing: number;
  snapMode: boolean;
  maskThreshold: number;
  maskBlur: number;
  maskInvert: boolean;
  barNormalMode: BarNormalMode;
  barNormalBlend: number;
  barNormalSmooth: number;
}

export interface MappedFrame {
  energies: Float32Array;
  colors: Float32Array;
}

export type ShapeKind = 'line' | 'circle' | 'triangle' | 'square' | 'image';
