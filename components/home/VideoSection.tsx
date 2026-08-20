"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { ArtistVideo } from "@/types/artist";

function embedUrl(video: ArtistVideo) {
  if (video.platform === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`;
  }
  if (video.platform === "vimeo") {
    return `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
  }
  return video.videoId;
}

export function VideoPlayer({ video }: { video: ArtistVideo }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {playing ? (
        video.platform === "local" ? (
          <video
            src={video.videoId}
            controls
            autoPlay
            className="h-full w-full"
            poster={video.posterImage}
          />
        ) : (
          <iframe
            src={embedUrl(video)}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative block h-full w-full text-left"
          aria-label={`Play ${video.title}`}
        >
          <Image
            src={video.posterImage}
            alt={`${video.title} — video poster`}
            fill
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bronze-400/95 text-[#0b0a09] shadow-lg transition group-hover:scale-105 sm:h-20 sm:w-20">
              <Play className="ml-1 h-6 w-6 fill-current sm:h-7 sm:w-7" />
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 sm:p-6">
            <span className="block font-display text-lg text-white sm:text-xl">{video.title}</span>
            {video.description ? (
              <span className="mt-1 block text-sm text-white/75">{video.description}</span>
            ) : null}
          </span>
        </button>
      )}
    </div>
  );
}
