import { describe, it, expect } from 'vitest';
import { boxBlurGray, grayscaleBuffer, thresholdGray } from './image-preprocess';

describe('image-preprocess', () => {
  it('converts rgba to grayscale', () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 255]);
    const gray = grayscaleBuffer(rgba, 2, 1);
    expect(gray[0]).toBeGreaterThan(gray[1]);
  });

  it('thresholds dark pixels as solid by default', () => {
    const gray = new Float32Array([20, 200]);
    const mask = thresholdGray(gray, 2, 1, 128, false);
    expect(mask.data[0]).toBe(1);
    expect(mask.data[1]).toBe(0);
  });

  it('inverts threshold result', () => {
    const gray = new Float32Array([20, 200]);
    const mask = thresholdGray(gray, 2, 1, 128, true);
    expect(mask.data[0]).toBe(0);
    expect(mask.data[1]).toBe(1);
  });

  it('box blur softens edges', () => {
    const gray = new Float32Array([0, 255, 0]);
    const blurred = boxBlurGray(gray, 3, 1, 1);
    expect(blurred[1]).toBeLessThan(255);
    expect(blurred[1]).toBeGreaterThan(0);
  });
});
