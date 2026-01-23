"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { ImageLightbox, type ImageData } from "./ImageLightbox";

interface ImageLightboxContextValue {
  registerImages: (images: ImageData[], source: string) => void;
  openLightbox: (src: string) => void;
}

const ImageLightboxContext = createContext<ImageLightboxContextValue | null>(null);

export function useImageLightbox() {
  const context = useContext(ImageLightboxContext);
  if (!context) {
    throw new Error("useImageLightbox must be used within ImageLightboxProvider");
  }
  return context;
}

interface ImageLightboxProviderProps {
  children: ReactNode;
}

export function ImageLightboxProvider({ children }: ImageLightboxProviderProps) {
  const [allImages, setAllImages] = useState<Map<string, ImageData[]>>(new Map());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const registerImages = useCallback((images: ImageData[], source: string) => {
    setAllImages((prev) => {
      const next = new Map(prev);
      next.set(source, images);
      return next;
    });
  }, []);

  const flatImages = useMemo(() => {
    const result: ImageData[] = [];
    const thumbnailImages = allImages.get("thumbnail") || [];
    const contentImages = allImages.get("content") || [];
    result.push(...thumbnailImages, ...contentImages);
    return result;
  }, [allImages]);

  const openLightbox = useCallback(
    (src: string) => {
      const index = flatImages.findIndex((img) => img.src === src);
      if (index >= 0) {
        setLightboxIndex(index);
        setLightboxOpen(true);
      }
    },
    [flatImages]
  );

  const contextValue = useMemo(() => ({ registerImages, openLightbox }), [registerImages, openLightbox]);

  return (
    <ImageLightboxContext.Provider value={contextValue}>
      {children}
      <ImageLightbox
        images={flatImages}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </ImageLightboxContext.Provider>
  );
}
