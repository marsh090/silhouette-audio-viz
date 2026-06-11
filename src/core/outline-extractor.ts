import { isSolid } from './mask-grid';
import type { MaskGrid, OutlinePoint } from './types';

interface Pixel {
  x: number;
  y: number;
}

const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];

function isBoundary(mask: MaskGrid, x: number, y: number): boolean {
  if (!isSolid(mask, x, y)) return false;
  return (
    !isSolid(mask, x + 1, y) ||
    !isSolid(mask, x - 1, y) ||
    !isSolid(mask, x, y + 1) ||
    !isSolid(mask, x, y - 1)
  );
}

function findStartPixel(mask: MaskGrid): Pixel | null {
  let best: Pixel | null = null;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!isBoundary(mask, x, y)) continue;
      if (!best || y < best.y || (y === best.y && x < best.x)) {
        best = { x, y };
      }
    }
  }
  return best;
}

function signedArea(contour: Pixel[]): number {
  let sum = 0;
  for (let i = 0; i < contour.length; i++) {
    const j = (i + 1) % contour.length;
    sum += contour[i].x * contour[j].y - contour[j].x * contour[i].y;
  }
  return sum * 0.5;
}

/** Clockwise winding in screen space (y-down) for stable arc parameterization. */
export function normalizeContourWinding(contour: Pixel[]): Pixel[] {
  if (contour.length < 3) return contour;
  return signedArea(contour) < 0 ? [...contour].reverse() : contour;
}

export function traceContour(mask: MaskGrid): Pixel[] {
  const start = findStartPixel(mask);
  if (!start) return [];

  const contour: Pixel[] = [];
  let x = start.x;
  let y = start.y;
  let dir = 7;
  const maxSteps = mask.width * mask.height * 2;

  for (let step = 0; step < maxSteps; step++) {
    contour.push({ x, y });

    let found = false;
    for (let i = 0; i < 8; i++) {
      const nd = (dir + i) % 8;
      const nx = x + DX[nd];
      const ny = y + DY[nd];
      if (isBoundary(mask, nx, ny)) {
        x = nx;
        y = ny;
        dir = (nd + 6) % 8;
        found = true;
        break;
      }
    }

    if (!found) break;
    if (step > 2 && x === start.x && y === start.y) break;
  }

  return contour;
}

export function boundaryNormal(mask: MaskGrid, x: number, y: number): { nx: number; ny: number } {
  let nx = 0;
  let ny = 0;
  const neighbors: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (const [dx, dy] of neighbors) {
    if (!isSolid(mask, x + dx, y + dy)) {
      nx += dx;
      ny += dy;
    }
  }

  const len = Math.hypot(nx, ny) || 1;
  return { nx: nx / len, ny: ny / len };
}

export function subsampleContour(contour: Pixel[], maxVerts: number): Pixel[] {
  if (contour.length <= maxVerts) return contour;
  const out: Pixel[] = [];
  for (let i = 0; i < maxVerts; i++) {
    out.push(contour[Math.floor((i * contour.length) / maxVerts)]);
  }
  return out;
}

/** Uniform scale in pixel space — preserves image aspect ratio. */
export function fitContourToUnit(contour: Pixel[]): Array<{ x: number; y: number }> {
  if (contour.length === 0) return [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of contour) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = 0.8 / Math.max(bw, bh);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return contour.map((p) => ({
    x: 0.5 + (p.x - cx) * scale,
    y: 0.5 + (p.y - cy) * scale,
  }));
}

export function extractOutline(mask: MaskGrid, maxVerts = 512): OutlinePoint[] {
  const contour = normalizeContourWinding(traceContour(mask));
  if (contour.length < 3) return [];

  const subsampled = subsampleContour(contour, maxVerts);
  const fitted = fitContourToUnit(subsampled);

  return fitted.map((p, i) => {
    const src = subsampled[i];
    const normal = boundaryNormal(mask, src.x, src.y);
    return { ...p, nx: normal.nx, ny: normal.ny, arcIndex: i / fitted.length };
  });
}
