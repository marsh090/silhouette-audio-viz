import type { EmissionSource, MappedFrame, VisualConfig } from '../core/types';
import { BarsRenderer } from './bars-renderer';
import { drawShapeGhost } from './ghost-renderer';
import { WaveRenderer } from './wave-renderer';

export class Visualizer {
  private bars = new BarsRenderer();
  private wave = new WaveRenderer();

  draw(
    ctx: CanvasRenderingContext2D,
    source: EmissionSource,
    frame: MappedFrame,
    config: VisualConfig,
    width: number,
    height: number,
  ): void {
    ctx.clearRect(0, 0, width, height);
    drawShapeGhost(ctx, source, width, height);

    if (config.renderMode === 'wave') {
      this.wave.draw(ctx, source, frame, config, width, height);
    } else {
      this.bars.draw(ctx, source, frame, config, width, height);
    }
  }
}
