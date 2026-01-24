"use client";

import type { ReactNode } from "react";
import { ImageLightboxProvider } from "./ImageLightboxContext";

interface PostImageGalleryProps {
  children: ReactNode;
}

export function PostImageGallery({ children }: PostImageGalleryProps) {
  return <ImageLightboxProvider>{children}</ImageLightboxProvider>;
}
