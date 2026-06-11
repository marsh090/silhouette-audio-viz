import type { MaskGrid } from './types';

export function createMaskGrid(width: number, height: number): MaskGrid {
  return { width, height, data: new Uint8Array(width * height) };
}

export function maskIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

export function isSolid(mask: MaskGrid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
  return mask.data[maskIndex(mask.width, x, y)] === 1;
}

export function setSolid(mask: MaskGrid, x: number, y: number, solid: boolean): void {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return;
  mask.data[maskIndex(mask.width, x, y)] = solid ? 1 : 0;
}
