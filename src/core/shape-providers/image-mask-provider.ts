import { finalizeSampledNormals } from '../bar-normals';
import { imageToMask } from '../image-preprocess';
import { extractOutline } from '../outline-extractor';
import { samplePath } from '../shape-path';
import type { EmissionSource, MaskGrid, ShapePath, VisualConfig } from '../types';

export function emptyMaskEmissionSource(): EmissionSource {
  return {
    type: 'mask',
    layout: 'fitted',
    closed: true,
    sampled: [],
  };
}

export function emissionFromMask(mask: MaskGrid, config: VisualConfig): EmissionSource {
  const outline = extractOutline(mask);
  if (outline.length < 3) return emptyMaskEmissionSource();

  const points = new Float32Array(outline.length * 2);
  for (let i = 0; i < outline.length; i++) {
    points[i * 2] = outline[i].x;
    points[i * 2 + 1] = outline[i].y;
  }

  const path: ShapePath = { points, pointCount: outline.length };

  const sampled = finalizeSampledNormals(
    samplePath(path, config.pointCount, true),
    true,
    config,
    'mask',
  );

  return {
    type: 'mask',
    layout: 'fitted',
    closed: true,
    path,
    mask,
    outline,
    sampled,
  };
}

export function emissionFromImage(image: HTMLImageElement, config: VisualConfig): EmissionSource {
  const mask = imageToMask(image, {
    threshold: config.maskThreshold,
    blur: config.maskBlur,
    invert: config.maskInvert,
  });
  return emissionFromMask(mask, config);
}
