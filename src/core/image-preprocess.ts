import { createMaskGrid, maskIndex } from './mask-grid';
import type { MaskGrid } from './types';

export interface ImagePreprocessOptions {
  threshold: number;
  blur: number;
  invert: boolean;
  maxSize?: number;
}

export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function grayscaleBuffer(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    gray[i] = luminance(rgba[o], rgba[o + 1], rgba[o + 2]);
  }
  return gray;
}

export function boxBlurGray(gray: Float32Array, width: number, height: number, radius: number): Float32Array {
  if (radius <= 0) return gray;

  const out = new Float32Array(gray.length);
  const r = Math.floor(radius);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
          sum += gray[sy * width + sx];
          count++;
        }
      }
      out[y * width + x] = sum / count;
    }
  }

  return out;
}

export function thresholdGray(
  gray: Float32Array,
  width: number,
  height: number,
  threshold: number,
  invert: boolean,
): MaskGrid {
  const mask = createMaskGrid(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x];
      const dark = v < threshold;
      const solid = invert ? !dark : dark;
      mask.data[maskIndex(width, x, y)] = solid ? 1 : 0;
    }
  }
  return mask;
}

function fitDimensions(srcW: number, srcH: number, maxSize: number): { width: number; height: number } {
  const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  return {
    width: Math.max(1, Math.round(srcW * scale)),
    height: Math.max(1, Math.round(srcH * scale)),
  };
}

export function imageToMask(image: HTMLImageElement, options: ImagePreprocessOptions): MaskGrid {
  const maxSize = options.maxSize ?? 280;
  const { width, height } = fitDimensions(image.naturalWidth, image.naturalHeight, maxSize);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  ctx.drawImage(image, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;

  let gray = grayscaleBuffer(rgba, width, height);
  gray = boxBlurGray(gray, width, height, options.blur);
  return thresholdGray(gray, width, height, options.threshold, options.invert);
}

export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}
