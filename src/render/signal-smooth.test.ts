import { describe, it, expect } from 'vitest';
import { smoothSignal } from './signal-smooth';

describe('smoothSignal', () => {
  it('smooths sharp peaks', () => {
    const input = new Float32Array([0, 0, 1, 0, 0]);
    const out = smoothSignal(input, 0.5, false);
    expect(out[2]).toBeLessThan(1);
    expect(out[1]).toBeGreaterThan(0);
    expect(out[3]).toBeGreaterThan(0);
  });
});
