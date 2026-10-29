// Records every screenshot and video for barynt-site, in one language.
//   node produce.js en|de [only-name]
const { open, BASE, cursorScript, glide, boxOf } = require('./common');
const { execSync } = require('child_process');
const fs = require('fs');
const L = process.argv[2] || 'en';
const ONLY = process.argv[3];
const THEME = process.env.THEME === 'light' ? 'light' : 'dark';
const OUT = `${__dirname}/out/${L}${THEME === 'light' ? '/light' : ''}`; fs.mkdirSync(OUT, { recursive: true });
const T = {
  en: { d90: '90 days', d7: '7 days', mine: 'Mine', all: 'All', todo: 'Todo', prog: 'In Progress', comment: 'Picked this up, first draft is on a branch.', search: 'safari' },
  de: { d90: '90 Tage', d7: '7 Tage', mine: 'Meine', all: 'Alle', todo: 'Todo', prog: 'In Progress', comment: 'Hab ich übernommen, ein erster Entwurf liegt auf einem Branch.', search: 'safari' },
}[L];
const reset = () => execSync(`${__dirname}/reset.sh`, { stdio: 'inherit' });
const url = (path) => `${BASE}/${L}/nimbus${path}`;
const center = (b) => [b.x + b.width / 2, b.y + b.height / 2];

async function shot(name, path, { w = 1600, h = 800, before } = {}) {
  if (ONLY && ONLY !== name) return;
  const { b, ctx } = await open({ viewport: { width: w, height: h }, locale: L === 'de' ? 'de-DE' : 'en-US' });
  const p = await ctx.newPage();
  await p.goto(url(path), { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  if (before) await before(p);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  await b.close(); console.log('shot', L, name);
}

async function video(name, path, act, { w = 1600, h = 1000 } = {}) {
  if (ONLY && ONLY !== name) return;
  reset();
  const dir = `${__dirname}/vid-${L}-${name}`; fs.rmSync(dir, { recursive: true, force: true });
  const { b, ctx } = await open({ viewport: { width: w, height: h }, locale: L === 'de' ? 'de-DE' : 'en-US', recordVideo: { dir, size: { width: w, height: h } } });
  await ctx.addInitScript(cursorScript);
  const t0 = Date.now();
  const p = await ctx.newPage();
  await p.goto(url(path), { waitUntil: 'networkidle' }); await p.waitForTimeout(700);
  await p.mouse.move(w * 0.62, h * 0.9);
  await p.screenshot({ path: `${OUT}/${name}-poster.png` });
  const start = (Date.now() - t0) / 1000;
  await act(p, w, h);
  const end = (Date.now() - t0) / 1000;
  const file = await p.video().path(); await ctx.close(); await b.close();
  fs.copyFileSync(file, `${OUT}/${name}.webm`);
  fs.writeFileSync(`${OUT}/${name}.cut`, `${start.toFixed(2)} ${(end - start).toFixed(2)}`);
  reset(); console.log('video', L, name, start.toFixed(2), (end - start).toFixed(2));
}

(async () => {
  reset();
  // ── Hero videos (16:10) ──
  await video('hero-dashboard', '/dashboard', async (p, w, h) => {
    let at = [w * 0.62, h * 0.9];
    for (const label of [T.d90, T.d7, T.mine, T.all]) {
      const bx = await boxOf(p, label); if (!bx) continue;
      const to = center(bx); await glide(p, at, to, 650); at = to;
      await p.mouse.down(); await p.waitForTimeout(90); await p.mouse.up(); await p.waitForTimeout(1500);
    }
    await glide(p, at, [w * 0.62, h * 0.9], 700); await p.waitForTimeout(400);
  });
  await video('hero-board', '/project/web-app', async (p, w, h) => {
    const card = await p.locator('text=Add keyboard shortcuts for status changes').first().boundingBox();
    const col = await boxOf(p, T.prog);
    const from = center(card);
    await glide(p, [w * 0.62, h * 0.9], from, 800); await p.waitForTimeout(250);
    await p.mouse.down(); await p.waitForTimeout(150);
    await glide(p, from, [from[0] + 14, from[1] + 6], 160);
    await glide(p, [from[0] + 14, from[1] + 6], [col.x + 130, col.y + 110], 1200);
    await p.waitForTimeout(350); await p.mouse.up(); await p.waitForTimeout(1300);
    await glide(p, [col.x + 130, col.y + 110], [w * 0.62, h * 0.9], 700); await p.waitForTimeout(500);
  });
  await video('hero-issue', '/issue/NIM-8', async (p, w, h) => {
    const s = await boxOf(p, T.todo); const sc = center(s);
    await glide(p, [w * 0.62, h * 0.9], sc, 800); await p.mouse.down(); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(700);
    const o = await boxOf(p, T.prog); const oc = center(o);
    await glide(p, sc, oc, 450); await p.waitForTimeout(150); await p.mouse.down(); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(900);
    const ed = await p.locator('.ProseMirror').last().boundingBox(); const ec = [ed.x + 120, ed.y + 30];
    await glide(p, oc, ec, 800); await p.mouse.down(); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(300);
    await p.keyboard.type(T.comment, { delay: 45 }); await p.waitForTimeout(500);
    await p.keyboard.press('Meta+Enter'); await p.waitForTimeout(1800);
  });

  // ── Carousel (2:1) ──
  await shot('board', '/project/web-app');
  await shot('list', '/project/web-app/list');
  await shot('dashboard', '/project/web-app/overview');
  await shot('views', '/view/open-bugs');
  await shot('issue', '/project/web-app?issue=NIM-1');
  await shot('palette', '/project/web-app/list', { before: async (p) => { await p.keyboard.press('Meta+k'); await p.waitForTimeout(400); await p.keyboard.type(T.search, { delay: 60 }); await p.waitForTimeout(700); } });
  for (const [n, path] of [['phone-1', '/project/web-app'], ['phone-2', '/issue/NIM-1'], ['phone-3', '/inbox']]) {
    await shot(n, path, { w: 390, h: 844 });
  }
  // ── Docs ──
  await shot('overview', '/dashboard', { w: 1600, h: 900 });
})();
