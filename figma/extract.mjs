// DOM → Figma extractor for pdp.html (Jake, 18 Sep 2026).
// Renders pdp.html headlessly at a given width, drives the prototype into a state (same postMessage the
// configurator uses), then walks the DOM and writes a JSON tree of frames / text / images with exact
// geometry + computed styles. build.mjs turns that JSON into use_figma calls.
//
//   node figma/extract.mjs <width> <stateName> [<stateName>…]     (server on :3010 must be running)
//   → figma/out/<width>/<stateName>.json
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PW || 'playwright');
import { mkdirSync, writeFileSync } from 'node:fs';

const W = +process.argv[2] || 390;
const names = process.argv.slice(3);
const BASE = 'http://localhost:3010/pdp.html';

// The states we export. `set` = pdpSet message; `after` = code run in the page once rendered.
const DEF = { mode:'new', entry:'03-1', stock:'in', ptabs:true, sizerec:true, srecDir:'up', srecIcon:'arrow',
  fmt:{ look:'nodata', hp:'carousel', wtyl:'carousel' }, pricing:'code', setview:'compact', labels:false, edit:false };
export const STATES = {
  'default':      { set:{} },
  'entry-09-3':   { set:{ entry:'09-3' } },
  'entry-none':   { set:{ entry:'none' } },
  'oos':          { set:{ stock:'oos' } },
  'size-oos':     { set:{ stock:'size' }, after:`document.querySelectorAll('#sizebtns .sz.oos,#sizebtns .sz[disabled],#sizebtns .sz.soldout')[0]?.click()` },
  'srec-down':    { set:{ srecDir:'down' } },
  'srec-off':     { set:{ sizerec:false } },
  'tabs-off':     { set:{ ptabs:false } },
  'look-carousel':{ set:{ fmt:{ look:'carousel' } } },
  'look-grid':    { set:{ fmt:{ look:'grid' } } },
  'look-inline':  { set:{ fmt:{ look:'inline' } } },
  'look-hot':     { set:{ fmt:{ look:'hot' } } },
  'look-ms':      { set:{ fmt:{ look:'ms' } } },
  'look-collage': { set:{ fmt:{ look:'collage' } } },
  'look-pairs':   { set:{ fmt:{ look:'pairs' } } },
  'look-off':     { set:{ fmt:{ look:'off' } } },
  'hp-grid':      { set:{ fmt:{ hp:'grid' } } },
  'wtyl-grid':    { set:{ fmt:{ wtyl:'grid' } } },
  'size-selected':{ set:{}, after:`document.querySelectorAll('#sizebtns .sz')[2]?.click()` },
  // overlays — the sheet is what we capture (root = the .sheet)
  'sheet-set':    { set:{}, after:`openSheet('set')`, overlay:'#sheet' },
  'sheet-set-cards':{ set:{ setview:'cards' }, after:`openSheet('set')`, overlay:'#sheet' },
  'sheet-look':   { set:{ fmt:{ look:'hot' } }, after:`openLookModal()`, overlay:'#lookm' },
  'sheet-sizeguide':{ set:{}, after:`openSizeGuide()`, overlay:'#sizeg' },
  'sheet-pairs':  { set:{ fmt:{ look:'pairs' } }, after:`document.querySelector('#slot-buttons .entry')?.click()`, overlay:'#pairsm' },
  'sheet-atb':    { set:{}, after:`document.querySelectorAll('#sizebtns .sz')[2]?.click(); document.querySelector('#atbbtn')?.click()`, overlay:'#atb' },
};

