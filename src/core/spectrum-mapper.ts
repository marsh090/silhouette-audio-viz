import type { AudioFrame, MappedFrame, VisualConfig } from './types';
import { sampleGradient } from './color-gradient';

/** Log-spaced bin index; skips DC and the top of the spectrum where music is usually silent. */
export function binIndexForPoint(i: number, pointCount: number, srcLen: number): number {
  const minBin = 1;
  const maxBin = Math.max(minBin + 1, Math.floor((srcLen - 1) * 0.72));
  if (pointCount <= 1) return minBin;

  const t = i / (pointCount - 1);
  const logMin = Math.log(minBin + 1);
  const logMax = Math.log(maxBin + 1);
  return Math.min(maxBin, Math.exp(logMin + t * (logMax - logMin)) - 1);
}

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

  map(audio: AudioFrame, dt = 1 / 60): MappedFrame {
    const { pointCount, peakHeight, intensity, minHeight, snapMode, colorMode, colorGradient } = this.config;
    const energies = new Float32Array(pointCount);
    const colors = new Float32Array(pointCount * 3);
    const src = audio.frequencies;
    const srcLen = src.length;

    for (let i = 0; i < pointCount; i++) {
      const srcIdx = binIndexForPoint(i, pointCount, srcLen);
      const i0 = Math.floor(srcIdx);
      const i1 = Math.min(i0 + 1, srcLen - 1);
      const frac = srcIdx - i0;
      const raw = (src[i0] * (1 - frac) + src[i1] * frac) / 255;

      const attack = Math.min(1, intensity);
      const release = intensity <= 1 ? attack * 0.55 : 0.55 * intensity;

      if (snapMode) {
        const collapse = 1 - Math.exp(-dt * 80 * (intensity <= 1 ? 1 : intensity));
        const rise = 1 - Math.exp(-dt * (60 + attack * 50));
        let level = this.smoothed[i];
        level += (0 - level) * collapse;
        level += (raw - level) * rise;
        this.smoothed[i] = Math.max(0, Math.min(1, level));
      } else {
        const diff = raw - this.smoothed[i];
        const rate = diff > 0 ? attack : release;
        this.smoothed[i] = Math.max(0, Math.min(1, this.smoothed[i] + diff * rate));
      }

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
