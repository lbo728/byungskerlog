const MAX_SIZE = 500 * 1024;

export async function optimizeImage(file: File, targetSize: number = MAX_SIZE): Promise<File> {
  if (file.size <= targetSize) {
    return file;
  }

  const isGif = file.type === "image/gif";
  if (isGif) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      let { width, height } = img;
      const maxDimension = 1920;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      let blob: Blob | null = null;
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

      while (quality > 0.1) {
        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, outputType, quality));

        if (blob && blob.size <= targetSize) {
          break;
        }

        quality -= 0.1;
      }

      if (!blob) {
        reject(new Error("Failed to compress image"));
        return;
      }

      if (blob.size > targetSize && (width > 800 || height > 800)) {
        const scale = Math.sqrt(targetSize / blob.size) * 0.9;
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);

        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, outputType, 0.85));
      }

      if (!blob) {
        reject(new Error("Failed to compress image"));
        return;
      }

      const extension = outputType === "image/png" ? ".png" : ".jpg";
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const optimizedFile = new File([blob], `${baseName}${extension}`, {
        type: outputType,
        lastModified: Date.now(),
      });

      resolve(optimizedFile);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
