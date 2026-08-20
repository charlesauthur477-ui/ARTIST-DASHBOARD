"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "@/types/artist";

interface GalleryLightboxProps {
  images: GalleryImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function GalleryLightbox({ images, index, onClose, onNavigate }: GalleryLightboxProps) {
  const open = index !== null;
  const current = open ? images[index] : null;

  const goNext = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <p className="text-xs tracking-wide text-white/60">
              {index !== null ? index + 1 : 0} / {images.length}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close gallery"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-2 pb-4 sm:px-16">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white sm:left-3"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="relative h-full max-h-[75vh] w-full max-w-4xl">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white sm:right-3"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
