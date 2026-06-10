import type { ShapeDefinition } from '../shape-registry';
import { makeCirclePath, makeLinePath, samplePath } from '../shape-path';
import type { EmissionSource, VisualConfig } from '../types';

export function emissionFromDefinition(def: ShapeDefinition, config: VisualConfig): EmissionSource {
  const { geometry } = def;
  let path;

  if (geometry.type === 'line') {
    path = makeLinePath(geometry.x0, geometry.y0, geometry.x1, geometry.y1);
  } else {
    path = makeCirclePath(geometry.cx, geometry.cy, geometry.r);
  }

  return {
    type: 'path',
    path,
    layout: def.layout,
    sampled: samplePath(path, config.pointCount),
  };
}
