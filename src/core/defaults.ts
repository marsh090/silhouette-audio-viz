import { makeTwoColorGradient } from './color-gradient';
import type { VisualConfig } from './types';

const GRADIENT_START = '#00ffff';
const GRADIENT_END = '#ff00c8';

export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  pointCount: 80,
  peakHeight: 1.0,
  intensity: 0.4,
  minHeight: 0.02,
  renderMode: 'bars',
  barWidth: 8,
  barGap: 2,
  barRoundness: 2,
  barDirection: 'outward',
  waveLayers: 3,
  waveSymmetry: false,
  waveSmoothing: 0.5,
  colorMode: 'gradient',
  gradientColorStart: GRADIENT_START,
  gradientColorEnd: GRADIENT_END,
  colorGradient: makeTwoColorGradient(GRADIENT_START, GRADIENT_END),
  glowIntensity: 0.8,
  smoothing: 0.7,
  snapMode: false,
  maskThreshold: 128,
  maskBlur: 2,
  maskInvert: false,
  barNormalMode: 'local',
  barNormalBlend: 0.75,
  barNormalSmooth: 0.35,
};