// ---------- in-page walker (serialised into the page) ----------
const WALKER = `(() => {
const px = v => parseFloat(v) || 0;
const col = s => { // "rgb(a)(r, g, b[, a])" → {r,g,b,a} 0-1, or null when transparent
  if (!s || s === 'transparent') return null;
  const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
  const p = m[1].split(',').map(x => parseFloat(x));
  const a = p.length > 3 ? p[3] : 1; if (a === 0) return null;
  return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a };
};
const round = n => Math.round(n * 100) / 100;
const WEIGHT = { 100:'Thin', 200:'ExtraLight', 300:'Light', 400:'Regular', 500:'Medium', 600:'SemiBold', 700:'Bold', 800:'ExtraBold', 900:'Black' };
function fontOf(cs) {
  const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  let w = parseInt(cs.fontWeight) || 400; if (isNaN(w)) w = cs.fontWeight === 'bold' ? 700 : 400;
  let style = WEIGHT[Math.round(w / 100) * 100] || 'Regular';
  if (cs.fontStyle === 'italic') style = style === 'Regular' ? 'Italic' : style + ' Italic';
  return { family: fam, style, size: px(cs.fontSize) };
}
function radii(cs, w, h) {
  const one = (v) => { if (v.endsWith('%')) return Math.min(w, h) * parseFloat(v) / 100; return Math.min(px(v), Math.min(w, h) / 2); };
  return [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(v => round(one(v.split(' ')[0])));
}
function shadow(cs) {
  if (!cs.boxShadow || cs.boxShadow === 'none') return null;
  // split on commas outside parens
  const parts = cs.boxShadow.match(/(?:[^,(]|\\([^)]*\\))+/g) || [];
  return parts.map(p => {
    p = p.trim(); const inset = /inset/.test(p); const c = col(p);
    const nums = p.replace(/rgba?\\([^)]*\\)/, '').replace('inset', '').trim().split(/\\s+/).map(px);
    return { inset, color: c, x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0 };
  }).filter(s => s.color);
}
function gradient(cs) {
  const bi = cs.backgroundImage; if (!bi || !bi.startsWith('linear-gradient')) return null;
  const inner = bi.slice(bi.indexOf('(') + 1, -1);
  const parts = inner.match(/(?:[^,(]|\\([^)]*\\))+/g).map(s => s.trim());
  let angle = 180; if (/deg$/.test(parts[0])) { angle = parseFloat(parts[0]); parts.shift(); } else if (/^to /.test(parts[0])) { const d = parts.shift(); angle = { 'to top':0, 'to bottom':180, 'to right':90, 'to left':270 }[d] ?? 180; }
  const stops = parts.map((p, i) => { const c = col(p) || { r:0,g:0,b:0,a:0 }; const m = p.match(/([\\d.]+)%\\s*$/); return { c, pos: m ? parseFloat(m[1]) / 100 : i / Math.max(1, parts.length - 1) }; });
  return { angle, stops };
}
function isVisible(el, cs) {
  if (el.hidden || cs.display === 'none' || cs.visibility === 'hidden') return false;
  return true;
}
const SKIP = new Set(['SCRIPT','STYLE','TEMPLATE','NOSCRIPT','LINK','META']);
function nameOf(el) { return (el.id ? '#' + el.id + ' ' : '') + el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''); }

// text: gather all descendant text nodes of el (stopping at replaced/ block children which are emitted separately)
function textSegments(el, ox, oy) {
  const segs = []; let box = null;
  const walkT = (n) => {
    if (n.nodeType === 3) {
      const raw = n.textContent; if (!raw.trim()) { if (segs.length && !/\\s$/.test(segs[segs.length-1].chars)) segs[segs.length-1].chars += ' '; return; }
      const pe = n.parentElement; const pcs = getComputedStyle(pe); if (pcs.display === 'none' || pcs.visibility === 'hidden') return;
      const rg = document.createRange(); rg.selectNodeContents(n); const rects = [...rg.getClientRects()].filter(r => r.width > 0 && r.height > 0);
      rects.forEach(r => { box = box ? { l: Math.min(box.l, r.left), t: Math.min(box.t, r.top), r: Math.max(box.r, r.right), b: Math.max(box.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom }; });
      let chars = pcs.whiteSpace.startsWith('pre') ? raw : raw.replace(/\\s+/g, ' ');
      if (pcs.textTransform === 'uppercase') chars = chars.toUpperCase(); else if (pcs.textTransform === 'lowercase') chars = chars.toLowerCase(); else if (pcs.textTransform === 'capitalize') chars = chars.replace(/\\b\\w/g, c => c.toUpperCase());
      const f = fontOf(pcs);
      const lh = pcs.lineHeight === 'normal' ? null : px(pcs.lineHeight);
      const ls = pcs.letterSpacing === 'normal' ? 0 : px(pcs.letterSpacing);
      const deco = /line-through/.test(pcs.textDecorationLine) ? 'STRIKETHROUGH' : /underline/.test(pcs.textDecorationLine) ? 'UNDERLINE' : 'NONE';
      const color = col(pcs.color) || { r:0,g:0,b:0,a:1 };
      const last = segs[segs.length - 1];
      const key = JSON.stringify([f, lh, ls, deco, color]);
      if (last && last.key === key) last.chars += chars; else segs.push({ key, chars, f, lh, ls, deco, color });
      return;
    }
    if (n.nodeType !== 1) return;
    if (SKIP.has(n.tagName) || n.tagName === 'IMG' || n.tagName === 'svg' || n.tagName === 'INPUT' || n.tagName === 'BR') { if (n.tagName === 'BR') { const last = segs[segs.length-1]; if (last) last.chars += '\\n'; } return; }
    const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || n.hidden) return;
    [...n.childNodes].forEach(walkT);
  };
  [...el.childNodes].forEach(walkT);
  if (!segs.length || !box) return null;
  // trim
  segs[0].chars = segs[0].chars.replace(/^\\s+/, ''); segs[segs.length-1].chars = segs[segs.length-1].chars.replace(/\\s+$/, '');
  const clean = segs.filter(s => s.chars.length).map(s => ({ chars: s.chars, f: s.f, lh: s.lh, ls: s.ls, deco: s.deco, color: s.color }));
  if (!clean.length) return null;
  return { segs: clean, box: { x: round(box.l - ox), y: round(box.t - oy), w: round(box.r - box.l), h: round(box.b - box.t) } };
}
// does this element hold text directly or through inline descendants only (no block-level element children)?
function isTextContainer(el) {
  let hasText = false;
  for (const n of el.childNodes) {
    if (n.nodeType === 3 && n.textContent.trim()) hasText = true;
  }
  if (hasText) return true;
  // all element children inline and themselves text containers → treat as one text block
  const kids = [...el.children].filter(k => { const cs = getComputedStyle(k); return cs.display !== 'none' && !k.hidden; });
  if (!kids.length) return false;
  return kids.every(k => { const cs = getComputedStyle(k); return cs.display === 'inline' && !['IMG','svg','INPUT','BUTTON'].includes(k.tagName) && isTextContainer(k); });
}
function inlineMedia(el) { // imgs / svgs nested inside a text container (icon inside a label) — emitted as siblings of the text
  const out = []; el.querySelectorAll('img,svg').forEach(m => out.push(m)); return out;
}
function pseudo(el, which, ox, oy, pr) {
  const cs = getComputedStyle(el, which); if (!cs.content || cs.content === 'none' || cs.display === 'none') return null;
  const w = px(cs.width), h = px(cs.height); if (!(w > 0 && h > 0)) return null;
  const bg = col(cs.backgroundColor); const mask = (cs.maskImage || cs.webkitMaskImage || '').match(/url\\("?([^")]+)"?\\)/);
  const grad = gradient(cs); const bc = col(cs.borderTopColor); const bw = px(cs.borderTopWidth);
  if (!bg && !mask && !grad && !(bw > 0 && bc)) return null;
  // position: absolute inside el → use inset; otherwise approximate to el content box (flex-centred)
  let x, y;
  if (cs.position === 'absolute') { const l = cs.left, t = cs.top, r = cs.right, b = cs.bottom; x = pr.left + (l !== 'auto' ? px(l) : (r !== 'auto' ? pr.width - px(r) - w : (pr.width - w) / 2)); y = pr.top + (t !== 'auto' ? px(t) : (b !== 'auto' ? pr.height - px(b) - h : (pr.height - h) / 2)); if (cs.inset && cs.inset.split(' ').length === 1 && cs.inset !== 'auto') { const i = px(cs.inset); x = pr.left + i; y = pr.top + i; } }
  else { x = pr.left + (pr.width - w) / 2; y = pr.top + (pr.height - h) / 2; }
  if (mask) return { t:'img', n: which, src: new URL(mask[1], location.href).href, fit:'contain', tint: bg, x: round(x - ox), y: round(y - oy), w: round(w), h: round(h), op: +cs.opacity };
  return { t:'f', n: which, x: round(x - ox), y: round(y - oy), w: round(w), h: round(h), bg, grad, rad: radii(cs, w, h), stroke: bw > 0 && bc ? { c: bc, w: bw } : null, op: +cs.opacity, ch: [] };
}
function walk(el, ox, oy, depth) {
  if (SKIP.has(el.tagName)) return null;
  const cs = getComputedStyle(el); if (!isVisible(el, cs)) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 0.5 || r.height < 0.5) { if (cs.overflow !== 'visible' || !el.children.length) return null; }
  const base = { n: nameOf(el), x: round(r.left - ox), y: round(r.top - oy), w: round(r.width), h: round(r.height), op: +cs.opacity };
  let tf = cs.transform !== 'none' ? cs.transform : null; if (tf) { const m = tf.match(/matrix\\(([^)]+)\\)/); if (m) { const a = m[1].split(',').map(parseFloat); if (Math.abs(a[0]-1)<0.001 && Math.abs(a[1])<0.001 && Math.abs(a[2])<0.001 && Math.abs(a[3]-1)<0.001) tf = null; } }
  if (el.tagName === 'IMG') { const src = el.currentSrc || el.src; if (!src) return null; return { t:'img', ...base, src, fit: cs.objectFit || 'fill', rad: radii(cs, r.width, r.height), tf }; }
  if (el.tagName === 'svg') return { t:'svg', ...base, svg: el.outerHTML, tf };
  const node = { t:'f', ...base, ch: [] };
  node.bg = col(cs.backgroundColor); node.grad = gradient(cs);
  const bgu = cs.backgroundImage.match(/url\\("?([^")]+)"?\\)/); if (bgu) node.bgimg = { src: new URL(bgu[1], location.href).href, size: cs.backgroundSize };
  node.rad = radii(cs, r.width, r.height);
  const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px); const bc = col(cs.borderTopColor) || col(cs.borderLeftColor) || col(cs.borderBottomColor) || col(cs.borderRightColor);
  if (bc && bw.some(v => v > 0) && cs.borderTopStyle !== 'none' || (bc && bw.some(v=>v>0) && (cs.borderBottomStyle !== 'none' || cs.borderLeftStyle!=='none'||cs.borderRightStyle!=='none'))) node.stroke = { c: bc, w: bw, dash: /dashed|dotted/.test(cs.borderTopStyle + cs.borderBottomStyle) };
  if (cs.outlineStyle !== 'none' && px(cs.outlineWidth) > 0 && col(cs.outlineColor)) node.outline = { c: col(cs.outlineColor), w: px(cs.outlineWidth), off: px(cs.outlineOffset) };
  node.clip = (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') && cs.overflow !== 'visible' || cs.overflowX === 'hidden' || cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'hidden' || cs.overflowY === 'auto' || cs.overflowY === 'scroll';
  node.shadow = shadow(cs); node.blur = (cs.backdropFilter || cs.webkitBackdropFilter || 'none') !== 'none' ? px((cs.backdropFilter||cs.webkitBackdropFilter).match(/blur\\(([^)]+)\\)/)?.[1] || 0) : 0;
  if (tf) node.tf = tf;
  const pb = pseudo(el, '::before', ox, oy, r); if (pb) node.ch.push(pb);
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const ph = el.value || el.placeholder; if (ph) { const pcs = el.value ? cs : getComputedStyle(el, '::placeholder'); const f = fontOf(cs);
      const padL = px(cs.paddingLeft), padR = px(cs.paddingRight); const lh = cs.lineHeight === 'normal' ? f.size * 1.2 : px(cs.lineHeight);
      node.ch.push({ t:'txt', n:'placeholder', x: round(padL + px(cs.borderLeftWidth)), y: round((r.height - lh) / 2), w: round(r.width - padL - padR), h: round(lh), align: 'LEFT', segs: [{ chars: ph, f, lh, ls: 0, deco:'NONE', color: col(pcs.color) || { r:.46,g:.46,b:.46,a:1 } }] }); }
  } else if (isTextContainer(el)) {
    const ts = textSegments(el, r.left, r.top);
    if (ts) {
      const padL = px(cs.paddingLeft) + px(cs.borderLeftWidth), padR = px(cs.paddingRight) + px(cs.borderRightWidth);
      let align = { left:'LEFT', start:'LEFT', center:'CENTER', right:'RIGHT', end:'RIGHT', justify:'JUSTIFIED' }[cs.textAlign] || 'LEFT'; if (cs.display.includes('flex') && cs.justifyContent === 'center' && !cs.flexDirection.startsWith('column')) align = 'CENTER'; if (cs.display.includes('grid') && (cs.placeItems || '').includes('center')) align = 'CENTER';
      const clamp = (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') ? +cs.webkitLineClamp : (cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap' ? 1 : 0);
      // text box: full content width of the element (so alignment behaves), top from the glyph line boxes
      const cw = r.width - padL - padR; const media = inlineMedia(el);
      let bx = padL, bw2 = cw;
      if (media.length && cs.display.includes('flex')) { // icon + label in a flex row: keep the measured glyph box instead
        bx = ts.box.x; bw2 = ts.box.w + 2; }
      if (align === 'LEFT' && !media.length) { bw2 = Math.max(cw - (ts.box.x - padL), ts.box.w + 1); bx = ts.box.x; }
      node.ch.push({ t:'txt', n:'text', x: round(bx), y: ts.box.y, w: round(bw2), h: ts.box.h, align, clamp, segs: ts.segs, nowrap: cs.whiteSpace === 'nowrap' });
      media.forEach(m => { const mn = walk(m, r.left, r.top, depth + 1); if (mn) node.ch.push(mn); });
    }
  } else {
    for (const k of el.children) { const kn = walk(k, r.left, r.top, depth + 1); if (kn) node.ch.push(kn); }
  }
  const pa = pseudo(el, '::after', ox, oy, r); if (pa) node.ch.push(pa);
  return node;
}
window.__walk2 = (el) => { const r = el.getBoundingClientRect(); const n = walk(el, r.left, r.top, 0); if (n) { n.pageX = round(r.left + scrollX); n.pageY = round(r.top + scrollY); } return n; };
window.__walk = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const n = walk(el, r.left, r.top, 0); if (n) { n.pageX = round(r.left + scrollX); n.pageY = round(r.top + scrollY); } return n; };
window.__rects = (sel) => [...document.querySelectorAll(sel)].map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { sel: nameOf(el), block: el.dataset.block || null, x: round(r.left + scrollX), y: round(r.top + scrollY), w: round(r.width), h: round(r.height), hidden: el.hidden || cs.display === 'none' || r.height < 0.5 }; });
})();`;

