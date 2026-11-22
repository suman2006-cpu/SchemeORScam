/**
 * Downscales an uploaded screenshot to max 1600px on its longest edge
 * and redraws onto an offscreen canvas to strip all EXIF metadata.
 * Enforces the 5 MB limit (Section 5B & Section 9).
 */

const MAX_DIMENSION = 1600;
const MAX_BYTES = 5 * 1024 * 1024;

export interface PreparedImage {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
}

export async function prepareScreenshotForOcr(file: File): Promise<PreparedImage> {
  if (file.size > MAX_BYTES * 2) {
    // Even before downscale, reject excessively large files
    throw new Error('IMAGE_TOO_LARGE');
  }

  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
      el.src = bitmapUrl;
    });

    let { naturalWidth: width, naturalHeight: height } = img;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CANVAS_UNAVAILABLE');

    // Redrawing on canvas strips all EXIF tags (GPS, camera serial, timestamps)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1] ?? '';
    const approxBytes = Math.ceil((base64.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      throw new Error('IMAGE_TOO_LARGE');
    }

    return {
      base64,
      mimeType: 'image/jpeg',
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}
