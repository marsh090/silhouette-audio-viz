import { describe, it, expect } from 'vitest';
import {
  blendNormals,
  ensureOutwardNormals,
  finalizeSampledNormals,
  smoothNormalsSpatial,
  syncTangentToNormal,
} from './bar-normals';
import { DEFAULT_VISUAL_CONFIG } from './defaults';
import type { SampledPoint } from './types';

function point(x: number, y: number, nx: number, ny: number): SampledPoint {
  return { x, y, nx, ny, tx: 0, ty: 1, arcIndex: 0 };
}

describe('bar-normals', () => {
  it('smoothNormalsSpatial averages neighboring directions', () => {
    const pts = [
      point(0, 0, 1, 0),
      point(0.5, 0, 0, 1),
      point(1, 0, -1, 0),
    ];
    const out = smoothNormalsSpatial(pts, 0.5, false);
    expect(out[1].nx).toBeGreaterThan(-0.5);
    expect(out[1].nx).toBeLessThan(0.5);
  });

  it('hybrid mode blends local and radial normals', () => {
    const sampled = [
      point(0.5, 0.3, 0, -1),
      point(0.7, 0.5, 1, 0),
      point(0.5, 0.7, 0, 1),
      point(0.3, 0.5, -1, 0),
    ];
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      barNormalMode: 'hybrid' as const,
      barNormalBlend: 1,
      barNormalSmooth: 0,
    };
    const out = finalizeSampledNormals(sampled, true, config, 'mask');
    expect(out[1].nx).toBeGreaterThan(0);
    expect(out[1].ny).toBeCloseTo(0, 1);
  });

  it('keeps local normals on open paths', () => {
    const sampled = [point(0, 0.5, 0, -1), point(1, 0.5, 0, -1)];
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      barNormalMode: 'radial' as const,
      barNormalBlend: 1,
      barNormalSmooth: 0,
    };
    const out = finalizeSampledNormals(sampled, false, config, 'path');
    expect(out[0].nx).toBe(0);
    expect(out[0].ny).toBe(-1);
  });

  it('syncTangentToNormal is orthogonal to normal', () => {
    const p = point(0.5, 0.3, 0.7, 0.7);
    p.tx = 0.2;
    p.ty = -0.1;
    const out = syncTangentToNormal(p);
    expect(out.nx * out.tx + out.ny * out.ty).toBeCloseTo(0, 5);
  });

  it('ensureOutwardNormals flips inward normals on closed shapes', () => {
    const sampled = [
      point(0.7, 0.5, -1, 0),
      point(0.5, 0.7, 0, 1),
      point(0.3, 0.5, 1, 0),
      point(0.5, 0.3, 0, -1),
    ];
    const out = ensureOutwardNormals(sampled);
    expect(out[0].nx).toBeGreaterThan(0);
  });

  it('blendNormals interpolates between vectors', () => {
    const mid = blendNormals({ nx: 1, ny: 0 }, { nx: 0, ny: 1 }, 0.5);
    expect(mid.nx).toBeCloseTo(0.707, 2);
    expect(mid.ny).toBeCloseTo(0.707, 2);
  });
});
