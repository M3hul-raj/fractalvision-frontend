import { useEffect } from "react";
import { useAnalyzerStore } from "@/store/analyzerStore";
import { analyzeImage } from "@/lib/api/client";

export function useAutoAnalyze() {
  const {
    originalFile,
    thresholdMethod,
    thresholdValue,
    analysisMode,
    setIsAnalyzing,
    setResult,
    setLastResponse,
    setBinaryImageUrl,
    setError,
  } = useAnalyzerStore();

  const triggerAnalysis = async (file: File) => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const res = await analyzeImage(file, {
        analysisMode,
        thresholdMethod,
        thresholdValue,
      });
      setResult(res.result);
      setLastResponse(res);
      if (res.binary_image_b64) {
        setBinaryImageUrl(`data:image/png;base64,${res.binary_image_b64}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to auto-analyze image");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Watch for thresholdMethod and analysisMode
  useEffect(() => {
    if (!originalFile) return;
    triggerAnalysis(originalFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdMethod, analysisMode]);

  // Watch for thresholdValue (debounced)
  useEffect(() => {
    if (!originalFile || thresholdMethod !== "manual") return;
    const timer = setTimeout(() => {
      triggerAnalysis(originalFile);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdValue]);
}
