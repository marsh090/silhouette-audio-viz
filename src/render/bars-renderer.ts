import type { EmissionSource, MappedFrame, VisualConfig } from '../core/types';
import { fillBarFlatBase } from './bar-shape';
import { barGrowthSign, getMaxAmplitudePx, toCanvasPoint } from './canvas-points';

export class BarsRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    source: EmissionSource,
    frame: MappedFrame,
    config: VisualConfig,
    width: number,
    height: number,
  ): void {
    const maxBarPx = getMaxAmplitudePx(source, width, height);
    const direction = barGrowthSign(config, source);

    const { sampled } = source;
    const { energies, colors } = frame;

    for (let i = 0; i < sampled.length; i++) {
      const p = sampled[i];
      const barLen = energies[i] * maxBarPx;
      const [px, py] = toCanvasPoint(p, source, width, height);

      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];
      const color = `rgb(${r | 0},${g | 0},${b | 0})`;

      fillBarFlatBase(
        ctx,
        px,
        py,
        p.nx,
        p.ny,
        p.tx,
        p.ty,
        barLen,
        direction,
        config.barWidth,
        color,
      );
    }
  }
}
