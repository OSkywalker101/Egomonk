"use client";

import { useEffect, useState } from "react";
import type { ArchetypeKey } from "@/lib/archetypes";
import { coinPoster } from "@/lib/coinPosters";

const FADE_MS = 500;

/**
 * Holds the reveal frame while the WebGL coin boots, then gets out of the way
 * so the hologram-to-metal reveal plays uninterrupted. Renders nothing at all
 * for an archetype that has no poster file.
 *
 * The reveal remounts per step and the archetype is final by then, so neither
 * `src` nor `hidden` ever reverses here.
 */
export function CoinPoster({
  archetype,
  hidden,
}: {
  archetype: ArchetypeKey;
  hidden: boolean;
}) {
  const src = coinPoster(archetype);
  const [loaded, setLoaded] = useState(false);
  const [faded, setFaded] = useState(false);

  // Unmount once faded out, otherwise the GIF keeps decoding behind a live
  // canvas that has already taken over.
  useEffect(() => {
    if (!hidden) return;
    const id = setTimeout(() => setFaded(true), FADE_MS);
    return () => clearTimeout(id);
  }, [hidden]);

  if (!src || faded) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
        hidden || !loaded ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Static asset from /public/media, so the plain img is correct here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
