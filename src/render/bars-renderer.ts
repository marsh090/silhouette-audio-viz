import type { EmissionSource, MappedFrame, VisualConfig } from '../core/types';

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
    const scale = Math.min(width, height);
    const maxBarPx = scale * 0.25;

    const { sampled } = source;
    const { energies, colors } = frame;

    ctx.lineWidth = config.barWidth;
    ctx.lineCap = 'round';

    for (let i = 0; i < sampled.length; i++) {
      const p = sampled[i];
      const barLen = energies[i] * maxBarPx;

      const px = p.x * width;
      const py = p.y * height;

      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];

      ctx.strokeStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + p.nx * barLen, py + p.ny * barLen);
      ctx.stroke();
    }
  }
}
