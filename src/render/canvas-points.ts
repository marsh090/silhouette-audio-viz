import type { EmissionSource, SampledPoint } from '../core/types';
import { getViewport, toScreen } from './viewport';

export function toCanvasCoords(
  x: number,
  y: number,
  source: EmissionSource,
  width: number,
  height: number,
): [number, number] {
  if (source.layout === 'fullWidth') {
    return [x * width, y * height];
  }
  const vp = getViewport(width, height);
  return toScreen(x, y, vp);
}

export function toCanvasPoint(
  p: SampledPoint,
  source: EmissionSource,
  width: number,
  height: number,
): [number, number] {
  return toCanvasCoords(p.x, p.y, source, width, height);
}

export function getMaxAmplitudePx(source: EmissionSource, width: number, height: number): number {
  if (source.layout === 'fullWidth') return width * 0.18;
  return getViewport(width, height).size * 0.2;
}
