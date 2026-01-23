"use client";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export interface ImageData {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  images: ImageData[];
  open: boolean;
  index: number;
  onClose: () => void;
}

export function ImageLightbox({ images, open, index, onClose }: ImageLightboxProps) {
  if (!open || images.length === 0) return null;

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={images.map((img) => ({
        src: img.src,
        alt: img.alt,
      }))}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
      }}
      carousel={{
        finite: images.length <= 1,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
    />
  );
}
