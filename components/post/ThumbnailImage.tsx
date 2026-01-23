"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "./ImageLightbox";

interface ThumbnailImageProps {
  src: string;
  alt: string;
}

export function ThumbnailImage({ src, alt }: ThumbnailImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        className="post-thumbnail relative w-full aspect-video mb-8 rounded-lg overflow-hidden cursor-pointer"
        onClick={() => setLightboxOpen(true)}
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

      <ImageLightbox images={[{ src, alt }]} open={lightboxOpen} index={0} onClose={() => setLightboxOpen(false)} />
    </>
  );
}
