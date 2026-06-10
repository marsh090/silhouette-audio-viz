import { describe, it, expect } from 'vitest';
import { SpectrumMapper } from './spectrum-mapper';
import { DEFAULT_VISUAL_CONFIG } from './types';

describe('SpectrumMapper', () => {
  it('resamples to pointCount', () => {
    const mapper = new SpectrumMapper(DEFAULT_VISUAL_CONFIG);
    const freqs = new Float32Array(64).fill(128);
    const frame = mapper.map({ frequencies: freqs, time: 0 });
    expect(frame.energies.length).toBe(DEFAULT_VISUAL_CONFIG.pointCount);
  });

  it('applies peakHeight multiplier', () => {
    const config = { ...DEFAULT_VISUAL_CONFIG, peakHeight: 2.0, smoothing: 0 };
    const mapper = new SpectrumMapper(config);
    const freqs = new Float32Array(64).fill(255);
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
