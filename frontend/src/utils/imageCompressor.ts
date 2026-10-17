/**
 * Utility to compress and optimize images client-side using HTML5 Canvas.
 * Reduces raw 5-10MB photos to ~25-45KB WebP/JPEG thumbnails optimized for flashcards.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 480,
    maxHeight = 360,
    quality = 0.8,
    format = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WebP)!'));
    }

    // Reject overly massive files (> 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return reject(new Error('Kích thước ảnh quá lớn (tối đa 20MB)!'));
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return reject(new Error('Dữ liệu ảnh trống.'));

      const img = new Image();
      img.onerror = () => reject(new Error('Không thể giải mã hình ảnh.'));

      img.onload = () => {
        let { width, height } = img;

        // Proportional resize
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Không thể khởi tạo Canvas 2D context.'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw background white for transparent PNGs converted to JPEG
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compact data URL
        try {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}

export interface OptimizeUrlOptions {
  width?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg';
  fit?: 'crop' | 'max' | 'fill';
}

/**
 * Automatically transforms remote image URLs (Unsplash, Pexels)
 * with CDN query parameters for optimal width, WebP compression, and fast loading.
 */
export function optimizeImageUrl(url?: string, options: OptimizeUrlOptions = {}): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const {
    width = 640,
    quality = 80,
    format = 'auto',
    fit = 'crop',
  } = options;

  // Optimize Unsplash images
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('auto', format === 'auto' ? 'format' : format);
      urlObj.searchParams.set('fit', fit);
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      return urlObj.toString();
    } catch {
      const [base] = trimmed.split('?');
      return `${base}?auto=format&fit=crop&w=${width}&q=${quality}`;
    }
  }

  // Optimize Pexels images
  if (trimmed.includes('images.pexels.com')) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('auto', 'compress');
      urlObj.searchParams.set('cs', 'tinysrgb');
      urlObj.searchParams.set('w', width.toString());
      return urlObj.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

