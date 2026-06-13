import { useEffect } from "react";
import { useAnalyzerStore } from "@/store/analyzerStore";
import { analyzeImage } from "@/lib/api/client";

export function useAutoAnalyze() {
  const {
    originalFile,
    thresholdMethod,
    thresholdValue,
    analysisMode,
    runSensitivity,
    blurLevel,
    denoise,
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
        runSensitivity,
        blurLevel,
        denoise,
      });
      setResult({ ...res.result, sensitivity: res.sensitivity ?? null });
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

  // Watch for thresholdMethod, analysisMode, runSensitivity, blurLevel, denoise
  useEffect(() => {
    if (!originalFile) return;
    triggerAnalysis(originalFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholdMethod, analysisMode, runSensitivity, blurLevel, denoise]);

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
