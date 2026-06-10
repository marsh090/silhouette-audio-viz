import type { EmissionSource } from '../core/types';
import { toCanvasCoords } from './canvas-points';

export function drawShapeGhost(
  ctx: CanvasRenderingContext2D,
  source: EmissionSource,
  width: number,
  height: number,
): void {
  const path = source.path;
  if (!path) return;

  const { points, pointCount } = path;

  ctx.save();
  ctx.strokeStyle = 'rgba(150, 150, 170, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 7]);
  ctx.lineCap = 'round';

  ctx.beginPath();
  for (let i = 0; i < pointCount; i++) {
    const [x, y] = toCanvasCoords(points[i * 2], points[i * 2 + 1], source, width, height);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  if (source.closed) ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
