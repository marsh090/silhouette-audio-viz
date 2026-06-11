import type { EmissionSource, SampledPoint, VisualConfig } from '../core/types';
import { getViewport, toScreen } from './viewport';

/** +1 grows along outward normal; open paths keep legacy sign convention. */
export function barGrowthSign(config: VisualConfig, source: EmissionSource): number {
  if (!source.closed) {
    return config.barDirection === 'inward' ? 1 : -1;
  }
  return config.barDirection === 'inward' ? -1 : 1;
}

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
