import type { EmissionSource, MappedFrame, VisualConfig } from '../core/types';
import { barGrowthSign, getMaxAmplitudePx, toCanvasPoint } from './canvas-points';
import { smoothSignal } from './signal-smooth';
import { type Point2D, strokeSmoothPathGradient } from './smooth-path';

export class WaveRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    source: EmissionSource,
    frame: MappedFrame,
    config: VisualConfig,
    width: number,
    height: number,
  ): void {
    const { sampled } = source;
    const { energies, colors } = frame;
    const maxAmp = getMaxAmplitudePx(source, width, height);
    const direction = barGrowthSign(config, source);
    const tension = 0.35 + config.waveSmoothing * 0.65;
    const closed = source.closed ?? false;

    const smoothed = smoothSignal(energies, config.waveSmoothing, closed);

    const buildCurve = (sign: number): Point2D[] => {
      const pts: Point2D[] = [];
      for (let i = 0; i < sampled.length; i++) {
        const p = sampled[i];
        const [bx, by] = toCanvasPoint(p, source, width, height);
        const amp = smoothed[i] * maxAmp * sign;
        pts.push({
          x: bx + p.nx * amp * direction,
          y: by + p.ny * amp * direction,
        });
      }
      return pts;
    };

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = config.barWidth;
    ctx.globalAlpha = 1;

    strokeSmoothPathGradient(ctx, buildCurve(1), colors, tension, closed);

    if (config.waveSymmetry) {
      strokeSmoothPathGradient(ctx, buildCurve(-1), colors, tension, closed);
    }
  }
}
