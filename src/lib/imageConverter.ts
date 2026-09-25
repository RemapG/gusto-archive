/**
 * Client-side image converter and compressor.
 * - Converts Apple HEIC/HEIF photos to standard JPEG
 * - Resizes and compresses oversized camera/phone photos to ~400-800KB
 * - Produces reliable preview URLs that work on all browsers
 */

export async function processImageFile(
  file: File,
  maxDimension: number = 2048,
  quality: number = 0.85
): Promise<{ file: File; previewUrl: string }> {
  let workingFile = file;

  // 1. Detect if file is Apple HEIC / HEIF
  const isHeic =
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';

  if (isHeic && typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid SSR issues
      const heic2anyModule = await import('heic2any' as any);
      const heic2any = heic2anyModule.default || heic2anyModule;
      
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });

      const blob = Array.isArray(converted) ? converted[0] : converted;
      const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      workingFile = new File([blob], newName, { type: 'image/jpeg' });
    } catch (err) {
      console.warn("HEIC conversion failed:", err);
    }
  }

  // 2. Compress & resize via Canvas if needed
  if (typeof window !== 'undefined' && workingFile.type.startsWith('image/')) {
    try {
      const compressed = await compressImageWithCanvas(workingFile, maxDimension, quality);
      if (compressed) {
        workingFile = compressed;
      }
    } catch (err) {
      console.warn("Canvas compression skipped:", err);
    }
  }

  const previewUrl = URL.createObjectURL(workingFile);
  return { file: workingFile, previewUrl };
}

function compressImageWithCanvas(
  file: File,
  maxDimension: number,
  quality: number
): Promise<File | null> {
  return new Promise((resolve) => {
    // Don't resize vector SVG or animated GIF
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      return resolve(null);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Only resize if bigger than maxDimension or file > 1.5MB
      const isOversized = width > maxDimension || height > maxDimension;
      const isHeavy = file.size > 1.5 * 1024 * 1024;

      if (!isOversized && !isHeavy) {
        return resolve(null);
      }

      if (isOversized) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      // Draw with smooth scaling
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          const compressedFile = new File([blob], newName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}
