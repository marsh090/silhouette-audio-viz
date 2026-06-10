import type { ColorGradient } from './types';

export function sampleGradient(gradient: ColorGradient, t: number): [number, number, number] {
  const { stops } = gradient;
  const clamped = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < stops.length - 1 && stops[i + 1].position < clamped) i++;

  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const range = b.position - a.position || 1;
  const local = (clamped - a.position) / range;

  return [
    a.r + (b.r - a.r) * local,
    a.g + (b.g - a.g) * local,
    a.b + (b.b - a.b) * local,
  ];
}
