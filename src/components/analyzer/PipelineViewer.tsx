"use client";

import { useRef, useState } from "react";
import GridOverlay from "./GridOverlay";

interface PipelineViewerProps {
  binaryImageB64: string;
  selectedBoxSize: number | null;
}

export default function PipelineViewer({ binaryImageB64, selectedBoxSize }: PipelineViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgDim, setImgDim] = useState({ width: 0, height: 0 });

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgDim({ width: img.naturalWidth, height: img.naturalHeight });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-md flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-100 self-start">Algorithm Microscope</h3>
      <div className="relative w-full max-w-2xl bg-black border border-gray-600">
        <img 
          src={binaryImageB64} 
          alt="Binary Fractal" 
          className="w-full h-auto block"
          onLoad={onImageLoad}
        />
        {imgDim.width > 0 && imgDim.height > 0 && (
          <canvas
            ref={canvasRef}
            width={imgDim.width}
            height={imgDim.height}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        )}
        <GridOverlay 
          canvasRef={canvasRef} 
          imageWidth={imgDim.width} 
          imageHeight={imgDim.height} 
          selectedBoxSize={selectedBoxSize} 
        />
      </div>
    </div>
  );
}
