/** Uniform square viewport so circles stay round on non-square canvases. */
export interface Viewport {
  size: number;
  offsetX: number;
  offsetY: number;
}

export function getViewport(width: number, height: number): Viewport {
  const size = Math.min(width, height);
  return {
    size,
    offsetX: (width - size) / 2,
    offsetY: (height - size) / 2,
  };
}

export function toScreen(x: number, y: number, vp: Viewport): [number, number] {
  return [vp.offsetX + x * vp.size, vp.offsetY + y * vp.size];
}
