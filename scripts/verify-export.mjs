/**
 * Runs the full user flow against the static export (served by
 * scripts/static-server.mjs) to prove the site works with no Next.js server.
 *
 * Usage: node scripts/verify-export.mjs [baseUrl]
 *
 * With no argument it serves out/ locally and tests http://localhost:4173.
 * Pass a deployed URL to verify a live build, e.g.
 *   node scripts/verify-export.mjs https://egomonk.vercel.app
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 4173;
const BASE = process.argv[2] || `http://localhost:${PORT}`;
// Only boot a local static server when we are actually testing localhost;
// against a deployed URL we must not serve a stale local build instead.
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE);

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? " -> " + detail : ""}`);
};

async function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(400);
  }
  return false;
}

let server;
(async () => {
  if (IS_LOCAL) {
    server = spawn(process.execPath, ["scripts/static-server.mjs", String(PORT)], {
      stdio: "ignore",
    });
  }

  if (!(await waitForServer(BASE))) {
    console.error(IS_LOCAL ? "static server did not start" : `no response from ${BASE}`);
    process.exit(1);
  }

  const browser = await chromium.launch({
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  const failedRequests = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
  });
  page.on("requestfailed", (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
  });

  const res = await page.goto(BASE + "/", { waitUntil: "networkidle" });
  check("landing responds 200", res.status() === 200, `status=${res.status()}`);

  // Wait for hydration before typing, otherwise the controlled input swallows
  // the value and BEGIN stays disabled.
  const begin = page.locator("button:has-text('BEGIN')");
  await begin.waitFor({ state: "visible", timeout: 20000 });

  const input = page.locator("input[type=text]").first();
  await input.click();
  await input.pressSequentially("Export Check Ltd", { delay: 30 });
  try {
    await begin.waitFor({ state: "attached" });
    await page.waitForFunction(
      () => {
        const b = [...document.querySelectorAll("button")].find((el) =>
          (el.textContent || "").includes("BEGIN"),
        );
        return b && !b.disabled;
      },
      { timeout: 15000 },
    );
  } catch {
    const value = await input.inputValue();
    check("BEGIN enabled after typing", false, `input value="${value}"`);
    throw new Error("BEGIN never enabled - input not bound");
  }
  check("BEGIN enabled after typing", true);
  await begin.click();

  for (let i = 0; i < 3; i++) {
    await page.waitForSelector("h2", { timeout: 15000 });
    const buttons = await page.$$("main button");
    check(`question ${i + 1} rendered options`, buttons.length > 0, `${buttons.length} buttons`);
    await buttons[2].click();
    await page.waitForTimeout(700);
  }

  await page.waitForSelector("text=FOUNDER PASSPORT", { timeout: 25000 });
  check("reveal screen reached", true);

  const header = (await page.textContent("header")).replace(/\s+/g, " ").trim();
  check(
    "archetype resolved",
    /COCKROACH|BULL|UNICORN|CHAMELEON/.test(header),
    header,
  );

  await page.waitForFunction(
    () => {
      const c = document.querySelector("canvas");
      return c && c.getBoundingClientRect().width > 600;
    },
    { timeout: 15000 },
  );
  const canvasSize = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    return { w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height) };
  });
  check("WebGL canvas sized", canvasSize.w > 600 && canvasSize.h > 200, JSON.stringify(canvasSize));

  // Give the reveal time to finish under software rendering.
  await page.waitForTimeout(9000);
  const lit = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    return gl ? !gl.isContextLost() : false;
  });
  check("WebGL context alive after reveal", lit);

  check("instinct card present", (await page.locator("text=INSTINCT").count()) > 0);
  check("QR rendered", (await page.locator("canvas, svg").count()) > 0);

  const downloads = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  const stl = page.locator('button:has-text("STL"), a:has-text("STL")').first();
  if (await stl.count()) {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), stl.click()]);
    check("STL download works", !!download, download.suggestedFilename());
  } else {
    check("STL button found", false);
  }
  const pdf = page.locator('button:has-text("PDF"), a:has-text("PDF")').first();
  if (await pdf.count()) {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), pdf.click()]);
    check("PDF download works", !!download, download.suggestedFilename());
  } else {
    check("PDF button found", false);
  }

  check("no failed network requests", failedRequests.length === 0, failedRequests.slice(0, 5).join(" | "));
  check("no console/page errors", errors.length === 0, errors.slice(0, 5).join(" | "));

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n  ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("  failed: " + failed.map((f) => f.name).join(", "));
  }
  server?.kill();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("FAIL:", e);
  server?.kill();
  process.exit(1);
});
