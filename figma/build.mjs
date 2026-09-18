// JSON → use_figma code chunks (Jake, 18 Sep 2026). Pairs with extract.mjs.
//
//   node figma/build.mjs icons                       → figma/chunks/icons.js   (one COMPONENT per unique SVG icon)
//   node figma/build.mjs frame <json> <path> <name> <x> <y> [--limit 46000]
//        → figma/chunks/<name>-N.js  (chunk 1 creates the frame at x,y on the current page; later chunks need __ROOT__ = its id)
//   node figma/build.mjs variants <width> <blockKey>  → prints the distinct variants of a block across all captured states
//
// The generated code embeds the (compacted) node tree and a small runtime. Icons are referenced by file name and
// instanced from the components created by the icons chunk (ICONS map pasted into each chunk via __ICONS__).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const LIMIT = +opt('--limit', 40000);
mkdirSync('figma/chunks', { recursive: true });

const iconName = src => decodeURIComponent(src.split('/').pop().split('?')[0]);
const isSvg = src => /\.svg(\?|$)/i.test(src);
const localPath = src => decodeURIComponent(new URL(src).pathname.replace(/^\//, ''));

// ---- compaction: drop nulls/defaults, shorten numbers, swap svg src → icon key ----
const hex = c => { if (!c) return null; const h = v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'); return '#' + h(c.r) + h(c.g) + h(c.b) + (c.a != null && c.a < 0.999 ? h(c.a) : ''); };
const r1 = v => Math.round(v * 10) / 10;
function compact(n) {
  const o = { t: n.t };
  if (n.n) o.n = n.n.slice(0, 40);
  for (const k of ['x', 'y', 'w', 'h']) o[k] = r1(n[k]);
  if (n.op != null && n.op !== 1) o.op = n.op;
  if (n.t === 'f') {
    if (n.bg) o.bg = hex(n.bg);
    if (n.grad) o.grad = { a: n.grad.angle, s: n.grad.stops.map(st => [hex(st.c), r1(st.pos)]) };
    if (n.bgimg) o.bgimg = n.bgimg.src.replace(/^https?:\/\/[^/]+\//, '');
    if (n.rad && n.rad.some(r => r)) o.rad = n.rad.every(r => r === n.rad[0]) ? n.rad[0] : n.rad;
    if (n.stroke) { o.sk = [hex(n.stroke.c), Array.isArray(n.stroke.w) && n.stroke.w.every(v => v === n.stroke.w[0]) ? n.stroke.w[0] : n.stroke.w]; if (n.stroke.dash) o.sk.push(1); }
    if (n.outline) o.ol = [hex(n.outline.c), n.outline.w];
    if (n.clip) o.clip = 1;
    if (n.shadow && n.shadow.length) o.sh = n.shadow.map(sd => [hex(sd.color), sd.x, sd.y, sd.blur, sd.spread, sd.inset ? 1 : 0]);
    if (n.blur) o.blur = n.blur;
    if (n.tf) o.tf = n.tf;
    o.ch = (n.ch || []).map(compact);
  } else if (n.t === 'txt') {
    if (n.align && n.align !== 'LEFT') o.al = n.align; if (n.clamp) o.clamp = n.clamp; if (n.nowrap) o.nw = 1;
    o.s = n.segs.map(sg => { const e = { c: sg.chars, f: `${sg.f.family}|${sg.f.style}|${sg.f.size}`, co: hex(sg.color) }; if (sg.lh) e.lh = r1(sg.lh); if (sg.ls) e.ls = r1(sg.ls); if (sg.deco && sg.deco !== 'NONE') e.d = sg.deco; return e; });
  } else if (n.t === 'img') {
    if (isSvg(n.src)) { o.t = 'ico'; o.k = iconName(n.src); if (n.tint) o.tint = hex(n.tint); }
    else { o.src = localPath(n.src); }
    if (n.fit && n.fit !== 'fill') o.fit = n.fit; if (n.rad && n.rad.some(r => r)) o.rad = n.rad.every(r => r === n.rad[0]) ? n.rad[0] : n.rad; if (n.tf) o.tf = n.tf;
  } else if (n.t === 'svg') { o.svg = n.svg; if (n.tf) o.tf = n.tf; }
  return o;
}
const hashOf = n => { const c = compact(n); const strip = o => { const { x, y, ...rest } = o; if (rest.ch) rest.ch = rest.ch.map(strip); return rest; }; return createHash('md5').update(JSON.stringify(strip(c))).digest('hex').slice(0, 10); };

// ---- runtime that runs inside Figma ----
const RUNTIME = String.raw`
const PG=figma.root.children.find(p=>p.name==='__PAGE__')||figma.currentPage;if(PG!==figma.currentPage)await figma.setCurrentPageAsync(PG);
const ICONS=__ICONS__;
const F={};async function font(fs){if(F[fs])return F[fs];const [fam,sty]=fs.split('|');let fn={family:fam,style:sty};try{await figma.loadFontAsync(fn);}catch(e){fn={family:'Inter',style:({Light:'Light',Regular:'Regular',Medium:'Medium',SemiBold:'Semi Bold',Bold:'Bold'})[sty]||'Regular'};await figma.loadFontAsync(fn);}F[fs]=fn;return fn;}
const col=h=>{const n=parseInt(h.slice(1,7),16);return {r:(n>>16&255)/255,g:(n>>8&255)/255,b:(n&255)/255,a:h.length>7?parseInt(h.slice(7,9),16)/255:1};};
const paint=h=>{const c=col(h);return {type:'SOLID',color:{r:c.r,g:c.g,b:c.b},opacity:c.a};};
const GT={0:[[0,-1,1],[1,0,0]],90:[[1,0,0],[0,1,0]],180:[[0,1,0],[-1,0,1]],270:[[-1,0,1],[0,-1,1]]};
const gpaint=g=>({type:'GRADIENT_LINEAR',gradientTransform:GT[Math.round(g.a)%360]||GT[180],gradientStops:g.s.map(st=>({position:st[1],color:col(st[0])}))});
let IMGS=0;const OUT={created:[]};
const rad4=r=>Array.isArray(r)?r:[r,r,r,r];
function rot(node,tf,cx,cy){const m=tf&&tf.match(/matrix\(([^)]+)\)/);if(!m)return;const a=m[1].split(',').map(Number);const ang=Math.atan2(a[1],a[0]);if(Math.abs(ang)<0.01)return;const th=-ang;const c=Math.cos(th),s=Math.sin(th);const w=node.width,h=node.height;node.relativeTransform=[[c,s,cx-(c*w/2+s*h/2)],[-s,c,cy-(-s*w/2+c*h/2)]];}
function decorate(node,n){
 if(n.rad!=null){const r=rad4(n.rad);node.topLeftRadius=r[0];node.topRightRadius=r[1];node.bottomRightRadius=r[2];node.bottomLeftRadius=r[3];}
 if(n.op!=null)node.opacity=n.op;
 const fx=[];
 if(n.sh)for(const s of n.sh){fx.push({type:s[5]?'INNER_SHADOW':'DROP_SHADOW',color:col(s[0]),offset:{x:s[1],y:s[2]},radius:s[3],spread:s[4],visible:true,blendMode:'NORMAL'});}
 if(n.blur)fx.push({type:'BACKGROUND_BLUR',radius:n.blur,visible:true});
 if(fx.length)node.effects=fx;
}
function imgRect(parent,n,src,fit){const r=figma.createRectangle();parent.appendChild(r);r.resize(Math.max(n.w,0.01),Math.max(n.h,0.01));r.x=n.x;r.y=n.y;r.fills=[{type:'SOLID',color:{r:.9,g:.9,b:.9}}];r.name='img: '+src.split('/').pop()+' · '+(fit||'fill');IMGS++;return r;}
async function build(n,parent){
 let node;
 if(n.t==='f'){
  node=figma.createFrame();node.name=n.n||'frame';parent.appendChild(node);
  node.resize(Math.max(n.w,0.01),Math.max(n.h,0.01));node.x=n.x;node.y=n.y;
  const fills=[];if(n.bg)fills.push(paint(n.bg));if(n.grad)fills.push(gpaint(n.grad));node.fills=fills;
  node.clipsContent=!!n.clip;
  if(n.sk){node.strokes=[paint(n.sk[0])];node.strokeAlign='INSIDE';const w=n.sk[1];if(Array.isArray(w)){node.strokeTopWeight=w[0];node.strokeRightWeight=w[1];node.strokeBottomWeight=w[2];node.strokeLeftWeight=w[3];}else node.strokeWeight=w;if(n.sk[2])node.dashPattern=[4,4];}
  if(n.ol){node.strokes=[paint(n.ol[0])];node.strokeAlign='OUTSIDE';node.strokeWeight=n.ol[1];}
  decorate(node,n);
  if(n.bgimg){const r=imgRect(node,{x:0,y:0,w:node.width,h:node.height},n.bgimg,'cover');}
  for(const c of n.ch)await build(c,node);
  if(n.tf)rot(node,n.tf,n.x+n.w/2,n.y+n.h/2);
 }else if(n.t==='txt'){
  node=figma.createText();parent.appendChild(node);node.name=n.s.map(s=>s.c).join('').slice(0,40)||'text';
  const fns=[];for(const s of n.s)fns.push(await font(s.f));
  node.fontName=fns[0];node.characters=n.s.map(s=>s.c).join('');
  let i=0;n.s.forEach((s,j)=>{const e=i+s.c.length;if(e>i){node.setRangeFontName(i,e,fns[j]);node.setRangeFontSize(i,e,+s.f.split('|')[2]);node.setRangeFills(i,e,[paint(s.co)]);node.setRangeLineHeight(i,e,s.lh?{value:s.lh,unit:'PIXELS'}:{unit:'AUTO'});node.setRangeLetterSpacing(i,e,{value:s.ls||0,unit:'PIXELS'});if(s.d)node.setRangeTextDecoration(i,e,s.d);}i=e;});
  node.textAlignHorizontal=n.al||'LEFT';
  const lh=n.s[0].lh;let y=n.y;if(lh){const lines=Math.max(1,Math.round(n.h/lh));y=n.y-(lines*lh-n.h)/2;}
  if(n.clamp){node.textAutoResize='NONE';node.resize(Math.max(n.w,1),Math.max(n.h,1));node.textTruncation='ENDING';node.maxLines=n.clamp;}
  else if(n.nw){node.textAutoResize='WIDTH_AND_HEIGHT';}
  else{node.resize(Math.max(n.w,1),Math.max(n.h,1));node.textAutoResize='HEIGHT';}
  node.x=n.x;node.y=y;
  if(n.nw){if(n.al==='CENTER')node.x=n.x+(n.w-node.width)/2;else if(n.al==='RIGHT')node.x=n.x+n.w-node.width;}
 }else if(n.t==='ico'){
  const comp=ICONS[n.k];
  if(comp){const c=await figma.getNodeByIdAsync(comp);node=c.createInstance();parent.appendChild(node);}
  else{node=figma.createRectangle();parent.appendChild(node);node.fills=[{type:'SOLID',color:{r:.8,g:.8,b:.8}}];node.name='missing icon '+n.k;}
  const sw=node.width,sh=node.height;let w=n.w,h=n.h;const fit=n.fit||'fill';
  if(fit==='contain'||fit==='scale-down'||fit==='none'){const sc=fit==='none'?1:Math.min(n.w/sw,n.h/sh);w=sw*sc;h=sh*sc;}
  node.resize(Math.max(w,0.01),Math.max(h,0.01));node.x=n.x+(n.w-w)/2;node.y=n.y+(n.h-h)/2;
  if(n.tint&&comp){node.findAll(v=>'fills' in v&&v.type!=='INSTANCE').forEach(v=>{try{v.fills=[paint(n.tint)];}catch(e){}});}
  if(n.op!=null)node.opacity=n.op;
  if(n.tf)rot(node,n.tf,n.x+n.w/2,n.y+n.h/2);
 }else if(n.t==='img'){
  node=imgRect(parent,n,n.src,n.fit);decorate(node,n);
  if(n.tf)rot(node,n.tf,n.x+n.w/2,n.y+n.h/2);
 }else if(n.t==='svg'){
  node=figma.createNodeFromSvg(n.svg);parent.appendChild(node);node.resize(Math.max(n.w,0.01),Math.max(n.h,0.01));node.x=n.x;node.y=n.y;
 }
 return node;
}
`;

function frameChunks(tree, name, x, y) {
  // Chunk 1: the root with as many children as fit. Later chunks append remaining children by index path.
  const root = compact(tree); root.n = name;
  const chunks = []; let pending = [];
  const size = o => JSON.stringify(o).length;
  const budget = LIMIT - RUNTIME.length - 1200;
  // split root children so each chunk's payload ≤ budget; a child bigger than the budget is split recursively (its shell first)
  function pack(children, path) {
    let cur = [], curSize = 0;
    const flush = () => { if (cur.length) { pending.push({ path, ch: cur }); cur = []; curSize = 0; } };
    for (const c of children) {
      const s = size(c);
      if (s > budget) { flush(); const shell = { ...c, ch: [] }; pending.push({ path, ch: [shell], shellIndexPath: true }); const idx = pending.length - 1; pack(c.ch, [...path, '__idx__' + idx]); continue; }
      if (curSize + s > budget) flush();
      cur.push(c); curSize += s;
    }
    flush();
  }
  const rootShell = { ...root, ch: [] };
  pack(root.ch, []);
  // resolve __idx__ markers into concrete child indices: index within parent = count of children appended before it
  // Simpler: we track for each pending entry the running child count of its parent path.
  const counts = new Map(); const pathKey = p => p.join('/');
  const resolved = [];
  const idxOf = new Map();
  pending.forEach((p, i) => {
    const key = pathKey(p.path.map(seg => seg.startsWith('__idx__') ? idxOf.get(+seg.slice(7)) : seg));
    const start = counts.get(key) || 0;
    resolved.push({ path: p.path.map(seg => seg.startsWith('__idx__') ? idxOf.get(+seg.slice(7)) : seg), ch: p.ch, start });
    if (p.shellIndexPath) idxOf.set(i, start);
    counts.set(key, start + p.ch.length);
  });
  // emit bodies; body 1 creates the root (found again by name in later bodies — names are unique per page)
  const nm = JSON.stringify(name);
  const bodies = [];
  let first = true;
  for (const r of resolved) {
    const head = first ? `{const ROOT=await build(${JSON.stringify(rootShell)},PG);ROOT.x=${x};ROOT.y=${y};OUT.created.push(ROOT.id);` : `{const ROOT=PG.children.find(n=>n.name===${nm});`;
    const parentExpr = r.path.length ? `(()=>{let p=ROOT;for(const i of ${JSON.stringify(r.path)})p=p.children[i];return p;})()` : 'ROOT';
    bodies.push({ code: head + `const P=${parentExpr};for(const c of ${JSON.stringify(r.ch)})await build(c,P);}`, first, frame: name });
    first = false;
  }
  if (!bodies.length) bodies.push({ code: `{const ROOT=await build(${JSON.stringify(rootShell)},PG);ROOT.x=${x};ROOT.y=${y};OUT.created.push(ROOT.id);}`, first: true, frame: name });
  return bodies;
}
// pack many bodies (possibly from several frames) into as few calls as possible; bodies of one frame stay in order
function packCalls(bodies, prefix) {
  const calls = []; let cur = '', frames = [];
  const flush = () => { if (cur) { calls.push({ code: prefix + cur + `OUT.frames=${JSON.stringify([...new Set(frames)])};OUT.imgs=IMGS;return OUT;`, frames: [...new Set(frames)] }); cur = ''; frames = []; } };
  for (const b of bodies) { if (cur && cur.length + b.code.length > LIMIT - prefix.length - 200) flush(); cur += b.code; frames.push(b.frame); }
  flush(); return calls;
}

function getPath(obj, path) { return path.split('.').filter(Boolean).reduce((o, k) => (o == null ? o : o[k]), obj); }

if (cmd === 'icons') {
  const files = []; for (const w of readdirSync('figma/out')) for (const f of readdirSync(`figma/out/${w}`)) files.push(`figma/out/${w}/${f}`);
  const seen = new Map();
  const visit = n => { if (!n) return; if (n.t === 'img' && isSvg(n.src)) { const k = iconName(n.src); if (!seen.has(k)) seen.set(k, localPath(n.src)); } (n.ch || []).forEach(visit); };
  for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')); Object.values(d.roots || {}).forEach(visit); (d.blockNodes || []).forEach(b => visit(b.node)); }
  const icons = [...seen.entries()].filter(([, p]) => existsSync(p)).map(([k, p]) => ({ k, svg: readFileSync(p, 'utf8').replace(/preserveAspectRatio="none"/g, '').replace(/<\?xml[^>]*>/, '').replace(/\s+/g, ' ') }));
  const missing = [...seen.entries()].filter(([, p]) => !existsSync(p)).map(([k]) => k);
  // one component per icon, laid out in a row in a section named ICONS
  let code = `const PG=figma.root.children.find(p=>p.name==='Icons')||figma.currentPage;if(PG!==figma.currentPage)await figma.setCurrentPageAsync(PG);const sec=figma.createSection();sec.name='ICONS';PG.appendChild(sec);sec.x=-2000;sec.y=0;let x=40;const out={};`;
  code += `const items=${JSON.stringify(icons)};for(const it of items){const s=figma.createNodeFromSvg(it.svg);const c=figma.createComponent();c.name='icon/'+it.k.replace(/\\.svg$/,'');c.resize(Math.max(s.width,1),Math.max(s.height,1));c.appendChild(s);s.x=0;s.y=0;s.children.forEach(ch=>{try{ch.constraints={horizontal:'SCALE',vertical:'SCALE'};}catch(e){}});sec.appendChild(c);c.x=x;c.y=40;x+=Math.ceil(c.width)+40;out[it.k]=c.id;}sec.resizeWithoutConstraints(x+40,200);return out;`;
  writeFileSync('figma/chunks/icons.js', code);
  writeFileSync('figma/chunks/icons-list.json', JSON.stringify([...seen.entries()].filter(([, p]) => existsSync(p)).map(([k, p]) => ({ k, p }))));
  console.log('icons', icons.length, 'missing', missing, 'chars', code.length);
} else if (cmd === 'frame') {
  const [, json, path, name, x, y] = args; const pageName = opt('--page', 'Components — Mobile');
  const d = JSON.parse(readFileSync(json, 'utf8'));
  const tree = getPath(d, path); if (!tree) { console.error('no node at', path); process.exit(1); }
  const icons = existsSync('figma/chunks/icons.json') ? readFileSync('figma/chunks/icons.json', 'utf8') : '{}';
  const chunks = packCalls(frameChunks(tree, name, +x || 0, +y || 0), RUNTIME.replace('__ICONS__', icons).replace('__PAGE__', pageName)).map(c => c.code);
  chunks.forEach((c, i) => writeFileSync(`figma/chunks/${name}-${i + 1}.js`, c));
  console.log(name, chunks.length, 'chunks', chunks.map(c => c.length).join(','));
} else if (cmd === 'variants') {
  const [, width, key] = args;
  const dir = `figma/out/${width}`; const rows = [];
  for (const f of readdirSync(dir)) { const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); const b = (d.blockNodes || []).find(b => b.key === key); if (b && b.node) rows.push({ state: d.state, hash: hashOf(b.node), h: b.node.h, size: JSON.stringify(compact(b.node)).length }); }
  const groups = {}; rows.forEach(r => { (groups[r.hash] = groups[r.hash] || { states: [], h: r.h, size: r.size }).states.push(r.state); });
  console.log(JSON.stringify(groups, null, 1));
} else if (cmd === 'hash') {
  const [, json, path] = args; const d = JSON.parse(readFileSync(json, 'utf8')); console.log(hashOf(getPath(d, path)));
}

// ================= plan / componentise / screens =================
const LABEL = { header:'Header', crumb:'Breadcrumb', gallery:'Gallery', 'buy/ptabs':'Product tabs', 'buy/title':'Title & wishlist', 'buy/price':'Price', 'buy/ndd':'Delivery promise', 'buy/fit':'Body Fit', 'buy/size':'Size', 'buy/sizerec':'Size recommender', 'buy/model':'Model info', 'buy/colour':'Colour', 'buy/buy':'Buy buttons', 'buy/entry':'Set entry point', 'buy/premier':'Premier', 'buy/slot-buttons':'Pairs well with', 'buy/deliver-d':'Deliver+', 'buy/uspbox-d':'Delivery & returns', 'buy/student-d':'Student', 'buy/bnpl-d':'BNPL', 'below/deliver':'Deliver+', 'below/look':'Shop The Look', 'below/uspbox':'Delivery & returns', 'below/student':'Student', 'below/bnpl':'BNPL', 'below/similar':'Shop Similar Items', 'below/hp':'Handpicked For You', 'below/desc':'Description', 'below/wtyl':"We Think You'll Like", 'below/reclinks':'Recommendations', footer:'Footer' };
const VNAME = { // block → state → variant name (states not listed fall back to 'Default')
  'buy/size': { default:'In stock', oos:'Out of stock', 'size-oos':'Some sizes out of stock', 'size-selected':'Size selected' },
  'buy/sizerec': { default:'Up (fits small)', 'srec-down':'Down (fits large)' },
  'buy/buy': { default:'Add to bag', oos:'Notify me' },
  'buy/entry': { default:'03-1 Made To Match', 'entry-09-3':'09-3 Same-colour carousel' },
  'below/look': { default:'Grey background', 'look-carousel':'Carousel', 'look-grid':'Grid', 'look-inline':'Inline band', 'look-hot':'Hotspot imagery', 'look-ms':'Outfit list', 'look-collage':'Flat-lay collage' },
  'below/hp': { default:'Carousel', 'hp-grid':'Grid' }, 'below/wtyl': { default:'Carousel', 'wtyl-grid':'Grid' },
};
const SINGLE = new Set(['header', 'buy/ndd']); // differ only by the live countdown → one variant, taken from the default state
const OVERLAY_LABEL = { 'sheet-set':'Shop The Set — compact', 'sheet-set-cards':'Shop The Set — cards', 'sheet-look':'Complete The Look', 'sheet-sizeguide':'Size Guide', 'sheet-pairs':'Pairs well with', 'sheet-atb':'Added to Bag' };

function loadStates(width) {
  const dir = `figma/out/${width}`; const states = {};
  for (const f of readdirSync(dir)) { const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); states[d.state] = d; }
  return states;
}
function plan(width) {
  const skip = new Set(existsSync(`figma/chunks/${width}/done.json`) ? JSON.parse(readFileSync(`figma/chunks/${width}/done.json`, 'utf8')) : []);
  const states = loadStates(width); const pageName = width < 1024 ? 'Components — Mobile' : 'Components — Desktop';
  const blocks = {}; // key → { label, variants: { name → { node, states } } }
  const order = []; // block keys in page order (from default)
  const stateBlocks = {}; // state → [{key, variant, x, y, w, h}]
  const defaultHashes = {};
  const sig = n => hashOf(n);
  for (const [sname, d] of Object.entries(states)) {
    if (!d.blockNodes) continue;
    stateBlocks[sname] = [];
    for (const b of d.blockNodes) {
      const key = b.key; const label = LABEL[key] || key;
      if (!blocks[key]) { blocks[key] = { label, variants: {} }; order.push(key); }
      const h = sig(b.node);
      let vname;
      if (SINGLE.has(key)) vname = 'Default';
      else { const vn = VNAME[key] || {}; vname = vn[sname] || (h === defaultHashes[key] ? (vn.default || 'Default') : (sname === 'default' ? (vn.default || 'Default') : null)); }
      if (sname === 'default') defaultHashes[key] = h;
      stateBlocks[sname].push({ key, label, h, vnameHint: vname, x: b.x, y: b.y, w: b.w, h_: b.h });
    }
  }
  // second pass: assign variant names by hash — default state's hash = default name; others per VNAME of the first state that shows it
  for (const key of order) {
    const vn = VNAME[key] || {}; const byHash = {};
    for (const [sname, list] of Object.entries(stateBlocks)) for (const e of list) if (e.key === key) {
      const h = SINGLE.has(key) ? 'single' : e.h;
      if (!byHash[h]) byHash[h] = { states: [], node: states[sname].blockNodes.find(b => b.key === key).node, name: null };
      byHash[h].states.push(sname);
    }
    for (const [h, v] of Object.entries(byHash)) {
      v.name = v.states.includes('default') ? (vn.default || 'Default') : (vn[v.states[0]] || (Object.keys(byHash).length === 1 ? 'Default' : v.states[0]));
      blocks[key].variants[v.name] = { node: v.node, states: v.states, hash: h };
    }
    for (const list of Object.values(stateBlocks)) for (const e of list) if (e.key === key) { const h = SINGLE.has(key) ? 'single' : e.h; e.variant = byHash[h].name; }
  }
  // layout on the components page: one column per block, variants stacked
  let x = 0, ox = 0; const chunksIndex = []; const compBodies = [], ovBodies = [];
  const icons = existsSync('figma/chunks/icons.json') ? readFileSync('figma/chunks/icons.json', 'utf8') : '{}';
  mkdirSync(`figma/chunks/${width}`, { recursive: true });
  for (const key of order) {
    const b = blocks[key]; let y = 0; let colW = 0;
    for (const [vname, v] of Object.entries(b.variants)) {
      const frameName = `${b.label}//${vname}`;
      const bodies = skip.has(frameName) ? [] : frameChunks(v.node, frameName, x, y); compBodies.push(...bodies);
      chunksIndex.push({ key, label: b.label, variant: vname, states: v.states, frameName, bodies: bodies.length, chars: bodies.reduce((a, b) => a + b.code.length, 0), w: v.node.w, h: v.node.h });
      y += Math.ceil(v.node.h) + 120; colW = Math.max(colW, v.node.w);
    }
    x += Math.ceil(colW) + 160;
  }
  // overlays
  for (const [sname, d] of Object.entries(states)) {
    const o = d.roots && d.roots.overlay; if (!o) continue;
    const frameName = `${OVERLAY_LABEL[sname] || sname}//${width < 1024 ? 'Mobile' : 'Desktop'}`;
    const bodies = skip.has(frameName) ? [] : frameChunks(o, frameName, ox, width < 1024 ? 0 : 1200); ovBodies.push(...bodies); ox += Math.ceil(o.w) + 160;
    chunksIndex.push({ key: 'overlay/' + sname, label: OVERLAY_LABEL[sname] || sname, variant: width < 1024 ? 'Mobile' : 'Desktop', states: [sname], frameName, bodies: bodies.length, chars: bodies.reduce((a, b) => a + b.code.length, 0), w: o.w, h: o.h, overlay: true });
    x += Math.ceil(o.w) + 160;
  }
  const compCalls = packCalls(compBodies, RUNTIME.replace('__ICONS__', icons).replace('__PAGE__', pageName));
  const ovCalls = packCalls(ovBodies, RUNTIME.replace('__ICONS__', icons).replace('__PAGE__', 'Overlays'));
  const files = [];
  compCalls.forEach((c, i) => { const f = `figma/chunks/${width}/components-${String(i + 1).padStart(2, '0')}.js`; writeFileSync(f, c.code); files.push({ f, chars: c.code.length, frames: c.frames }); });
  ovCalls.forEach((c, i) => { const f = `figma/chunks/${width}/overlays-${String(i + 1).padStart(2, '0')}.js`; writeFileSync(f, c.code); files.push({ f, chars: c.code.length, frames: c.frames }); });
  const manifest = { width, pageName, files, chunks: chunksIndex, screens: Object.fromEntries(Object.entries(stateBlocks).map(([s, list]) => [s, { pageH: states[s].pageH, blocks: list.map(e => ({ label: e.label, variant: e.variant, x: e.x, y: e.y, w: e.w, h: e.h_ })) }])) };
  writeFileSync(`figma/chunks/${width}/manifest.json`, JSON.stringify(manifest, null, 1));
  return manifest;
}
if (cmd === 'plan') {
  const m = plan(+args[1]);
  for (const c of m.chunks) console.log(`${c.frameName.padEnd(52)} ${c.bodies} body(ies) ${c.chars} chars  states=${c.states.length}`);
  for (const f of m.files) console.log(f.f, f.chars, '→', f.frames.join(' | '));
  console.log('TOTAL chars', m.files.reduce((a, f) => a + f.chars, 0), 'calls', m.files.length);
}
if (cmd === 'componentise') { // one call: turn every "<Label>//<Variant>" frame on a page into components / variant sets
  const pageName = args[1];
  console.log(`const PG=figma.root.children.find(p=>p.name==='${pageName}');await figma.setCurrentPageAsync(PG);
const groups={};for(const f of PG.children){if(f.type!=='FRAME'||!f.name.includes('//'))continue;const [label,variant]=f.name.split('//');(groups[label]=groups[label]||[]).push({f,variant});}
const out=[];for(const [label,items] of Object.entries(groups)){
 if(items.length===1&&items[0].variant==='Default'){const c=figma.createComponentFromNode(items[0].f);c.name=label;out.push({label,id:c.id,single:true});continue;}
 const comps=items.map(it=>{const c=figma.createComponentFromNode(it.f);c.name='State='+it.variant;return c;});
 const x=Math.min(...comps.map(c=>c.x)),y=Math.min(...comps.map(c=>c.y));
 const set=figma.combineAsVariants(comps,PG);set.name=label;set.layoutMode='VERTICAL';set.itemSpacing=40;set.paddingTop=set.paddingBottom=set.paddingLeft=set.paddingRight=40;set.primaryAxisSizingMode='AUTO';set.counterAxisSizingMode='AUTO';set.x=x;set.y=y;
 out.push({label,id:set.id,variants:comps.length});}
return out;`);
}
if (cmd === 'screens') { // per state: a page-tall frame with instances of the block components at the captured positions
  const width = +args[1]; const only = args[2] ? args[2].split(',') : null;
  const m = JSON.parse(readFileSync(`figma/chunks/${width}/manifest.json`, 'utf8'));
  const screensPage = width < 1024 ? 'Screens — Mobile' : 'Screens — Desktop';
  const entries = Object.entries(m.screens).filter(([s]) => !only || only.includes(s));
  const code = `const PG=figma.root.children.find(p=>p.name==='${screensPage}');await figma.setCurrentPageAsync(PG);
const CP=figma.root.children.find(p=>p.name==='${m.pageName}');await CP.loadAsync();
const comps={};for(const n of CP.children){if(n.type==='COMPONENT_SET'){for(const v of n.children)comps[n.name+'//'+v.name.replace('State=','')]=v;}else if(n.type==='COMPONENT')comps[n.name+'//Default']=n;}
const SC=${JSON.stringify(entries.map(([s, v]) => ({ s, pageH: v.pageH, blocks: v.blocks })))};
let x=${opt('--x', 0)};const out=[];const missing=[];
for(const sc of SC){const f=figma.createFrame();f.name='PDP · ${width < 1024 ? 'Mobile 390' : 'Desktop 1440'} · '+sc.s;f.resize(${width},Math.ceil(sc.pageH));f.x=x;f.y=${opt('--y', 0)};f.fills=[{type:'SOLID',color:{r:1,g:1,b:1}}];f.clipsContent=true;PG.appendChild(f);
 for(const b of sc.blocks){const c=comps[b.label+'//'+b.variant]||comps[b.label+'//Default'];if(!c){missing.push(sc.s+': '+b.label+'//'+b.variant);continue;}const i=c.createInstance();f.appendChild(i);i.x=b.x;i.y=b.y;}
 out.push({state:sc.s,id:f.id});x+=${width}+120;}
return {out,missing};`;
  const f = `figma/chunks/${width}/screens${only ? '-' + only.join('_') : ''}.js`; writeFileSync(f, code); console.log(f, code.length);
}
