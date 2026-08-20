"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { GalleryCategory, GalleryImage } from "@/types/artist";
import { cn } from "@/lib/cn";
import { GalleryLightbox } from "./GalleryLightbox";

const CATEGORY_LABEL: Record<GalleryCategory | "all", string> = {
  all: "All",
  live: "Live",
  editorial: "Editorial",
  studio: "Studio",
  backstage: "Backstage",
  events: "Events",
};

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    const present = new Set(images.map((i) => i.category));
    return (["all", ...Array.from(present)] as (GalleryCategory | "all")[]);
  }, [images]);

  const filtered = useMemo(
    () => (filter === "all" ? images : images.filter((i) => i.category === filter)),
    [images, filter]
  );

  if (images.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-subtle px-6 py-12 text-center text-sm text-muted">
        The gallery is being updated — check back soon.
      </p>
    );
  }

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              "min-h-10 flex-shrink-0 rounded-full border px-4 text-sm font-medium tracking-wide transition",
              filter === cat
                ? "border-bronze-400 bg-bronze-400 text-[#0b0a09]"
                : "border-border-subtle text-foreground/75 hover:border-bronze-400/60 hover:text-bronze-300"
            )}
          >
            {CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 [&>*]:mb-3 sm:[&>*]:mb-4">
        {filtered.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group relative block w-full overflow-hidden rounded-md bg-surface break-inside-avoid"
            aria-label={`Open image: ${image.alt}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 640px) 33vw, 50vw"
              className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10"
            />
          </button>
        ))}
      </div>

      <GalleryLightbox
        images={filtered}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </div>
  );
}
