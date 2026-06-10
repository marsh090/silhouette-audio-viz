import { describe, it, expect } from 'vitest';
import { samplePath, makeCirclePath, makeLinePath } from './shape-path';

describe('samplePath', () => {
  it('returns pointCount sampled points', () => {
    const path = makeCirclePath(0.5, 0.5, 0.3);
    const sampled = samplePath(path, 64);
    expect(sampled).toHaveLength(64);
  });

  it('circle normals point outward at top', () => {
    const path = makeCirclePath(0.5, 0.5, 0.3);
    const sampled = samplePath(path, 8);
    const top = sampled[0];
    expect(top.ny).toBeLessThan(0);
  });

  it('line has consistent outward normal for horizontal segment', () => {
    const path = makeLinePath(0.1, 0.5, 0.9, 0.5);
    const sampled = samplePath(path, 16);
    for (const p of sampled) {
      expect(p.nx).toBeCloseTo(0, 1);
      expect(Math.abs(p.ny)).toBeCloseTo(1, 1);
    }
  });
});
