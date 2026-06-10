/**
 * imageProcessor.ts
 *
 * Pure utility — no 'use client' directive needed (imported only in client
 * components). Loads a File into a binary (foreground=255 / background=0)
 * Uint8Array using Otsu thresholding, capped at 1024 px on the longest side.
 */

// ---------------------------------------------------------------------------
// Private — Otsu threshold computation
// ---------------------------------------------------------------------------

/**
 * Compute the Otsu threshold for a grayscale image by maximising
 * inter-class variance between the background and foreground classes.
 */
function otsuThreshold(grayscale: Uint8ClampedArray): number {
  // Build 256-bin histogram
  const histogram = new Float64Array(256);
  for (let i = 0; i < grayscale.length; i++) {
    histogram[grayscale[i]]++;
  }
  const total = grayscale.length;

  // Normalise
  for (let i = 0; i < 256; i++) {
    histogram[i] /= total;
  }

  let bestThreshold = 0;
  let maxVariance = 0;

  // Running background stats
  let wB = 0; // weight (probability mass) of background class
  let sumB = 0; // weighted sum of background pixel intensities
  let totalSum = 0;
  for (let i = 0; i < 256; i++) {
    totalSum += i * histogram[i];
  }

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    const wF = 1 - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (totalSum - sumB) / wF;

    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVariance) {
      maxVariance = between;
      bestThreshold = t;
    }
  }

  return bestThreshold;
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Load an image File, resize to ≤1024 px on the longest side, convert to
 * grayscale, apply Otsu thresholding, and return a binary pixel array
 * (255 = foreground, 0 = background) plus the final canvas dimensions.
 */
export async function loadImageAsBinary(
  file: File,
): Promise<{ pixels: Uint8Array; width: number; height: number }> {
  const url = URL.createObjectURL(file);

  try {
    // Load image into an HTMLImageElement
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to load image"));
      el.src = url;
    });

    // Cap at 1024 px on the longest side (same limit as the backend)
    const MAX = 1024;
    let { naturalWidth: w, naturalHeight: h } = img;
    if (w > MAX || h > MAX) {
      if (w >= h) {
        h = Math.round((h / w) * MAX);
        w = MAX;
      } else {
        w = Math.round((w / h) * MAX);
        h = MAX;
      }
    }

    // Draw to an off-screen canvas at the target size
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    ctx.drawImage(img, 0, 0, w, h);

    // Extract RGBA pixel data
    const { data } = ctx.getImageData(0, 0, w, h);

    // Convert to grayscale (luminance weights matching sRGB standard)
    const gray = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }

    // Otsu threshold → binary image
    const threshold = otsuThreshold(gray);
    const pixels = new Uint8Array(w * h);
    for (let i = 0; i < gray.length; i++) {
      pixels[i] = gray[i] > threshold ? 255 : 0;
    }

    return { pixels, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
