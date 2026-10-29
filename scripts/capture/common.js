const { chromium } = require('playwright');
const tok = require('fs').readFileSync(__dirname + '/token', 'utf8').trim();
const UID = process.env.CAPTURE_USER_ID || 'u0d7e2172-d330-4e4a-918d-597f7669f4cd';
exports.BASE = process.env.BARYNT_URL || 'http://localhost:3000';
exports.open = async (opts = {}) => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, colorScheme: 'dark', locale: 'en-US', deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', ...opts });
  await ctx.addCookies([{ name: 'authjs.session-token', value: tok, domain: 'localhost', path: '/' }, { name: 'barynt_seen_release', value: '1.0.12', domain: 'localhost', path: '/' }]);
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' }); } catch {} });
  await ctx.addInitScript((uid) => { try { localStorage.setItem(`barynt:passkeyNudgeDismissed:${uid}`, '1'); } catch {} }, UID);
  return { b, ctx };
};

// A visible cursor for recordings (Playwright videos don't show the real one).
exports.cursorScript = () => {
  const add = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-100px,-100px)', transition: 'scale .12s', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' });
    document.documentElement.appendChild(c);
    addEventListener('pointermove', (e) => { c.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 2}px)`; }, true);
    addEventListener('pointerdown', () => { c.style.scale = '0.85'; }, true);
    addEventListener('pointerup', () => { c.style.scale = '1'; }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', add); else add();
};
// Smooth mouse movement between two points.
exports.glide = async (p, from, to, ms = 600) => {
  const steps = Math.max(10, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await p.mouse.move(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e);
    await p.waitForTimeout(16);
  }
};
// Box of the first visible element whose own text is exactly `text`.
exports.boxOf = (p, text) => p.evaluate((text) => {
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length > 2) continue;
    if ((el.textContent || '').trim() !== text) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top >= 0) return { x: r.x, y: r.y, width: r.width, height: r.height };
  }
  return null;
}, text);
