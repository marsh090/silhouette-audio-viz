import { describe, it, expect } from 'vitest';
import { createMaskGrid, setSolid } from './mask-grid';
import {
  extractOutline,
  fitContourToUnit,
  normalizeContourWinding,
  traceContour,
} from './outline-extractor';

function fillRect(mask: ReturnType<typeof createMaskGrid>, x0: number, y0: number, x1: number, y1: number): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      setSolid(mask, x, y, true);
    }
  }
}

describe('outline-extractor', () => {
  it('traces a solid square mask', () => {
    const mask = createMaskGrid(12, 12);
    fillRect(mask, 3, 3, 8, 8);
    const contour = traceContour(mask);
    expect(contour.length).toBeGreaterThan(12);
  });

  it('fits contour into centered unit space', () => {
    const fitted = fitContourToUnit([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    expect(fitted[0].x).toBeCloseTo(0.1, 1);
    expect(fitted[0].x).toBeLessThan(0.5);
    expect(fitted[1].x).toBeGreaterThan(0.5);
  });

  it('preserves aspect ratio for wide silhouettes', () => {
    const fitted = fitContourToUnit([
      { x: 0, y: 2 },
      { x: 20, y: 2 },
      { x: 20, y: 8 },
      { x: 0, y: 8 },
    ]);
    const normW = fitted[1].x - fitted[0].x;
    const normH = fitted[2].y - fitted[1].y;
    expect(normW / normH).toBeCloseTo(20 / 6, 1);
  });

  it('normalizes contour to clockwise winding', () => {
    const signedArea = (contour: Array<{ x: number; y: number }>) => {
      let sum = 0;
      for (let i = 0; i < contour.length; i++) {
        const j = (i + 1) % contour.length;
        sum += contour[i].x * contour[j].y - contour[j].x * contour[i].y;
      }
      return sum * 0.5;
    };

    const ccw = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
    ];
    const cw = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    expect(signedArea(normalizeContourWinding(ccw))).toBeGreaterThan(0);
    expect(signedArea(normalizeContourWinding(cw))).toBeGreaterThan(0);
  });

  it('extracts outline points with normals', () => {
    const mask = createMaskGrid(16, 16);
    fillRect(mask, 4, 4, 11, 11);
    const outline = extractOutline(mask, 32);
    expect(outline.length).toBeGreaterThan(8);
    expect(outline[0].nx).not.toBe(0);
    expect(outline[0].arcIndex).toBeGreaterThanOrEqual(0);
  });
});
