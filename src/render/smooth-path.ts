export interface Point2D {
  x: number;
  y: number;
}

/** Catmull-Rom converted to cubic Bézier segments. */
function catmullIndex(i: number, n: number, closed: boolean): number {
  if (closed) return (i + n) % n;
  return Math.max(0, Math.min(n - 1, i));
}

export function strokeSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  tension: number,
  closed: boolean,
): void {
  const n = points.length;
  if (n < 2) return;

  const t = Math.max(0.05, tension);
  ctx.beginPath();

  const segCount = closed ? n : n - 1;
  for (let i = 0; i < segCount; i++) {
    const i0 = catmullIndex(i - 1, n, closed);
    const i1 = catmullIndex(i, n, closed);
    const i2 = catmullIndex(i + 1, n, closed);
    const i3 = catmullIndex(i + 2, n, closed);

    const p0 = points[i0];
    const p1 = points[i1];
    const p2 = points[i2];
    const p3 = points[i3];

    if (i === 0) ctx.moveTo(p1.x, p1.y);

    const cp1x = p1.x + ((p2.x - p0.x) * t) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * t) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * t) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * t) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  if (closed) ctx.closePath();
  ctx.stroke();
}

export function strokeSmoothPathGradient(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  colors: Float32Array,
  tension: number,
  closed: boolean,
): void {
  const n = points.length;
  if (n < 2) return;

  const segCount = closed ? n : n - 1;
  const t = Math.max(0.05, tension);

  for (let i = 0; i < segCount; i++) {
    const i1 = i % n;
    const i2 = (i + 1) % n;
    const c1 = i1 * 3;
    const c2 = i2 * 3;
    const r = ((colors[c1] + colors[c2]) / 2) | 0;
    const g = ((colors[c1 + 1] + colors[c2 + 1]) / 2) | 0;
    const b = ((colors[c1 + 2] + colors[c2 + 2]) / 2) | 0;
    ctx.strokeStyle = `rgb(${r},${g},${b})`;

    const i0 = catmullIndex(i - 1, n, closed);
    const i3 = catmullIndex(i + 2, n, closed);
    const p0 = points[i0];
    const p1 = points[i1];
    const p2 = points[i2];
    const p3 = points[i3];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    const cp1x = p1.x + ((p2.x - p0.x) * t) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * t) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * t) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * t) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    ctx.stroke();
  }
}
