/**
 * Generate a thumbnail from a base64 image
 * Creates a smaller, compressed version for faster loading
 * Optimized for list views: smaller size and lower quality to reduce storage
 */
export const generateThumbnail = async (
  base64Image: string,
  maxWidth: number = 150, // Reduced from 200 to 150 for smaller file size
  maxHeight: number = 150, // Reduced from 200 to 150 for smaller file size
  quality: number = 0.5 // Reduced from 0.7 to 0.5 for better compression
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';
      const thumbnail = canvas.toDataURL(mimeType, quality);
      resolve(thumbnail);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail generation'));
    };
    
    img.src = base64Image;
  });
};

