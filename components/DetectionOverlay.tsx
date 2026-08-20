import { useEffect, useRef } from 'react';
import { Detection } from '@/lib/types';
import { drawDetections } from '@/lib/drawDetections';

interface DetectionOverlayProps {
  detections: Detection[];
  sourceWidth: number; // natural width of the image/video frame the bboxes were computed on
  sourceHeight: number; // natural height of the image/video frame the bboxes were computed on
  containerRef: React.RefObject<HTMLElement>; // element whose *rendered* size the overlay should match
}

export default function DetectionOverlay({
  detections,
  sourceWidth,
  sourceHeight,
  containerRef,
}: DetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const redraw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !sourceWidth || !sourceHeight) return;
      const scaleX = canvas.width / sourceWidth;
      const scaleY = canvas.height / sourceHeight;
      drawDetections(ctx, detections, scaleX, scaleY);
    };

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      redraw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => observer.disconnect();
  }, [detections, sourceWidth, sourceHeight, containerRef]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute left-0 top-0 h-full w-full" />;
}