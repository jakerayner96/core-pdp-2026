/* DG Group Design System — Product carousel behaviour (.pcar, 28 Oct 2026, projects/product-carousel).
   Load after components.css. Every .pcar on the page is wired on load, and any .pcar injected later is wired automatically (DG_pcar(root) to force it).
   - Arrows (desktop): page by the cards in view minus one (2 Nov 2026, Jake: the last card stays on screen so nobody loses their place), hidden (disabled) at each end, centred on the card image.
   - Mobile / touch: free scroll, no snap (Spotify-style), set in the CSS.
   - Tabs (.pcar-tabs .chip): single select; fires a 'pcar:tab' event on the .pcar with detail {index, label} so the page swaps the feed.
   - Grid format (.pcar--grid) has no arrows.
   - Swatch taps on rail cards (select + swap the image) · DG_lookPicker (Create the Look picker) — see below. */
(function(){
  function wire(c){
    if(c.__pcar)return;c.__pcar=1;
    const track=c.querySelector('.pcar-track'),prev=c.querySelector('.pcar-arr--prev'),next=c.querySelector('.pcar-arr--next');
    c.querySelectorAll('.pcar-tabs .chip').forEach((b,i,all)=>b.addEventListener('click',()=>{
      all.forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});
      if(track)track.scrollTo({left:0,behavior:'auto'});
      c.dispatchEvent(new CustomEvent('pcar:tab',{bubbles:true,detail:{index:i,label:b.textContent.trim()}}));
    }));
    if(!track||c.classList.contains('pcar--grid'))return;
    const step=()=>{const k=track.children[0];if(!k)return track.clientWidth;const gap=parseFloat(getComputedStyle(track).columnGap)||0,w=k.getBoundingClientRect().width+gap;
      return Math.max(1,Math.floor((track.clientWidth+gap)/w)-1)*w};
    const sync=()=>{const max=track.scrollWidth-track.clientWidth-2;
      if(prev)prev.disabled=track.scrollLeft<=2;if(next)next.disabled=track.scrollLeft>=max;
      const img=track.querySelector('.pc-img');if(img)c.style.setProperty('--pcar-arr-y',(img.offsetTop+img.offsetHeight/2)+'px')};
    if(prev){prev.setAttribute('aria-label','Previous');prev.addEventListener('click',()=>track.scrollBy({left:-step(),behavior:'smooth'}))}
    if(next){next.setAttribute('aria-label','Next');next.addEventListener('click',()=>track.scrollBy({left:step(),behavior:'smooth'}))}
    track.addEventListener('scroll',sync,{passive:true});
    if(window.ResizeObserver)new ResizeObserver(sync).observe(track);else addEventListener('resize',sync);
    track.querySelectorAll('img').forEach(i=>i.complete||i.addEventListener('load',sync,{once:true}));
    sync();
  }
  window.DG_pcar=function(root){(root||document).querySelectorAll('.pcar').forEach(wire)};
  /* DG_pcarHTML(o) — the markup (catalogue entry 'product-carousel') for a placement, so pages never hand-build a rail (2 Nov 2026, Master prototype).
     o: size 'lg'|'md'|'sm' · title · sub · tabs[] · all (View all label — off by default, Jake 2 Nov) · per (cards in view / grid columns, desktop) · grid · look (image only)
        · bleed (mobile edge to edge) · full (to the page margin, fixed 248px desktop cards) · arrows:false (no chevrons) · id (data-pl) · brand (fallback brand line)
        · fixed (--pcar-card on desktop too) · compact (the DS .pc--compact card, 12px copy) · card (mobile card width px, default 165) · qa (the DS circle quick add, top right of the image — square on boohooMAN / KM / Brand Room; data-qa = item.i, tick once item.added —
          Complete the Look in the mini bag; the page decides what a tap adds)
        · info (9 Nov 2026, how much a card says — Jake's Figma review variants 13939:19737 … 13939:26225): 'full' (default — the card format below) · 'noswatch'
          (brand + name) · 'clean' (name only) · 'inline' (**Brand** - Name, one 2-line run) · 'inline2' (**Brand** Name) · 'price' (price only). Sponsored stays on every level.
          swatches:true / false overrides the level's swatches · qaShape:'square' = the square quick add on any fascia
        · tall (min-height 250 so brand + name always fit — Jake 11 Nov, Figma 13943:31066) · inlineSize (items with sizes[] get "Select size ⌄" under the price — "Size: 10 ⌄" once chosen,
          a native select — data-qsz = item.i; item.size = the chosen one) · item.noQa drops the quick add on that card (a multi-variant product when quick add goes straight to the bag)
        · aiLang (AI strip copy, assets/ds/ai-strip.js: en fr nl pl de sv) · aiFit (17 Nov 2026 — what an AI card does when the slot is narrower than --ai-card-min 144px,
          the narrowest card the longest strip copy fits): 'swap' (that card shows item.real, the product's own non-AI shot, with no strip) · 'widen' (every card in the
          placement is at least 144px: rails keep their card width or grow to 144, the grid drops columns — 2 across on mobile) · unset = the strip squeezes (today)
        items[]: {img, brand, name, price, was, pct, sponsored, swatches:[{c, name, img}], href, i, ai (img is AI generated: the strip + alt suffix), real (non-AI shot for aiFit 'swap')}
     Card (DG_pcarCard) = the DS product card format, always: (Sponsored) · brand (never blank — the item's, else o.brand) · name, 2 lines · rail price
     now · was · -X% · colour swatches (buttons: a tap selects the colour and swaps the image to its shot, data-img). No wishlist on rail cards. */
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const swatches=(p,o)=>{const L=p.swatches||[];if(L.length<2)return'';const show=L.slice(0,4);
    return `<div class="pc-swatches${o.round?' pc-swatches--round':''}"><span class="set">${show.map((w,j)=>`<button type="button" class="pc-swatch${j?'':' on'}" data-sw="${j}" data-c="${esc(w.c)}" data-img="${esc(w.img||'')}" aria-label="${esc(w.name||w.c)}" aria-pressed="${!j}"><i style="background:${esc(w.c)}"></i></button>`).join('')}</span>${L.length>4?`<span class="pc-more">+${L.length-4}</span>`:''}</div>`};
  window.DG_pcarInfo=function(p,o){o=o||{};const pct=p.was&&p.pct?String(p.pct).replace(/[^0-9]/g,''):'',lv=o.info||'full',br=lv==='full'||lv==='noswatch',inl=lv==='inline'||lv==='inline2',swOn=o.swatches!=null?!!o.swatches:lv==='full';
    const bn=esc(p.brand||o.brand||''),nm=inl?`<div class="pc-name pc-name--in">${bn?`<b>${bn}</b>${lv==='inline'?' - ':' '}`:''}${esc(p.name)}</div>`:`<div class="pc-name">${esc(p.name)}</div>`;
    return `<div class="pc-info${lv==='full'?'':' pc-info--'+lv}">${p.sponsored?'<div class="pc-sponsored">Sponsored</div>':''}${lv==='price'?'':`<div class="pc-toprow"><div class="pc-titles">${br?`<div class="pc-brand">${bn}</div>`:''}${nm}</div></div>`}
      <div class="price-blk price-blk--rail"><div class="price"><span class="now${p.was?' sale':''}">${esc(p.price)}</span>${p.was?`<span class="was">${esc(p.was)}</span>`:''}${pct?`<span class="save" data-pct="${pct}"></span>`:''}</div></div>${swOn?swatches(p,o):''}${o.inlineSize&&p.sizes&&p.sizes.length?`<label class="pc-size${p.size?' on':''}"><span>${esc(p.opt||'Size')}:</span><span class="v">${p.size?esc(p.size):'Select '+esc((p.opt||'Size').toLowerCase())}</span><i aria-hidden="true"></i><select data-qsz="${esc(p.i)}" aria-label="${esc(p.opt||'Size')} for ${esc(p.name)}"><option value="">Select ${esc((p.opt||'size').toLowerCase())}</option>${p.sizes.map(z=>`<option${z===p.size?' selected':''}>${esc(z)}</option>`).join('')}</select></label>`:''}</div>`};
  window.DG_pcarCard=function(p,o){o=o||{};const at=`${p.href?` data-href="${esc(p.href)}"`:''}${p.i!=null?` data-i="${esc(p.i)}"`:''}`;
    const sq=o.qaShape==='square'||(o.qaShape!=='round'&&['boohooman','karenmillen','brandroom'].includes(document.documentElement.dataset.brand))?' pc-iconbtn--sq':'';
    const qa=o.qa&&!p.noQa?`<div class="pc-actions pc-actions--qa"><button type="button" class="pc-iconbtn${sq}${p.added?' on':''}${p.pop?' pop':''}" data-qa="${esc(p.i)}" aria-label="${p.added?'Added':'Quick add'} ${esc(p.name)}"${p.added?' disabled':''}><img src="assets/ds/icons/${p.added?'lib/icons-tick':'quick-add-16'}.svg" alt=""></button></div>`:'';
    const alt0=((p.brand||o.brand)?(p.brand||o.brand)+' ':'')+p.name,L=o.aiLang||'en',ai=!!p.ai;
    const aiAlt=ai?' · '+(window.DG_aiAlt?DG_aiAlt(L):'AI generated image'):'';
    const img=`<div class="pc-img"><img class="ph" src="${esc(p.img)}" alt="${esc(alt0+aiAlt)}" loading="${o.eager?'eager':'lazy'}">${ai&&p.real?`<img class="ph ph--real" src="${esc(p.real)}" alt="${esc(alt0)}" loading="lazy">`:''}${ai?(window.DG_aiStrip?DG_aiStrip(L):'<span class="badge-ai"><b>AI</b> Generated</span>'):''}${qa}</div>`;
    const cls=ai?' pc--ai'+(p.real?' pc--ai-real':''):'';
    if(o.look)return `<article class="pc${cls}"${at}>${img}</article>`;
    return `<article class="pc${o.compact?' pc--compact':''}${o.tall?' pc--tall':''}${cls}"${at}>${img}${DG_pcarInfo(p,o)}</article>`};
  window.DG_pcarHTML=function(o){o=o||{};const grid=!!o.grid,tabs=o.tabs&&o.tabs.length?o.tabs:null,hd=o.title||o.sub||tabs||o.all;
    const cls=['pcar','pcar--'+(o.size||'md'),grid&&'pcar--grid',o.look&&'pcar--look',o.full&&'pcar--full',o.fixed&&'pcar--fixed',o.arrows===false&&'pcar--no-arr',o.bleed!==false&&'pcar--bleed',(o.items||[]).some(p=>p.ai)&&'has-ai',o.aiFit&&'pcar--ai-'+o.aiFit].filter(Boolean).join(' ');
    return `<section class="${cls}" style="--pcar-per:${o.per||5}${o.card?';--pcar-card:'+o.card+'px':''}"${o.id?` data-pl="${esc(o.id)}"`:''}>${hd?`<header class="pcar-hd">${o.title||o.sub?`<div class="pcar-tt">${o.title?`<h2 class="pcar-t">${esc(o.title)}</h2>`:''}${o.sub?`<p class="pcar-sub">${esc(o.sub)}</p>`:''}</div>`:''}${tabs?`<div class="pcar-tabs">${tabs.map((t,i)=>`<button class="chip${i===(o.tab||0)?' on':''}" aria-pressed="${i===(o.tab||0)}">${esc(t)}</button>`).join('')}</div>`:''}${o.all?`<a class="pcar-all" href="#">${esc(o.all===true?'View all':o.all)}</a>`:''}</header>`:''}
  <div class="pcar-body">${grid?'':'<button class="pcar-arr pcar-arr--prev" disabled></button>'}<div class="pcar-track">${(o.items||[]).map(p=>DG_pcarCard(p,o)).join('')}</div>${grid?'':'<button class="pcar-arr pcar-arr--next"></button>'}</div></section>`};
  /* swatch taps (any rail card): select the colour, swap the image to its shot (data-img). With no shot, the colour tints the image as a stand-in (sample feeds). */
  document.addEventListener('click',e=>{const sw=e.target.closest('.pcar .pc-swatch[data-sw]');if(!sw)return;e.preventDefault();e.stopPropagation();
    const card=sw.closest('.pc'),box=card&&card.querySelector('.pc-img'),ph=box&&box.querySelector('img.ph');
    sw.parentNode.querySelectorAll('.pc-swatch').forEach(b=>{const on=b===sw;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
    if(!box)return;if(!box.dataset.img0&&ph)box.dataset.img0=ph.src;
    if(sw.dataset.img){ph.src=sw.dataset.img;box.classList.remove('pc-img--tint')}
    else{if(ph&&box.dataset.img0)ph.src=box.dataset.img0;box.classList.toggle('pc-img--tint',sw.dataset.sw!=='0');box.style.setProperty('--pc-tint',sw.dataset.c)}},true);

  /* DG_lookPicker(o) — the Create the Look picker (the "slot machine"), opened by any tap on a Create the Look rail. DS sheet (.sheet: slides up on mobile,
     centred 480 on desktop) with one reel per category — a small-header Product carousel of pickable cards (.pc--pick + DS checkbox .chk) — and
     Add to bag (n) in the foot. o: {title, rows:[{label, items[]}], pick:[item.i …] (pre-ticked), brand, round, arrows, onAdd(items)}. Returns {close}. */
  window.DG_lookPicker=function(o){o=o||{};const P=new Set(o.pick||[]);let el=null;
    const all=()=>o.rows.flatMap(r=>r.items),num=s=>parseFloat(String(s).replace(/[^0-9.]/g,''))||0;
    const card=p=>{const on=P.has(p.i);return `<article class="pc pc--pick${on?' on':''}" data-pick="${esc(p.i)}"><div class="pc-img"><img class="ph" src="${esc(p.img)}" alt="${esc(p.name)}"><button type="button" class="chk${on?' on':''}" aria-label="${on?'Remove':'Add'} ${esc(p.name)}" aria-checked="${on}"></button></div>${DG_pcarInfo(p,o)}</article>`};
    const html=()=>{const picked=all().filter(p=>P.has(p.i)),tot=picked.reduce((a,p)=>a+num(p.price),0),n=picked.length;
      return `<div class="scrim" data-lpx></div><div class="panel" role="dialog" aria-modal="true" aria-label="${esc(o.title||'Create The Look')}">
      <div class="head"><h2>${esc(o.title||'Create The Look')}</h2><button class="modal-x" aria-label="Close" data-lpx></button></div>
      <div class="body">${o.rows.map(r=>`<section class="pcar pcar--sm pcar--bleed${o.arrows===false?' pcar--no-arr':''}" style="--pcar-per:3;--pcar-card:140px"><header class="pcar-hd"><div class="pcar-tt"><h2 class="pcar-t">${esc(r.label)}</h2></div></header>
        <div class="pcar-body"><button class="pcar-arr pcar-arr--prev" disabled></button><div class="pcar-track">${r.items.map(card).join('')}</div><button class="pcar-arr pcar-arr--next"></button></div></section>`).join('')}</div>
      <div class="foot"><div class="tot"><span>${n} item${n===1?'':'s'}</span><span>£${tot.toFixed(2)}</span></div><button class="bd pri" style="width:100%"${n?'':' disabled'} data-lpadd>Add to bag (${n})</button></div></div>`};
    const draw=()=>{const keep=el?[...el.querySelectorAll('.pcar-track')].map(t=>t.scrollLeft):null,bs=el?el.querySelector('.body').scrollTop:0;
      if(!el){el=document.createElement('div');el.className='sheet';el.style.zIndex='var(--z-modal)';document.body.appendChild(el);document.documentElement.style.overflow='hidden'}
      el.innerHTML=html();el.querySelector('.body').style.overflowX='hidden';
      if(keep){el.querySelectorAll('.pcar-track').forEach((t,k)=>t.scrollLeft=keep[k]||0);el.querySelector('.body').scrollTop=bs}};
    const close=()=>{if(!el)return;el.classList.remove('open');const x=el;el=null;document.documentElement.style.overflow='';setTimeout(()=>x.remove(),300)};
    draw();requestAnimationFrame(()=>requestAnimationFrame(()=>el&&el.classList.add('open')));
    el.addEventListener('click',e=>{if(e.target.closest('.pc-swatch'))return;
      if(e.target.closest('[data-lpx]')){e.preventDefault();close();return}
      if(e.target.closest('[data-lpadd]')){e.preventDefault();const items=all().filter(p=>P.has(p.i));close();if(o.onAdd)o.onAdd(items);return}
      const pk=e.target.closest('[data-pick]');if(pk){e.preventDefault();const i=isNaN(+pk.dataset.pick)?pk.dataset.pick:+pk.dataset.pick;P.has(i)?P.delete(i):P.add(i);draw();el.classList.add('open')}});
    return {close}};
  const boot=()=>{DG_pcar();if(window.MutationObserver)new MutationObserver(m=>{if(m.some(r=>r.addedNodes.length))DG_pcar()}).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
