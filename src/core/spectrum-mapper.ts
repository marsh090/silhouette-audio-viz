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
      energies[i] = Math.max(minHeight, this.smoothed[i] * peakHeight);

      let r = 255;
      let g = 255;
      let b = 255;
      if (colorMode === 'gradient' || colorMode === 'frequency') {
        [r, g, b] = sampleGradient(colorGradient, i / pointCount);
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    return { energies, colors };
  }
}
