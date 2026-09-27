/**
 * Verifies the per-archetype reveal poster on the static export.
 *
 * Drives the flow down the Cockroach path (option A on every question, which
 * is the only archetype with a poster file) and checks that the poster appears
 * on the reveal and then hands over to the live WebGL coin.
 *
 * Usage: node scripts/verify-poster.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 4174;
const BASE = process.argv[2] || `http://localhost:${PORT}`;

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
  server = spawn(process.execPath, ["scripts/static-server.mjs", String(PORT)], {
    stdio: "ignore",
  });

  if (!(await waitForServer(BASE))) {
    console.error("static server did not start");
    process.exit(1);
  }

  const browser = await chromium.launch({
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  const failedRequests = [];
  let gifStatus = null;
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
  });
  page.on("requestfailed", (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
    if (r.url().includes("cockroach.gif")) gifStatus = r.status();
  });

  await page.goto(BASE + "/", { waitUntil: "networkidle" });

  const begin = page.locator("button:has-text('BEGIN')");
  await begin.waitFor({ state: "visible", timeout: 20000 });
  const input = page.locator("input[type=text]").first();
  await input.click();
  await input.pressSequentially("Poster Check Ltd", { delay: 30 });
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("BEGIN"),
      );
      return b && !b.disabled;
    },
    { timeout: 15000 },
  );
  await begin.click();

  // Option A on all three questions is the pure-resilience path, which resolves
  // to Cockroach - the only archetype with a poster file.
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector("h2", { timeout: 15000 });
    const buttons = await page.$$("main button");
    await buttons[0].click();
    await page.waitForTimeout(700);
  }

  await page.waitForSelector("text=FOUNDER PASSPORT", { timeout: 25000 });
  const header = await page.textContent("header");
  check("flow resolves to Cockroach", /COCKROACH/.test(header || ""), (header || "").trim());

  // The poster should be up during the reveal, well before the metal coin has
  // finished fading in.
  await sleep(1200);
  const posterState = await page.evaluate(() => {
    const img = document.querySelector('img[src*="cockroach"]');
    if (!img) return { present: false };
    const wrapper = img.parentElement;
    return {
      present: true,
      src: img.getAttribute("src"),
      complete: img.complete,
      wrapperOpacity: wrapper ? Number(getComputedStyle(wrapper).opacity) : -1,
    };
  });
  check("poster rendered on reveal", posterState.present, posterState.src || "missing");
  check("poster image decoded", posterState.complete === true);
  check("poster faded in", posterState.wrapperOpacity > 0.5, `opacity=${posterState.wrapperOpacity}`);

  // The metal coin finishes revealing at REVEAL_DELAY + REVEAL_DURATION, after
  // which the poster fades and unmounts so it stops decoding behind the canvas.
  // Poll rather than sleep once, so a slow frame rate is visible as a lag
  // instead of looking like a failure.
  const trajectory = [];
  let handedOver = false;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const state = await page.evaluate(() => {
      const img = document.querySelector('img[src*="cockroach"]');
      if (!img) return null;
      return Number(getComputedStyle(img.parentElement).opacity);
    });
    if (state === null) {
      handedOver = true;
      trajectory.push(`${i + 1}s:gone`);
      break;
    }
    trajectory.push(`${i + 1}s:${state.toFixed(2)}`);
  }
  console.log(`        fade: ${trajectory.join(" ")}`);
  check("poster handed over to live coin", handedOver === true);

  const canvas = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    return c ? { w: c.width, h: c.height } : null;
  });
  check("live canvas present after handoff", !!canvas, JSON.stringify(canvas));
  check("poster asset served 200", gifStatus === 200, `status=${gifStatus}`);
  check("no failed network requests", failedRequests.length === 0, failedRequests.join("; "));
  check("no console/page errors", errors.length === 0, errors.slice(0, 3).join("; "));

  await browser.close();
  server.kill();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n  ${passed}/${results.length} checks passed\n`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => {
  console.error(e);
  if (server) server.kill();
  process.exit(1);
});
