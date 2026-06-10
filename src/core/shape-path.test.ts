import { describe, it, expect } from 'vitest';
import { samplePath, makeCirclePath, makeLinePath, makePolygonPath } from './shape-path';

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
    const sampled = samplePath(path, 16, false);
    for (const p of sampled) {
      expect(p.nx).toBeCloseTo(0, 1);
      expect(Math.abs(p.ny)).toBeCloseTo(1, 1);
    }
  });

  it('triangle polygon builds three vertices and samples closed contour', () => {
    const path = makePolygonPath(0.5, 0.5, 0.3, 3);
    expect(path.pointCount).toBe(3);
    const sampled = samplePath(path, 24, true);
    expect(sampled).toHaveLength(24);
    const apex = sampled.reduce((best, p) => (p.y < best.y ? p : best), sampled[0]);
    expect(apex.y).toBeLessThan(0.5);
  });

  it('square polygon samples evenly around closed contour', () => {
    const path = makePolygonPath(0.5, 0.5, 0.25, 4, Math.PI / 4);
    const sampled = samplePath(path, 32, true);
    expect(sampled).toHaveLength(32);
    expect(sampled[0].x).not.toBeCloseTo(sampled[16].x, 1);
  });

  it('open line samples left to right without doubling back', () => {
    const path = makeLinePath(0, 0.5, 1, 0.5);
    const sampled = samplePath(path, 16, false);
    for (let i = 1; i < sampled.length; i++) {
      expect(sampled[i].x).toBeGreaterThanOrEqual(sampled[i - 1].x);
    }
    expect(sampled[0].x).toBeCloseTo(0, 5);
    expect(sampled[sampled.length - 1].x).toBeCloseTo(1, 5);
  });
});
