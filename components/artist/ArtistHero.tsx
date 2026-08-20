"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { Artist } from "@/types/artist";
import { Button } from "@/components/ui/Button";
import { bookingHref } from "@/lib/nav";

export function ArtistHero({ artist }: { artist: Artist }) {
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden sm:min-h-screen">
      <div className="absolute inset-0">
        <Image
          src={artist.heroImage}
          alt={`${artist.name} — hero portrait`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-xs font-medium tracking-[0.3em] text-bronze-300 uppercase"
        >
          {artist.genre}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-display mt-3 text-5xl leading-[0.95] text-white text-balance sm:text-7xl md:text-8xl"
        >
          {artist.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-4 text-base tracking-wide text-white/85 sm:text-lg"
        >
          {artist.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <Button href={bookingHref(artist.slug)}>Book Now</Button>
          <Button href="#watch" variant="secondary" icon={<Play className="h-4 w-4" />}>
            Watch Live
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
