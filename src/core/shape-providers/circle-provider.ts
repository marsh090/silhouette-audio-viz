import { makeCirclePath, samplePath } from '../shape-path';
import type { EmissionSource, VisualConfig } from '../types';

export class CircleProvider {
  constructor(
    private cx = 0.5,
    private cy = 0.5,
    private r = 0.35,
  ) {}

  getEmissionSource(config: VisualConfig): EmissionSource {
    const path = makeCirclePath(this.cx, this.cy, this.r);
    return { type: 'path', path, sampled: samplePath(path, config.pointCount) };
  }
}
