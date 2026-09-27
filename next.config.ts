import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Everything in this app is client-side, so it can be exported as plain
  // files and hosted for free on any static host (Cloudflare Pages, Netlify,
  // GitHub Pages, Vercel). No Node server, no build-time hosting cost.
  output: "export",

  // Emit out/index.html rather than out/index.html + redirect handling, which
  // is what most static hosts expect for a directory-style site.
  trailingSlash: true,

  // next/image needs a server to optimise; we serve the originals instead.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
