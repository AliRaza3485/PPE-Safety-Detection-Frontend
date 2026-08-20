import { Detection } from './types';

/**
 * Draws bounding boxes + label + confidence for each detection onto a canvas.
 * violation === true (bare head) -> red box
 * violation === false (helmet)   -> green box
 *
 * scaleX/scaleY convert from the *source* image/video pixel coordinates
 * (what the backend returned bbox values in) to the canvas's own pixel size.
 */
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  scaleX: number,
  scaleY: number
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!scaleX || !scaleY || !isFinite(scaleX) || !isFinite(scaleY)) return;

  ctx.lineWidth = 3;
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.textBaseline = 'top';

  for (const det of detections) {
    const [x1, y1, x2, y2] = det.bbox;
    const rx = x1 * scaleX;
    const ry = y1 * scaleY;
    const rw = (x2 - x1) * scaleX;
    const rh = (y2 - y1) * scaleY;

    const color = det.violation ? '#ef4444' : '#22c55e'; // red : green

    ctx.strokeStyle = color;
    ctx.strokeRect(rx, ry, rw, rh);

    const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
    const paddingX = 6;
    const labelHeight = 20;
    const labelWidth = ctx.measureText(label).width + paddingX * 2;
    const labelY = ry - labelHeight >= 0 ? ry - labelHeight : ry;

    ctx.fillStyle = color;
    ctx.fillRect(rx, labelY, labelWidth, labelHeight);

    ctx.fillStyle = '#0f172a';
    ctx.fillText(label, rx + paddingX, labelY + 3);
  }
}