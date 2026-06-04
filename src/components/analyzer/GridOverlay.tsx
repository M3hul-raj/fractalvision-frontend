"use client";

import { useEffect } from "react";

interface GridOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageWidth: number;
  imageHeight: number;
  selectedBoxSize: number | null;
}

export default function GridOverlay({ canvasRef, imageWidth, imageHeight, selectedBoxSize }: GridOverlayProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedBoxSize || imageWidth === 0 || imageHeight === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += selectedBoxSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += selectedBoxSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [canvasRef, imageWidth, imageHeight, selectedBoxSize]);

  return null;
}
