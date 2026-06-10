import type { ShapeDefinition } from '../shape-registry';
import { makeCirclePath, makeLinePath, makePolygonPath, samplePath } from '../shape-path';
import type { EmissionSource, VisualConfig } from '../types';

export function emissionFromDefinition(def: ShapeDefinition, config: VisualConfig): EmissionSource {
  const { geometry } = def;
  let path;

  let closed: boolean;

  if (geometry.type === 'line') {
    path = makeLinePath(geometry.x0, geometry.y0, geometry.x1, geometry.y1);
    closed = false;
  } else if (geometry.type === 'polygon') {
    path = makePolygonPath(
      geometry.cx,
      geometry.cy,
      geometry.r,
      geometry.sides,
      geometry.rotation ?? -Math.PI / 2,
    );
    closed = true;
  } else {
    path = makeCirclePath(geometry.cx, geometry.cy, geometry.r);
    closed = true;
  }

  return {
    type: 'path',
    path,
    layout: def.layout,
    closed,
    sampled: samplePath(path, config.pointCount, closed),
  };
}
