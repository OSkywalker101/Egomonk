import type { ArchetypeKey } from "./archetypes";

/**
 * Rotating poster frames that hold the reveal screen while the WebGL coin
 * boots.
 *
 * An archetype is only listed here once its file actually exists in
 * public/media, so an archetype without a poster renders nothing and never
 * requests a missing asset. To add one, drop in public/media/<archetype>.gif
 * and add the entry below.
 */
const POSTERS: Partial<Record<ArchetypeKey, string>> = {
  cockroach: "/media/cockroach.gif",
};

/**
 * Strong references to in-flight poster downloads. Without them the Image
 * objects can be collected mid-load and the fetch is dropped.
 */
const preloads = new Map<string, HTMLImageElement>();

export function coinPoster(archetype: ArchetypeKey): string | null {
  return POSTERS[archetype] ?? null;
}

export function preloadCoinPoster(archetype: ArchetypeKey): void {
  const src = coinPoster(archetype);
  if (!src || preloads.has(src)) return;
  const img = new Image();
  img.src = src;
  preloads.set(src, img);
}
