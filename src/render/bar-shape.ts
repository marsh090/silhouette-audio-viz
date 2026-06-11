/** Pick arc from f1→f0 that bulges through the tip (outward cap). */
export function capArcCounterClockwise(
  f0x: number,
  f0y: number,
  f1x: number,
  f1y: number,
  tipX: number,
  tipY: number,
): boolean {
  const e1x = f0x - f1x;
  const e1y = f0y - f1y;
  const e2x = tipX - f1x;
  const e2y = tipY - f1y;
  return e1x * e2y - e1y * e2x > 0;
}

/** Bar with flat base along tangent (on contour) and semicircular tip along normal. */
export function fillBarFlatBase(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  nx: number,
  ny: number,
  tx: number,
  ty: number,
  barLen: number,
  direction: number,
  barWidth: number,
  color: string,
): void {
  const halfW = barWidth / 2;
  const vX = nx * direction;
  const vY = ny * direction;

  const b0x = px + tx * halfW;
  const b0y = py + ty * halfW;
  const b1x = px - tx * halfW;
  const b1y = py - ty * halfW;

  ctx.fillStyle = color;

  if (barLen <= 0) {
    ctx.beginPath();
    ctx.moveTo(b0x, b0y);
    ctx.lineTo(b1x, b1y);
    ctx.lineTo(b1x + vX, b1y + vY);
    ctx.lineTo(b0x + vX, b0y + vY);
    ctx.closePath();
    ctx.fill();
    return;
  }

  const tipX = px + vX * barLen;
  const tipY = py + vY * barLen;

  if (barLen <= halfW) {
    const e0x = tipX + tx * halfW;
    const e0y = tipY + ty * halfW;
    const e1x = tipX - tx * halfW;
    const e1y = tipY - ty * halfW;
    ctx.beginPath();
    ctx.moveTo(b0x, b0y);
    ctx.lineTo(b1x, b1y);
    ctx.lineTo(e1x, e1y);
    if (barLen > 0.5) {
      ctx.quadraticCurveTo(tipX, tipY, e0x, e0y);
    } else {
      ctx.lineTo(e0x, e0y);
    }
    ctx.closePath();
    ctx.fill();
    return;
  }

  const capCx = tipX - vX * halfW;
  const capCy = tipY - vY * halfW;
  const f0x = capCx + tx * halfW;
  const f0y = capCy + ty * halfW;
  const f1x = capCx - tx * halfW;
  const f1y = capCy - ty * halfW;

  const ang0 = Math.atan2(f0y - capCy, f0x - capCx);
  const ang1 = Math.atan2(f1y - capCy, f1x - capCx);
  const ccw = capArcCounterClockwise(f0x, f0y, f1x, f1y, tipX, tipY);

  ctx.beginPath();
  ctx.moveTo(b0x, b0y);
  ctx.lineTo(b1x, b1y);
  ctx.lineTo(f1x, f1y);
  ctx.arc(capCx, capCy, halfW, ang1, ang0, ccw);
  ctx.closePath();
  ctx.fill();
}
