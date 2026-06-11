import { describe, it, expect } from 'vitest';
import { syncTangentToNormal } from '../core/bar-normals';
import type { SampledPoint } from '../core/types';
import { capArcCounterClockwise } from './bar-shape';

describe('bar-shape helpers', () => {
  it('syncTangentToNormal keeps tangent perpendicular to normal', () => {
    const p: SampledPoint = {
      x: 0.5,
      y: 0.5,
      nx: 1,
      ny: 0,
      tx: 0,
      ty: 1,
      arcIndex: 0,
    };
    const out = syncTangentToNormal(p);
    expect(out.tx * out.nx + out.ty * out.ny).toBeCloseTo(0, 5);
    expect(out.tx).toBeCloseTo(0, 5);
    expect(out.ty).toBeCloseTo(1, 5);
  });

  it('capArcCounterClockwise picks arc through outward tip', () => {
    const ccw = capArcCounterClockwise(1, 0, -1, 0, 0, 1);
    expect(ccw).toBe(true);
    const cw = capArcCounterClockwise(1, 0, -1, 0, 0, -1);
    expect(cw).toBe(false);
  });

  it('syncTangentToNormal preserves contour direction sign', () => {
    const p: SampledPoint = {
      x: 0.5,
      y: 0.5,
      nx: 0,
      ny: 1,
      tx: -1,
      ty: 0,
      arcIndex: 0,
    };
    const out = syncTangentToNormal(p);
    expect(out.tx).toBeLessThan(0);
  });
});
