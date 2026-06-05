"use client";

import { useState, useRef } from "react";
import { useAnalyzerStore } from "@/store/analyzerStore";
import { analyzeImage } from "@/lib/api/client";

export default function ImageUploader() {
  const { setFile, setResult, setIsAnalyzing, isAnalyzing, setBinaryImageUrl, setLastResponse, analysisMode, thresholdMethod, thresholdValue, error, setError } = useAnalyzerStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setFile(file);
    setIsAnalyzing(true);
    try {
      const res = await analyzeImage(file, { 
        analysisMode, 
        thresholdMethod, 
        thresholdValue 
      });
      setResult(res.result);
      setLastResponse(res);
      if (res.binary_image_b64) {
        setBinaryImageUrl(`data:image/png;base64,${res.binary_image_b64}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze image");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAnalyzing) setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (isAnalyzing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !isAnalyzing && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-600 hover:border-gray-400"}
        ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input 
        ref={inputRef}
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        onChange={onChange} 
        className="hidden" 
        disabled={isAnalyzing}
      />
      {isDragActive ? (
        <p className="text-blue-400 font-medium">Drop the image here...</p>
      ) : (
        <p className="text-gray-300 font-medium">
          {isAnalyzing ? "Analyzing... Please wait." : "Drag & drop an image here, or click to select a file"}
        </p>
      )}
      <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, WEBP</p>
      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm" onClick={(e) => e.stopPropagation()}>
          {error}
        </div>
      )}
    </div>
  );
}
