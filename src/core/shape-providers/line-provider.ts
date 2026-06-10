import { makeLinePath, samplePath } from '../shape-path';
import type { EmissionSource, VisualConfig } from '../types';

export class LineProvider {
  constructor(
    private x0 = 0.1,
    private y0 = 0.5,
    private x1 = 0.9,
    private y1 = 0.5,
  ) {}

  getEmissionSource(config: VisualConfig): EmissionSource {
    const path = makeLinePath(this.x0, this.y0, this.x1, this.y1);
    return { type: 'path', path, sampled: samplePath(path, config.pointCount) };
  }
}
