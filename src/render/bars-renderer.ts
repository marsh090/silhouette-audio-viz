import type { EmissionSource, MappedFrame, SampledPoint, VisualConfig } from '../core/types';
import { getViewport, toScreen } from './viewport';

export class BarsRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    source: EmissionSource,
    frame: MappedFrame,
    config: VisualConfig,
    width: number,
    height: number,
  ): void {
    ctx.clearRect(0, 0, width, height);
    const vp = getViewport(width, height);
    const maxBarPx = (source.layout === 'fullWidth' ? width : vp.size) * 0.2;
    const direction = config.barDirection === 'inward' ? 1 : -1;

    const { sampled } = source;
    const { energies, colors } = frame;

    ctx.lineWidth = config.barWidth;
    ctx.lineCap = 'round';

    for (let i = 0; i < sampled.length; i++) {
      const p = sampled[i];
      const barLen = energies[i] * maxBarPx;
      const [px, py] = this.toCanvasPoint(p, source, width, height, vp);

      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];

      ctx.strokeStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + p.nx * barLen * direction, py + p.ny * barLen * direction);
      ctx.stroke();
    }
  }

  private toCanvasPoint(
    p: SampledPoint,
    source: EmissionSource,
    width: number,
    height: number,
    vp: ReturnType<typeof getViewport>,
  ): [number, number] {
    if (source.layout === 'fullWidth') {
      return [p.x * width, p.y * height];
    }
    return toScreen(p.x, p.y, vp);
  }
}
