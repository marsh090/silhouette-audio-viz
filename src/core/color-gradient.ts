import type { ColorGradient } from './types';

export function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Build a smooth multi-stop gradient between two picked colors. */
export function makeTwoColorGradient(startHex: string, endHex: string): ColorGradient {
  const [r0, g0, b0] = parseHexColor(startHex);
  const [r1, g1, b1] = parseHexColor(endHex);
  const mix = (t: number) => ({
    position: t,
    r: r0 + (r1 - r0) * t,
    g: g0 + (g1 - g0) * t,
    b: b0 + (b1 - b0) * t,
  });
  return {
    stops: [mix(0), mix(0.25), mix(0.5), mix(0.75), mix(1)],
  };
}

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
