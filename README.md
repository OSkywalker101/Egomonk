# The Instinct Series

An interactive WebGL coin experience. A visitor enters a company name, answers three
scenario questions, and their answers resolve to one of four archetypes. The result is
a spinning struck coin, a founder passport with a QR code, and downloadable STL and PDF
artefacts.

The whole thing runs in the browser. There is no backend, no database, and no paid
service. It builds to a folder of plain files that can be hosted for free.

**Live:** <https://egomonk.vercel.app>

---

## Requirements

- Node.js 20.9 or newer. This is declared as `engines.node` in `package.json`, so a host
  that defaults to an older runtime will refuse the install rather than failing mid-build.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on <http://localhost:3000> |
| `npm run build` | Production build, exports static files to `out/` |
| `npm run preview` | Serves the built `out/` folder on <http://localhost:4173> |
| `npm run verify:export` | Automated end-to-end test of the built site |
| `npm run verify:poster` | End-to-end test of the Cockroach reveal poster and its handoff |
| `npm run lint` | ESLint |

`npm start` also exists, but note it will not work: this project uses a static export,
so there is no Next.js server to start. Use `npm run preview` to view a build.

Both verify scripts take an optional base URL, so the same checks can be pointed at a live
deployment instead of a local build:

```bash
node scripts/verify-export.mjs https://egomonk.vercel.app
node scripts/verify-poster.mjs https://egomonk.vercel.app
```

Given a URL they skip the local static server entirely and test only what the host serves.

---

## Deploying for free

`npm run build` writes a self-contained site to `out/`. Upload that folder to any static
host. All of these have a free tier that is sufficient for this site.

**Cloudflare Pages** (recommended)
1. Push this folder to a Git repository.
2. In Cloudflare Pages, create a project and connect the repository.
3. Build command: `npm run build`. Output directory: `out`.
4. Deploy. You get a `*.pages.dev` URL, and a custom domain is optional.

**Netlify**
1. Connect the repository.
2. Build command: `npm run build`. Publish directory: `out`.
3. Deploy.

**Vercel** (currently hosting this site)
1. Import the repository, branch `main`.
2. Set **Application Preset** to **Next.js**. Vercel can pre-select *Other* if it probed
   the repository before the source was pushed, and *Other* skips the Next.js pipeline:
   `next build` does not run the way the framework expects and the `out/` export is not
   detected. Nothing else needs configuring — Vercel reads `output: "export"` from
   `next.config.ts` and serves `out/`.
3. Deploy.

Vercel's free Hobby plan is restricted to non-commercial use, which does not cover a
client deliverable. For commercial work use a paid Vercel plan, or Cloudflare Pages.

**GitHub Pages**
1. Push the folder to a repository and enable Pages.
2. This is the one host that serves from a subpath, so a `basePath` is required. See
   [Hosting from a subpath](#hosting-from-a-subpath) below.

### Important: it must be served over HTTP

Open `out/index.html` directly from disk with a `file://` URL and the page will appear
broken. Browsers block the JavaScript module loading and font requests that a `file://`
page is not allowed to make, so the app never hydrates and nothing responds to clicks.

Serve the folder over HTTP instead. To check a build locally:

```bash
npm run build
npm run preview     # http://localhost:4173
```

Any static file server works. Dragging the `out` folder onto
[VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
is another quick option.

### Hosting from a subpath

Asset URLs in the export are absolute (`/_next/...`), which is correct for a domain root
and wrong for a subfolder such as `https://user.github.io/repo/`. Do not fix this by
rewriting the built files by hand. Next.js's client runtime asserts on those paths, and
editing them breaks hydration.

Instead, set `basePath` at build time, which is the supported mechanism:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/repo",   // no trailing slash
};
```

Rebuild and the export will reference `/repo/_next/...` correctly. Remember to remove it
before building for a root domain.

---

## How it works

- **Scoring.** `src/lib/archetypes.ts` holds the four archetypes and the mapping from
  answers to a result. `src/lib/store.ts` is a Zustand store holding the current step.
- **Flow.** `src/app/page.tsx` is a state machine over `currentStep`: landing, three
  scenarios, loading screen, then the reveal.
- **The coin.** `src/components/coin/` is a React Three Fiber scene. The result is a
  struck silver coin: a milled edge of instanced reeds, an engraved face driven by a
  `bumpMap`, a cobalt enamel palette, and a thin iridescent foil band.
- **Lighting.** A metal has no diffuse term, so everything visible on the coin is a
  reflection. The lighting rig is a procedural `Environment` built from `Lightformer`
  components (`src/components/coin/CoinCanvas.tsx`). It is generated in code rather than
  loaded from an HDR file, so there is no external asset to host and nothing to fetch at
  runtime.
- **Downloads.** `src/lib/stl.ts` and `src/lib/pdf.ts` build the files in the browser and
  save them via a blob URL. No server is involved.

### A note on the coin's appearance

Two things are easy to get wrong when a coin reads as "blue plastic" instead of metal.

A metal tints its own reflections by its albedo, so a blue base colour makes the coin
permanently blue no matter how good the lighting is. Keep the face silver and let blue
live in the enamel inlay and the foil band only.

The environment map is the lighting. A dark environment reflects dark. The studio grey
background in `CoinCanvas.tsx` is what gives the silver its base tone; the `Lightformer`
strips on top of it supply the specular highlights.

### Reveal posters

An archetype can have a rotating poster frame that holds the reveal while the live coin
takes over. Cockroach currently has one at `public/media/cockroach.gif`.

To add another, drop in `public/media/<archetype>.gif` and add the entry to `POSTERS` in
`src/lib/coinPosters.ts`. An archetype with no entry renders no poster and never requests
a missing file, so the three archetypes without one behave exactly as before.

The handoff is driven by the coin transition, not by load events: the poster fades out
once the metal coin has finished revealing, which is `REVEAL_DELAY + REVEAL_DURATION`
(3.4s) in `CoinCanvas.tsx`. If WebGL never starts, the poster simply stays, which is the
right failure mode. Files are preloaded during the loading screen, since the archetype is
only final at that point.

**Cost:** these are large files. `cockroach.gif` is 3.29 MB, which roughly doubles the
export from 3.26 MB to 6.56 MB. Since it lands on the reveal, keep posters as small as
the look allows.

A static host serves it with `Cache-Control: max-age=0, must-revalidate`, so the poster is
revalidated on every load. That is survivable at 3.29 MB thanks to the ETag, but it is one
more reason to compress. If you do add long-lived cache headers for `/media/*`, remember
these filenames are not content-hashed, so a replaced poster would otherwise be served
from cache for the entire `max-age`.

---

## Testing

`npm run verify:export` builds nothing itself, so run `npm run build` first. It starts a
local static server, drives the whole flow in a headless browser, and checks that the
reveal renders, the WebGL context survives, and the STL and PDF downloads work. It fails
on any console error or failed network request.

`npm run verify:poster` does the same but takes the Cockroach path (option A on every
question) and additionally checks that the poster appears, fades in, and hands over to
the live canvas. The default flow in `verify:export` picks option C, which resolves to
Unicorn, so it does not exercise the poster.

The build must be able to download Google Fonts, because `src/app/layout.tsx` uses
`next/font/google`. The first build needs network access; the exported result is fully
self-contained afterwards.

Both scripts accept a deployed URL, as shown in [Commands](#commands). Against the live
Vercel deployment they currently report 15/15 and 9/9 with no console or network errors,
so the static export, WebGL context, QR, downloads, and the poster handoff are all
confirmed in production rather than only against a local build.
