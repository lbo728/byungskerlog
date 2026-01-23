"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useImageLightbox } from "./ImageLightboxContext";

interface ThumbnailImageProps {
  src: string;
  alt: string;
}

export function ThumbnailImage({ src, alt }: ThumbnailImageProps) {
  const { registerImages, openLightbox } = useImageLightbox();

  useEffect(() => {
    registerImages([{ src, alt }], "thumbnail");
  }, [src, alt, registerImages]);

  return (
    <div
      className="post-thumbnail relative w-full aspect-video mb-8 rounded-lg overflow-hidden cursor-pointer"
      onClick={() => openLightbox(src)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover hover:opacity-90 transition-opacity"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
      />
    </div>
  );
}
