import type { EmissionSource } from '../core/types';
import { toCanvasCoords } from './canvas-points';

export function drawShapeGhost(
  ctx: CanvasRenderingContext2D,
  source: EmissionSource,
  width: number,
  height: number,
): void {
  const { sampled, closed } = source;
  if (!sampled.length) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(150, 150, 170, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 7]);
  ctx.lineCap = 'round';

  ctx.beginPath();
  for (let i = 0; i < sampled.length; i++) {
    const [x, y] = toCanvasCoords(sampled[i].x, sampled[i].y, source, width, height);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
