// The site's icons and the social preview picture, made from Barynt's logo
// and a screenshot of the app. Run it when the logo or the look changes and
// commit what it writes to public/:
//
//   BARYNT_DIR=../Barynt node scripts/brand-assets.mjs
//
// favicon.svg           the logo (browsers that take SVG)
// favicon-32.png        the same, 32 px, for the rest
// apple-touch-icon.png  180 px on the app's dark background (iOS needs one)
// og.png                1200×630 for link previews (Open Graph, Twitter)
//
// Needs `sharp` (a dependency) and Playwright (global), for the preview.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const SRC = resolve(process.env.BARYNT_DIR || "../Barynt");
const OUT = resolve("public");
const BG = "#0e1516";
mkdirSync(OUT, { recursive: true });

// ── Icons ──
const logo = join(SRC, "public/Logo/color/Logo.svg");
copyFileSync(logo, join(OUT, "favicon.svg"));
await sharp(logo, { density: 600 }).resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(OUT, "favicon-32.png"));
const icon = await sharp(logo, { density: 600 }).resize(124, 124, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: BG } })
  .composite([{ input: icon, gravity: "center" }])
  .png()
  .toFile(join(OUT, "apple-touch-icon.png"));

// ── Social preview ──
const wordmark = readFileSync(join(SRC, "public/Logo/white/Logo_horizontal.svg"), "utf8");
const shot = (await sharp(join(SRC, "docs/guide/assets/en/overview.webp")).png().toBuffer()).toString("base64");
const html = `<!doctype html><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;position:relative;background:${BG};font-family:Inter,"Inter Display",sans-serif;color:#eaf4f5}
  .glow{position:absolute;inset:0;background:radial-gradient(700px 420px at 12% 0%,rgba(15,149,162,.38),transparent 70%),radial-gradient(600px 400px at 100% 100%,rgba(253,200,80,.14),transparent 70%)}
  .logo{position:absolute;left:64px;top:60px;width:300px}
  .logo svg{width:100%;height:auto;display:block}
  h1{position:absolute;left:64px;top:190px;width:520px;font-size:62px;line-height:1.05;font-weight:800;letter-spacing:-.02em}
  h1 span{color:#32bdc4}
  p{position:absolute;left:64px;top:430px;width:480px;font-size:25px;line-height:1.4;color:#a8bcc0}
  .url{position:absolute;left:64px;bottom:52px;font-size:26px;font-weight:700;color:#32bdc4}
  .shot{position:absolute;left:628px;top:150px;width:860px;border-radius:18px;border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 80px rgba(0,0,0,.6)}
</style><div class="glow"></div>
<div class="logo">${wordmark}</div>
<h1>The issue tracker you <span>host yourself.</span></h1>
<p>Boards, dashboards, roles, SSO, API and MCP. Open source, MIT.</p>
<div class="url">barynt.dev</div>
<img class="shot" src="data:image/png;base64,${shot}">`;
const htmlFile = join(OUT, "..", ".barynt", "og.html");
mkdirSync(join(OUT, "..", ".barynt"), { recursive: true });
writeFileSync(htmlFile, html);
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${htmlFile}`);
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, "og.png") });
await browser.close();
console.log("wrote favicon.svg, favicon-32.png, apple-touch-icon.png, og.png");
