import type { ShapePath, SampledPoint } from './types';

export function makeLinePath(x0: number, y0: number, x1: number, y1: number): ShapePath {
  return { points: new Float32Array([x0, y0, x1, y1]), pointCount: 2 };
}

export function makePolygonPath(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rotation = -Math.PI / 2,
): ShapePath {
  const points = new Float32Array(sides * 2);
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    points[i * 2] = cx + Math.cos(a) * r;
    points[i * 2 + 1] = cy + Math.sin(a) * r;
  }
  return { points, pointCount: sides };
}

export function makeCirclePath(cx: number, cy: number, r: number, segments = 256): ShapePath {
  const points = new Float32Array(segments * 2);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points[i * 2] = cx + Math.cos(a) * r;
    points[i * 2 + 1] = cy + Math.sin(a) * r;
  }
  return { points, pointCount: segments };
}

export function samplePath(path: ShapePath, count: number, closed = true): SampledPoint[] {
  const { points, pointCount } = path;
  const segmentCount = closed ? pointCount : pointCount - 1;
  const arcLengths: number[] = [0];
  let total = 0;

  for (let i = 0; i < segmentCount; i++) {
    const i0 = i;
    const i1 = closed ? (i + 1) % pointCount : i + 1;
    const dx = points[i1 * 2] - points[i0 * 2];
    const dy = points[i1 * 2 + 1] - points[i0 * 2 + 1];
    total += Math.hypot(dx, dy);
    arcLengths.push(total);
  }

  const result: SampledPoint[] = [];

  for (let s = 0; s < count; s++) {
    const t = closed
      ? (s / count) * total
      : count <= 1
        ? 0
        : (s / (count - 1)) * total;
    let seg = 0;
    while (seg < segmentCount && arcLengths[seg + 1] < t) seg++;

    const segStart = arcLengths[seg];
    const segLen = arcLengths[seg + 1] - segStart || 1;
    const local = (t - segStart) / segLen;

    const i0 = closed ? seg % pointCount : seg;
    const i1 = closed ? (seg + 1) % pointCount : seg + 1;
    const x0 = points[i0 * 2];
    const y0 = points[i0 * 2 + 1];
    const x1 = points[i1 * 2];
    const y1 = points[i1 * 2 + 1];

    const x = x0 + (x1 - x0) * local;
    const y = y0 + (y1 - y0) * local;

    const tx = x1 - x0;
    const ty = y1 - y0;
    const tLen = Math.hypot(tx, ty) || 1;
    const ntx = tx / tLen;
    const nty = ty / tLen;
    const nx = -nty;
    const ny = ntx;

    result.push({ x, y, nx, ny, tx: ntx, ty: nty, arcIndex: s / count });
  }

  return result;
}
