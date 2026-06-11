import type { SampledPoint, VisualConfig } from './types';

export type BarNormalMode = 'local' | 'hybrid' | 'radial';

export interface NormalPolicy {
  mode: BarNormalMode;
  blend: number;
  smooth: number;
}

export function resolveNormalPolicy(sourceType: 'path' | 'mask', config: VisualConfig): NormalPolicy {
  return {
    mode: config.barNormalMode,
    blend: config.barNormalBlend,
    smooth: config.barNormalSmooth,
  };
}

export function computeCentroid(points: SampledPoint[]): { cx: number; cy: number } {
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  const n = points.length || 1;
  return { cx: cx / n, cy: cy / n };
}

export function radialNormal(p: SampledPoint, centroid: { cx: number; cy: number }): { nx: number; ny: number } {
  const nx = p.x - centroid.cx;
  const ny = p.y - centroid.cy;
  const len = Math.hypot(nx, ny) || 1;
  return { nx: nx / len, ny: ny / len };
}

export function blendNormals(
  local: { nx: number; ny: number },
  radial: { nx: number; ny: number },
  blend: number,
): { nx: number; ny: number } {
  const t = Math.max(0, Math.min(1, blend));
  const nx = local.nx * (1 - t) + radial.nx * t;
  const ny = local.ny * (1 - t) + radial.ny * t;
  const len = Math.hypot(nx, ny) || 1;
  return { nx: nx / len, ny: ny / len };
}

export function smoothNormalsSpatial(
  points: SampledPoint[],
  amount: number,
  closed: boolean,
): SampledPoint[] {
  const radius = Math.max(1, Math.round(1 + amount * 12));
  const n = points.length;
  const out = points.map((p) => ({ ...p }));

  for (let i = 0; i < n; i++) {
    let sx = 0;
    let sy = 0;
    let weight = 0;
    for (let j = -radius; j <= radius; j++) {
      let idx: number;
      if (closed) {
        idx = (i + j + n) % n;
      } else {
        idx = Math.max(0, Math.min(n - 1, i + j));
      }
      const w = 1 - Math.abs(j) / (radius + 1);
      sx += points[idx].nx * w;
      sy += points[idx].ny * w;
      weight += w;
    }
    const len = Math.hypot(sx, sy) || 1;
    out[i].nx = sx / len;
    out[i].ny = sy / len;
  }

  return out;
}

/** Keep tangent along contour, orthogonal to the (possibly blended) normal. */
/** Closed shapes: nx/ny always point outward from the centroid. */
export function ensureOutwardNormals(points: SampledPoint[]): SampledPoint[] {
  const centroid = computeCentroid(points);
  return points.map((p) => {
    const rx = p.x - centroid.cx;
    const ry = p.y - centroid.cy;
    const rLen = Math.hypot(rx, ry) || 1;
    const dot = p.nx * (rx / rLen) + p.ny * (ry / rLen);
    if (dot < 0) {
      return syncTangentToNormal({ ...p, nx: -p.nx, ny: -p.ny });
    }
    return p;
  });
}

export function syncTangentToNormal(p: SampledPoint): SampledPoint {
  let tx = -p.ny;
  let ty = p.nx;
  if (tx * p.tx + ty * p.ty < 0) {
    tx = -tx;
    ty = -ty;
  }
  return { ...p, tx, ty };
}

export function finalizeSampledNormals(
  sampled: SampledPoint[],
  closed: boolean,
  config: VisualConfig,
  sourceType: 'path' | 'mask',
): SampledPoint[] {
  if (sampled.length === 0) return sampled;

  const policy = resolveNormalPolicy(sourceType, config);
  let result = sampled.map((p) => ({ ...p }));

  if (policy.smooth > 0) {
    result = smoothNormalsSpatial(result, policy.smooth, closed);
    result = result.map(syncTangentToNormal);
  }

  if (closed && policy.mode !== 'local') {
    const centroid = computeCentroid(result);
    result = result.map((p) => {
      const radial = radialNormal(p, centroid);
      let next: SampledPoint;
      if (policy.mode === 'radial') {
        next = { ...p, nx: radial.nx, ny: radial.ny };
      } else {
        const blended = blendNormals(p, radial, policy.blend);
        next = { ...p, nx: blended.nx, ny: blended.ny };
      }
      return syncTangentToNormal(next);
    });
  }

  if (closed) {
    result = ensureOutwardNormals(result);
  }

  return result;
}
