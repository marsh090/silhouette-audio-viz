import { describe, it, expect } from 'vitest';
import { binIndexForPoint, SpectrumMapper } from './spectrum-mapper';
import { DEFAULT_VISUAL_CONFIG } from './defaults';

describe('SpectrumMapper', () => {
  it('resamples to pointCount', () => {
    const mapper = new SpectrumMapper(DEFAULT_VISUAL_CONFIG);
    const freqs = new Float32Array(64).fill(128);
    const frame = mapper.map({ frequencies: freqs, time: 0 });
    expect(frame.energies.length).toBe(DEFAULT_VISUAL_CONFIG.pointCount);
  });

  it('applies peakHeight multiplier', () => {
    const config = { ...DEFAULT_VISUAL_CONFIG, peakHeight: 2.0, intensity: 1 };
    const mapper = new SpectrumMapper(config);
    const freqs = new Float32Array(64).fill(255);
    const frame = mapper.map({ frequencies: freqs, time: 0 });
    expect(frame.energies[0]).toBeGreaterThan(1.5);
  });

  it('respects minHeight floor', () => {
    const config = { ...DEFAULT_VISUAL_CONFIG, minHeight: 0.1, intensity: 1 };
    const mapper = new SpectrumMapper(config);
    const freqs = new Float32Array(64).fill(0);
    const frame = mapper.map({ frequencies: freqs, time: 0 });
    expect(frame.energies[0]).toBeGreaterThanOrEqual(0.1);
  });

  it('uses log mapping so the right side still picks up mid-band energy', () => {
    const config = { ...DEFAULT_VISUAL_CONFIG, intensity: 1, minHeight: 0 };
    const mapper = new SpectrumMapper(config);
    const freqs = new Float32Array(128).fill(0);
    for (let b = 8; b < 80; b++) freqs[b] = 220;

    const frame = mapper.map({ frequencies: freqs, time: 0 });
    const tail = frame.energies.slice(-10);
    expect(tail.some((e) => e > 0.2)).toBe(true);
  });

  it('binIndexForPoint stays within the usable spectrum band', () => {
    expect(binIndexForPoint(0, 80, 128)).toBeGreaterThanOrEqual(1);
    expect(binIndexForPoint(79, 80, 128)).toBeLessThanOrEqual(Math.floor(127 * 0.72));
  });

  it('intensity above 1 does not exceed peakHeight at full signal', () => {
    const config = { ...DEFAULT_VISUAL_CONFIG, peakHeight: 1.5, intensity: 3, minHeight: 0 };
    const mapper = new SpectrumMapper(config);
    const freqs = new Float32Array(64).fill(255);
    for (let f = 0; f < 30; f++) mapper.map({ frequencies: freqs, time: f * 0.016 });
    const frame = mapper.map({ frequencies: freqs, time: 0.5 });
    expect(frame.energies[0]).toBeLessThanOrEqual(1.5 + 1e-6);
    expect(frame.energies[0]).toBeGreaterThan(1.2);
  });

  it('intensity above 1 releases faster after a peak', () => {
    const loud = new Float32Array(64).fill(255);
    const quiet = new Float32Array(64).fill(0);

    const mild = new SpectrumMapper({ ...DEFAULT_VISUAL_CONFIG, snapMode: false, intensity: 1, minHeight: 0 });
    const punchy = new SpectrumMapper({ ...DEFAULT_VISUAL_CONFIG, snapMode: false, intensity: 2, minHeight: 0 });

    for (let f = 0; f < 20; f++) {
      mild.map({ frequencies: loud, time: f * 0.016 });
      punchy.map({ frequencies: loud, time: f * 0.016 });
    }

    const mildAfter = mild.map({ frequencies: quiet, time: 0.32 }).energies[0];
    const punchyAfter = punchy.map({ frequencies: quiet, time: 0.32 }).energies[0];

    expect(punchyAfter).toBeLessThan(mildAfter);
  });

  it('snap mode drops faster than envelope when signal falls', () => {
    const loud = new Float32Array(64).fill(255);
    const quiet = new Float32Array(64).fill(0);

    const envelope = new SpectrumMapper({ ...DEFAULT_VISUAL_CONFIG, snapMode: false, intensity: 0.4, minHeight: 0 });
    const snap = new SpectrumMapper({ ...DEFAULT_VISUAL_CONFIG, snapMode: true, intensity: 1, minHeight: 0 });

    envelope.map({ frequencies: loud, time: 0 });
    snap.map({ frequencies: loud, time: 0 });

    const envAfter = envelope.map({ frequencies: quiet, time: 0.016 }, 0.016).energies[0];
    const snapAfter = snap.map({ frequencies: quiet, time: 0.032 }, 0.016).energies[0];

    expect(snapAfter).toBeLessThan(envAfter);
  });
});
