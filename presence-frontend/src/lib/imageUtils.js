// Compresses a user-picked image file down to a small base64 data URL,
// entirely in the browser (canvas), so it can be stored directly as a
// string field (User.avatarUrl / Event.image) with no file-storage service
// (S3, Cloudinary, etc.) needed on the backend at all.

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class ImageError extends Error {}

/**
 * @param {File} file
 * @param {{ maxDim?: number, quality?: number, square?: boolean }} opts
 * @returns {Promise<string>} a `data:image/jpeg;base64,...` URL
 */
export function compressImageFile(file, { maxDim = 480, quality = 0.85, square = false } = {}) {
  if (!file) return Promise.reject(new ImageError('No file selected.'));
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return Promise.reject(new ImageError('Please choose a JPG, PNG, WEBP, or GIF image.'));
  }
  if (file.size > 15 * 1024 * 1024) {
    return Promise.reject(new ImageError('That image is too large (max 15MB before compression).'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageError('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new ImageError('Could not read that image.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (square) {
            const side = Math.min(width, height);
            const sx = (width - side) / 2;
            const sy = (height - side) / 2;
            const dim = Math.min(maxDim, side);
            const canvas = document.createElement('canvas');
            canvas.width = dim;
            canvas.height = dim;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, sx, sy, side, side, 0, 0, dim, dim);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
          const scale = Math.min(1, maxDim / Math.max(width, height));
          const w = Math.round(width * scale);
          const h = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          reject(new ImageError('Could not process that image.'));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
