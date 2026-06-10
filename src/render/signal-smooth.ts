/** Gaussian-like moving average for organic wave curves. */
export function smoothSignal(values: Float32Array, amount: number, closed: boolean): Float32Array {
  const radius = Math.max(1, Math.round(1 + amount * 18));
  const out = new Float32Array(values.length);
  const n = values.length;

  for (let i = 0; i < n; i++) {
    let sum = 0;
    let weight = 0;
    for (let j = -radius; j <= radius; j++) {
      let idx: number;
      if (closed) {
        idx = (i + j + n) % n;
      } else {
        idx = Math.max(0, Math.min(n - 1, i + j));
      }
      const w = 1 - Math.abs(j) / (radius + 1);
      sum += values[idx] * w;
      weight += w;
    }
    out[i] = sum / weight;
  }

  return out;
}