// which roots to extract per state — the page is a stack of these
const ROOTS = [
  ['header', 'header.hdr, header, .hdr'],
  ['crumb', 'nav.crumb'],
  ['gallery', '.galwrap'],
  ['buy', '.buy'],
  ['below', '.below'],
  ['footer', 'footer.ft'],
  ['removed', '#removed'],
];

async function main() {
  const browser = await chromium.launch(); console.error('browser up');
  const ctx = await browser.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const name of names) {
    const st = STATES[name]; if (!st) { console.error('unknown state', name); continue; }
    await page.goto(BASE + '?mode=new', { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(BASE + '?mode=new', { waitUntil: 'load', timeout: 30000 });
    console.error('loaded', name);
    const set = { ...DEF, ...st.set, fmt: { ...DEF.fmt, ...(st.set.fmt || {}) } };
    await page.evaluate((s) => { window.postMessage({ pdpSet: 1, ...s }, '*'); }, set);
    await page.waitForTimeout(400);
    if (st.overlay) { await page.setViewportSize({ width: W, height: W < 1024 ? 844 : 900 }); await page.waitForTimeout(150); }
    if (st.after) { await page.evaluate(st.after); await page.waitForTimeout(600); }
    await page.evaluate(() => Promise.race([Promise.all([document.fonts.ready, ...[...document.images].filter(i => !i.complete && i.src).map(i => new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); }))]), new Promise(r => setTimeout(r, 4000))]));
    console.error('assets ready');
    await page.waitForTimeout(200);
    // full-height viewport so nothing lazy stays unrendered and fixed sheets measure against the page
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    if (!st.overlay) await page.setViewportSize({ width: W, height: Math.min(H, 20000) });
    await page.waitForTimeout(200);
    await page.evaluate(WALKER); console.error('walker injected');
    const out = { state: name, width: W, set, roots: {}, blocks: [], pageH: H };
    if (st.overlay) {
      out.roots.overlay = await page.evaluate((sel) => window.__walk(sel), st.overlay);
      out.roots.overlay && (out.roots.overlay.n = st.overlay);
    } else {
      for (const [key, sel] of ROOTS) { const n = await page.evaluate((s) => window.__walk(s), sel); if (n) out.roots[key] = n; }
      out.blocks = await page.evaluate(() => window.__rects('[data-block]'));
      // per-block nodes: header, crumb, gallery, every visible direct child of .buy and .below, footer
      out.blockNodes = await page.evaluate(() => {
        const list = [];
        const add = (key, el) => { const n = window.__walk2(el); if (n) list.push({ key, node: n, x: n.pageX, y: n.pageY, w: n.w, h: n.h }); };
        const one = (key, sel) => { const el = document.querySelector(sel); if (el) add(key, el); };
        one('header', 'header.hdr'); one('crumb', 'nav.crumb'); one('gallery', '.galwrap');
        for (const col of ['buy', 'below']) [...document.querySelector('.' + col).children].forEach(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (el.hidden || cs.display === 'none' || r.height < 0.5) return; const key = el.dataset.block || el.id || el.className.split(' ')[0]; add(col + '/' + key, el); });
        one('footer', 'footer.ft');
        return list;
      });
      out.rootRects = await page.evaluate((rs) => rs.map(([k, s]) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { key: k, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }).filter(Boolean), ROOTS);
    }
    mkdirSync(`figma/out/${W}`, { recursive: true });
    const f = `figma/out/${W}/${name}.json`; writeFileSync(f, JSON.stringify(out));
    console.log(f, JSON.stringify(out).length, 'bytes; pageH', H);
  }
  await browser.close();
}
main();
