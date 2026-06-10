import { describe, it, expect } from 'vitest';
import { makeTwoColorGradient, parseHexColor, sampleGradient } from './color-gradient';

describe('color-gradient', () => {
  it('parses hex colors', () => {
    expect(parseHexColor('#ff0000')).toEqual([255, 0, 0]);
    expect(parseHexColor('#0f0')).toEqual([0, 255, 0]);
  });

  it('builds gradient between two colors', () => {
    const g = makeTwoColorGradient('#000000', '#ffffff');
    expect(g.stops[0]).toMatchObject({ position: 0, r: 0, g: 0, b: 0 });
    expect(g.stops.at(-1)).toMatchObject({ position: 1, r: 255, g: 255, b: 255 });
    const mid = sampleGradient(g, 0.5);
    expect(mid[0]).toBeGreaterThan(100);
    expect(mid[0]).toBeLessThan(155);
  });
});
