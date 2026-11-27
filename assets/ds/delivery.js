/* DG Group Design System — Delivery grid (PDP "Delivery Methods" box) + Delivery options modal. Drop-in, 16 Oct 2026.
   Sources: live PDP Delivery Methods (Dynamo, the same methods checkout serves) · Demi Adesanya's tabbed mockup (Delivery / Click & Collect,
   checkout-style rows, Premier view) · Paul Dossis's modal, Figma Gifting PIh1ikzvYNH1FR4arKJbe4 · 209-294935 (Home Delivery) / 209-295333 (Collect Nearby)
   · Delivery Grid UX catch up 16 Oct 2026 (James's PR: badges + a third home row when two click & collects come back; bulky surcharge upfront).
   CSS: components.css "Delivery grid" block (.dgrid-*, .dopts-*). Markup only — no styles in here.

   DEFAULT (9 Nov 2026, Jake): option B tabs (Delivery / Collection) + Get It By date-only rows + returns and seller info IN the box — what DG_delivery.grid({}) gives.
   Use:  DG_delivery.grid(o)  → the PDP box html      (o.layout 'tabs' Demi (default) · 'list' live sentences · 'line' one-liner)
         DG_delivery.modal(o) → the modal layer html  (o.modal 'toggle' Paul's Figma · 'list' one sectioned list · 'tab' the tab you came from)
         DG_delivery.bulky()  → the surcharge caveat that sits under the price
         DG_delivery.wire(root, o, open) → tabs, See more (calls open(tab)), modal toggle (root = the document or element holding them)
         DG_delivery.mount(document, o) → wire + See more opens the modal over the page, X / scrim closes it (what templates/pdp.html uses)
         DG_delivery.setSeller(document, o) → re-draw the "Sold & Delivered by" line (call when a size is picked) and wire its seller link
         DG_delivery.acc(o, 'ret'|'seller') → that info as a row for the PDP accordion set (.acc-set): Returns · Seller Information
   Returns / seller (29 Oct): o.retIn / o.sellerIn 'box' (default again since 9 Nov: in the box under the methods) · 'acc' (out of the box, into the accordion set — box = delivery only).
   Collection label o.ccLabel (9 Nov): 'Collection' (default, Jake) · 'Collect Nearby' · 'Click & Collect' — the tab, the modal toggle, the list heading.
   CC_LIVE = what each fascia's live checkout tab says (Home Delivery / …), checked 10 Nov with an own-brand item in a guest bag. null = no collection tab on live.
   Seller line (under the returns line): o.seller null → placeholder "Select a size to see seller info" (grey) · 'site' → sold by the fascia
   itself (o.brand, plain text) · a SELLERS key / object → a marketplace seller, the name is a link that opens the seller modal.
   o: {layout, scen:'std'|'cc'|'market'|'market2'|'bulky'|'noaddr' (+ sizeFirst), premier, prog, pr, prBadge:'fastest'|'home', badges, tab, modal, ni:'split'|'mixed',
       sort:'price'|'speed', cut:'midnight'|'12am', more2:'hide'|'show', ret, retDays, pc, known, sheet:'alert'|'up', desk, today:Date, brand, seller,
       retIn:'box'|'acc', sellerIn:'box'|'acc', ccLabel}
   Rows (9 Nov, Jake: the winning option, formats 1, 2 and 4 removed): "Get It By" · Tomorrow / 4th Nov (+ badge) / method · cut-off.
   Size first (12 Nov): o.sizeFirst — until a size is picked the box is only the grey box icon + "Select a size to see seller and delivery info" (+ returns).
   Modal rows (12 Nov, Jake): method name / "Get it by 17th Nov" · cut-off | price — the method leads in the modal.
     The modal rows match; its title stays Delivery Options. */
(function(root){
  const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const IC='assets/ds/icons/lib/';
  /* methods as the Figma (Debenhams). d = days from today (1 = tomorrow), cut = next-day cut-off applies, ni = Northern Ireland, nom = nominated */
  const HOME=[
    {id:'ss',  n:'UK Super Saver Delivery',      s:'Super Saver Delivery', p:.99, was:2.99, d:6},
    {id:'std', n:'UK Standard Delivery',         s:'Standard Delivery',    p:3.99, d:4},
    {id:'exp', n:'UK Express Delivery',          s:'Express Delivery',     p:4.99, d:2},
    {id:'nd',  n:'UK Next Day Delivery',         s:'Next Day Delivery',    p:5.99, d:1, cut:1},
    {id:'dpd', n:'Premium DPD Next Day Delivery',s:'DPD Next Day',         p:6.90, d:1, cut:1},
    {id:'nom', n:'Nominated Delivery',           s:'Nominated Delivery',   p:6.99, from:1, nom:1},
    {id:'niss',n:'NI Super Saver Delivery',      s:'NI Super Saver',       p:.99, was:2.99, d:7, ni:1},
    {id:'nistd',n:'NI Standard Delivery',        s:'NI Standard',          p:6.99, d:5, ni:1}];
  const COLLECT=[
    {id:'inp', n:'24/7 InPost Locker | Shop Collect',          s:'24/7 InPost Locker or Shop', p:2.49, d:3, c:1},
    {id:'evs', n:'Evri ParcelShop Click & Collect - Standard', s:'Evri ParcelShop, Standard',  p:3.99, d:3, c:1},
    {id:'evn', n:'Evri ParcelShop Click & Collect - Next Day', s:'Evri ParcelShop, Next Day',  p:5.99, d:1, cut:1, c:1}];
  /* marketplace / bulky: two home methods only (live Coast examples, 16 Oct) */
  /* scenarios (12 Nov, Jake): every one has a next-day method, so Unlimited / Premier (next day free) changes each of them.
     market = marketplace item, delivery only (no collection): two on the PDP + See more → the full list · market2 = only two methods: no See more, no modal */
  const MARKET=[{id:'mnd',n:'UK Next Day Delivery',s:'Next Day Delivery',p:5.99,d:1,cut:2},{id:'mexp',n:'UK Express Delivery',s:'Express Delivery',p:4.99,d:2,cut:2},
    {id:'mstd',n:'UK Standard Delivery',s:'Standard Delivery',p:3.99,d:5},{id:'mss',n:'UK Super Saver Delivery',s:'Super Saver Delivery',p:2.99,d:7}];
  const MARKET2=[{id:'mnd',n:'UK Next Day Delivery',s:'Next Day Delivery',p:5.99,d:1,cut:2},{id:'mstd',n:'UK Standard Delivery',s:'Standard Delivery',p:3.99,d:5}];
  const BULKY=[{id:'bnd',n:'UK Next Day Delivery',s:'Next Day Delivery',p:9.99,d:1,cut:2},{id:'bstd',n:'UK Standard Delivery',s:'Standard Delivery',p:4.99,d:7}];
  /* the fascia itself — never a link (the site is the seller) */
  const SITE={debenhams:'Debenhams',boohoo:'boohoo',boohooman:'boohooMAN',plt:'PrettyLittleThing',karenmillen:'Karen Millen',warehouse:'Warehouse',brandroom:'The Brand Room'};
  /* marketplace sellers (live Debenhams seller modal, 16 Oct 2026) */
  const SELLERS={amass:{name:'AMASS ECOMMERCE',owner:'AMASS ECOMMERCE LOGISTICS (UK) LTD',addr:['124-128 City Road','London','London','EC1V 2NX'],vat:'UK GB470288383',co:'15717182'}};
  const BULKY_COPY='This is a bulky item, therefore delivery costs include a bulky item surcharge.';
  const FOOT='This product cannot be delivered to the Channel Islands, British Forces Post Office or PO Box addresses.';

  const ord=n=>n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  /* o.journey (18 Nov 2026): dates and day counts come from DS journey.js — working days from the journey's today — so the grid says what checkout says */
  const day=(o,d)=>{if(o.journey&&window.DG_journey)return DG_journey.short(d);const t=new Date(o.today||Date.now());t.setDate(t.getDate()+d);return ord(t.getDate())+' '+MON[t.getMonth()]};
  const money=p=>p===0?'FREE':p<1?Math.round(p*100)+'p':'£'+p.toFixed(2);
  const CC=o=>esc(o.ccLabel||'Collection');   /* the collect tab / toggle / heading word */
  const CC_LIVE={debenhams:'Collect Nearby',boohoo:'Collect Nearby',warehouse:'Collect Nearby',coast:'Collect Nearby',oasis:'Collect Nearby',
    boohooman:'Click & Collect',karenmillen:'Click & Collect',plt:'Click & Collect',brandroom:null};
  const cutoff=(o,m)=>m.cut===2?(o.cut==='12am'?'Order by 11PM':'Order by 11pm'):m.cut?(o.cut==='12am'?'Order by 12AM':'Order by midnight'):'';

  /* the response for a scenario, in the order the API returns it. 'cc' = the live bug: collect comes back first and Super Saver isn't on */
  function methods(o){
    let home,collect;
    if(o.scen==='market'){home=MARKET;collect=[]}
    else if(o.scen==='market2'){home=MARKET2;collect=[]}
    else if(o.scen==='bulky'){home=BULKY;collect=[]}
    else{home=HOME.map(m=>o.scen==='cc'&&m.was?Object.assign({},m,{p:m.was,was:0}):m);collect=COLLECT}
    const prem=m=>o.premier&&m.d===1?Object.assign({},m,{was:m.p,p:0,prem:1}):m;   /* Premier: next day (home + collect) free */
    home=home.map(prem);collect=collect.map(prem);
    return {home,collect,resp:o.scen==='cc'?collect.concat(home):home.concat(collect)};
  }
  const pdpPool=l=>l.filter(m=>!m.ni&&!m.nom);
  const fastest=l=>l.reduce((a,m)=>!a||m.d<a.d?m:a,null);                       /* ties: first in the response (the lottery) */
  const cheapest=l=>l.reduce((a,m)=>!a||m.p<a.p||(m.p===a.p&&m.d<a.d)?m:a,null);

  /* the rows the PDP box shows */
  function picks(o,list){const pool=pdpPool(list),f=fastest(pool),c=cheapest(pool),rows=[];
    if(f)rows.push({m:f,b:o.premier&&f.prem?o.prog||'Premier':'Fastest'});
    if(c&&c!==f)rows.push({m:c,b:'Cheapest'});
    else if(pool.length===2)rows.push({m:pool.find(m=>m!==f),b:''});   /* only two methods (and the free member one is both fastest + cheapest): still show both */
    return rows}
  function rowsList(o){const M=methods(o),rows=picks(o,M.resp);
    if(o.pr&&rows.length===2&&rows.every(r=>r.m.c)){const h=fastest(pdpPool(M.home));if(h)rows.push({m:h,b:o.prBadge==='home'?'Fastest home delivery':'Fastest',third:1})}
    return rows}

  /* Fastest / Cheapest = .dgrid-badge · the member method = the mini membership pill (.mpill--sm, Checkout 2026 3996:173993) */
  const badge=(o,b)=>o.badges===false||!b?'':/^(Fastest|Cheapest)/.test(b)?`<span class="dgrid-badge dgrid-badge--${/^F/.test(b)?'fast':'cheap'}">${esc(b)}</span>`
    :`<span class="mpill mpill--sm${/\+$/.test(b)?' mpill--plus':''}"><i></i><b>${esc(b)}</b></span>`;
  const when=(o,m,lead)=>m.nom?'On a day of your choice':m.d===1?'Tomorrow':(lead?'By ':'')+day(o,m.d);
  const total=o=>{const M=methods(o);return M.home.length+M.collect.length};
  const moreLink=(o,tab,label)=>(total(o)<=2&&o.more2!=='show')?'':`<button class="dgrid-more" data-dg-more="${tab}">${label}</button>`;
  const ret=o=>o.ret===false?'':`<div class="dgrid-ret"><img src="${IC}icons-calendar.svg" alt=""><div>${retCopy(o)}</div></div>`;
  const retCopy=o=>o.journey&&window.DG_journey?`<div class="t">Return within 21 days from Your Orders</div><div class="s">We email your label: no printer or delivery note needed. <a href="#">Returns policy</a></div>`:`<div class="t">Eligible for return within ${esc(o.retDays||21)} days</div><div class="s">Exclusions apply. Please see our <a href="#">returns policy</a></div>`;
  const sellerOf=o=>!o.seller?null:o.seller==='site'?{name:SITE[o.brand]||SITE.debenhams,site:1}:typeof o.seller==='string'?(SELLERS[o.seller]||null):o.seller;
  /* Sold and sent by (was "Sold & Delivered by" — one wording on the PDP, bag and checkout, 18 Nov 2026) — box icon (icons-order); grey placeholder until a size is picked. acc = the accordion-row version: text only, no icon */
  function seller(o,acc){if(o.seller===false)return '';const x=sellerOf(o),cls='dgrid-seller'+(acc?' dgrid-seller--acc':''),ic=acc?'':`<img src="${IC}icons-order.svg" alt="">`;
    if(!x)return `<div class="${cls} is-empty" data-dg-seller>${ic}<span>Select a size to see seller info</span></div>`;
    return `<div class="${cls}" data-dg-seller>${ic}<span>Sold and sent by ${x.site?esc(x.name):`<button type="button" class="lnk" data-dg-sellerinfo>${esc(x.name)}</button>`}</span></div>`}
  /* returns / seller pushed out of the box: one .acc row each, for the PDP accordion set */
  function acc(o,k){const h=k==='seller'?'Seller Information':'Returns';
    const b=k==='seller'?seller(Object.assign({},o,{seller:o.seller===false?null:o.seller}),1)
      :o.journey&&window.DG_journey?`<p class="dgrid-retacc">${DG_journey.returns({site:1})}</p>`:`<p class="dgrid-retacc">Eligible for return within ${esc(o.retDays||21)} days. Exclusions apply. Please see our <a href="#">returns policy</a>.</p>`;
    return `<div class="acc${o.accOpen&&o.accOpen[k]?' open':''}" data-dg-acc="${k}"><button class="acc-h">${h}<img src="${IC}icons-down.svg" alt="" onerror="this.remove()"></button><div class="acc-b">${b}</div></div>`}
  function sellerModal(o){const x=sellerOf(o)||{},lay=o.desk?'mdl--sm':'mdl--up';
    const sec=(h,b)=>b?`<div><dt>${h}</dt><dd>${b}</dd></div>`:'';
    return `<div class="dopts-layer${lay==='mdl--up'?' dopts-layer--up':''}" data-dg-smodal><div class="mdl-scrim" data-dg-close></div>
      <div class="mdl ${lay} dseller" role="dialog" aria-modal="true" aria-label="${esc(x.name)}"><div class="modal-hd"><span class="mt">${esc(x.name)}</span><button class="modal-x" data-dg-close aria-label="Close"></button></div>
      <div class="mdl-bd"><dl>${sec('Owned by:',esc(x.owner))}${sec('Registered address:',(x.addr||[]).map(esc).join('<br>'))}${sec('VAT registration number:',esc(x.vat))}${sec('Registered company number:',esc(x.co))}</dl>
      <div class="dseller-ret">${retCopy(o)}</div></div></div></div>`}
  function openSeller(doc,o){doc.querySelectorAll('[data-dg-smodal]').forEach(n=>n.remove());doc.body.insertAdjacentHTML('beforeend',sellerModal(o));
    const m=doc.querySelector('[data-dg-smodal]');m.querySelectorAll('[data-dg-close]').forEach(x=>x.onclick=()=>m.remove())}
  const bulkyNote=o=>o.scen==='bulky'?`<p class="dgrid-note">${BULKY_COPY}</p>`:'';

  /* A · live + James's PR (Home Delivery Top Up): "Arrives Tomorrow [Fastest]" / method name | price, fastest first, cheapest last */
  function list(o){const rows=rowsList(o);
    return `<ul class="dgrid-rows dgrid-rows--pr">${rows.map(({m,b})=>`<li class="dgrid-row"><div class="l"><div class="w"><b>${m.d===1?'Arrives Tomorrow':'Arrives by '+day(o,m.d)}</b>${badge(o,b)}</div><span class="n">${esc(m.n)}</span></div>
      <div class="r"><b>${m.prem?'FREE':money(m.p)}</b>${m.prem?`<s>${money(m.was)}</s>`:''}</div></li>`).join('')}</ul>${bulkyNote(o)}${moreLink(o,'home','See more')}`}

  /* the checkout Delivery Method row (DS .dmeth, no radio) — the box and the modal both use it, so they match checkout.
     name (+ badge) / "Arrives …" (· cut-off) | price, was inline after it */
  /* a badge rides on the name's last word, so a long name wraps with it and it never sits on a line of its own */
  const named=(o,name,b)=>{if(!b||o.badges===false)return esc(name);const i=name.lastIndexOf(' ');return `${esc(name.slice(0,i+1))}<span class="nw">${esc(name.slice(i+1))}${badge(o,b)}</span>`};
  /* Get It By: the date leads (strong, + badge), the method name (· cut-off) under it; .dmeth-a draws the · and drops it when the cut-off wraps */
  const TITLE='Get It By';
  const lead=(o,m)=>m.nom?'Day of your choice':m.d===1?'Tomorrow':day(o,m.d);
  const dmeth=(o,m,name,b)=>`<li class="dmeth"><div class="dmeth-l"><div class="dmeth-n">${named(o,lead(o,m),b)}</div><span class="dmeth-a"><span>${esc(name)}</span>${cutoff(o,m)?` <span>${cutoff(o,m)}</span>`:''}</span></div>
      <div class="dmeth-p"><b>${m.prem?'FREE':(m.from?'From ':'')+money(m.p)}</b>${m.was?`<s>${money(m.was)}</s>`:''}</div></li>`;
  /* B · Demi: Delivery / Collection tabs, the fastest + cheapest of each as checkout rows */
  function row(o,{m,b}){return dmeth(o,m,m.s,b)}
  function tabs(o){const M=methods(o),hasC=M.collect.length>0,first=o.tab==='collect'&&hasC?'collect':'home';
    const panel=(k,more)=>`<div class="dgrid-panel" data-dg-panel="${k}"${k===first?'':' hidden'}><ul class="dmeth-list dmeth-list--sm">${picks(o,M[k]).map(r=>row(o,r)).join('')}</ul>${k==='home'?bulkyNote(o):''}${moreLink(o,k,more)}</div>`;
    const order=first==='collect'?['collect','home']:['home','collect'];
    const T={home:'Delivery',collect:CC(o)};
    return {hd:hasC?`<div class="dgrid-tabs" role="tablist">${order.map(k=>`<button role="tab" data-dg-tab="${k}" class="${k===first?'on':''}" aria-selected="${k===first}">${T[k]}</button>`).join('')}</div>`:'',body:`
      <div class="dgrid-panes">${panel('home','See more')}${hasC?panel('collect','See more'):''}</div>`}}

  /* C · one-liner (Amazon style) — everything else lives in the modal. Icon: DS fast (slanted) truck when it arrives tomorrow, the upright truck otherwise */
  function line(o){const M=methods(o),f=fastest(pdpPool(M.home)),cc=cheapest(M.collect);if(!f)return '';
    const to=o.known&&o.pc?` to <b>${esc(o.pc)}</b>`:` with ${esc(f.s)}`;
    return `<div class="dgrid-one"><img src="${IC}${f.d===1?'icons-delivery-fast':'icons-delivery'}.svg" alt=""><div><p>Get it <b>${when(o,f,0)}</b>${to}</p>
      <span class="s">${[cutoff(o,f),f.prem?`Free with ${esc(o.prog||'Premier')}`:money(f.p)].filter(Boolean).join(', ')}${cc?`, or collect from ${cc.prem?'free':money(cc.p)}`:''}</span></div></div>${bulkyNote(o)}
      <button class="dgrid-more" data-dg-more="home">${M.collect.length?'Delivery &amp; collection options':'Delivery options'}</button>`}

  /* size first (12 Nov, Jake): o.sizeFirst + no size picked (o.seller empty) → no title, no methods, no divider — the grey box icon
     and "Select a size to see seller and delivery info", the returns line under it. Picking a size draws the full grid. */
  const WAIT='Select a size to see seller and delivery info';
  function wait(o){return `<section class="dgrid dgrid--wait" data-dg data-dg-wait aria-label="Delivery methods"><div class="dgrid-seller is-empty"><img src="${IC}icons-order.svg" alt=""><span>${WAIT}</span></div>${o.retIn!=='acc'?ret(o):''}</section>`}
  /* no delivery to the default address (12 Nov, Jake, from live): title, the line in the bulky-note style (.dgrid-note, not the yellow banner), no methods, no See more */
  const NOADDR='We may not offer delivery to your default delivery address';
  function noAddr(o){return `<section class="dgrid" data-dg aria-label="Delivery methods"><div class="dgrid-hd"><h2>${TITLE}</h2></div><p class="dgrid-note">${NOADDR}</p>${o.retIn!=='acc'?ret(o):''}${o.sellerIn!=='acc'?seller(o):''}</section>`}
  function grid(o){if(o.journey&&window.DG_journey)HOME.forEach(m=>{const j=DG_journey.METH.find(x=>x.id===m.id);if(j)m.d=j.days});if(o.sizeFirst&&!o.seller)return wait(o);if(o.scen==='noaddr')return noAddr(o);o=Object.assign({layout:'tabs'},o);const x=o.layout==='tabs'?tabs(o):{hd:'',body:o.layout==='line'?line(o):list(o)};   /* tabs sit top right, on the title line */
    return `<section class="dgrid${o.layout==='line'?' dgrid--line':''}" data-dg aria-label="Delivery methods">${o.layout==='line'?'':`<div class="dgrid-hd"><h2>${TITLE}</h2>${x.hd}</div>`}${x.body}${o.retIn!=='acc'?ret(o):''}${o.sellerIn!=='acc'?seller(o):''}</section>`}

  /* ---- modal ---- */
  function sortL(o,l){const s=l.slice();s.sort(o.sort==='speed'?(a,b)=>(a.nom?99:a.d)-(b.nom?99:b.d)||a.p-b.p:(a,b)=>a.p-b.p||(a.nom?99:a.d)-(b.nom?99:b.d));return s}
  /* modal row (12 Nov, Jake): the method leads (strong), "Get it by …" (· cut-off) under it — the PDP's Get It By words, never "Arrives" */
  const getBy=(o,m)=>m.nom?'Get it on a day of your choice':'Get it by '+(m.d===1?'tomorrow':day(o,m.d));
  const mmeth=(o,m)=>`<li class="dmeth"><div class="dmeth-l"><div class="dmeth-n">${esc(m.n)}</div><span class="dmeth-a"><span>${getBy(o,m)}</span>${cutoff(o,m)?` <span>${cutoff(o,m)}</span>`:''}</span></div>
      <div class="dmeth-p"><b>${m.prem?'FREE':(m.from?'From ':'')+money(m.p)}</b>${m.was?`<s>${money(m.was)}</s>`:''}</div></li>`;
  const ul=(o,l)=>`<ul class="dmeth-list dmeth-list--sm">${l.map(m=>mmeth(o,m)).join('')}</ul>`;
  function homeBlock(o,M,head){const uk=M.home.filter(m=>!m.ni),ni=M.home.filter(m=>m.ni);
    if(o.ni==='mixed'||!ni.length)return (head?`<h3 class="dopts-grp">Home delivery</h3>`:'')+ul(o,sortL(o,M.home));
    return (head?`<h3 class="dopts-grp">Home delivery</h3>`:'')+ul(o,sortL(o,uk))+`<hr class="dopts-hr">`+(head?`<h3 class="dopts-grp">Northern Ireland</h3>`:'')+ul(o,sortL(o,ni))}
  const collectBlock=(o,M,head)=>M.collect.length?(head?`<h3 class="dopts-grp">${CC(o)}</h3>`:'')+ul(o,sortL(o,M.collect)):`<p class="dopts-empty">${CC(o)} isn’t available for this item.</p>`;
  function modal(o,tab){const M=methods(o);tab=tab==='collect'?'collect':'home';
    const lay=o.desk?'mdl--sm':o.sheet==='up'?'mdl--up':'mdl--alert';
    const bulky=o.scen==='bulky'?`<div class="msg msg--neutral"><i></i><div class="body"><span>${BULKY_COPY}</span></div></div>`:'';
    let body,title='Delivery Options';
    if(o.modal==='list'){body=homeBlock(o,M,1)+(M.collect.length?`<hr class="dopts-hr">`+collectBlock(o,M,1):'')}
    else if(o.modal==='tab'){title=tab==='collect'?'Collection Options':'Delivery Options';body=tab==='collect'?collectBlock(o,M,0):homeBlock(o,M,0)}
    else if(!M.collect.length){body=homeBlock(o,M,0)}   /* delivery only (marketplace / bulky): no tabs */
    else{body=`<div class="tabs--seg dopts-seg" role="tablist"><button data-dg-seg="home" class="${tab==='home'?'on':''}">Delivery</button><button data-dg-seg="collect" class="${tab==='collect'?'on':''}">${CC(o)}</button></div>
      <div class="dopts-panes"><div data-dg-mpanel="home"${tab==='home'?'':' hidden'}>${homeBlock(o,M,0)}</div><div data-dg-mpanel="collect"${tab==='collect'?'':' hidden'}>${collectBlock(o,M,0)}</div></div>`}
    return `<div class="dopts-layer${lay==='mdl--up'?' dopts-layer--up':''}" data-dg-modal><div class="mdl-scrim" data-dg-close></div>
      <div class="mdl ${lay} dopts" role="dialog" aria-modal="true" aria-label="${title}"><div class="modal-hd"><span class="mt">${title}</span><button class="modal-x" data-dg-close aria-label="Close"></button></div>
      <div class="mdl-bd">${bulky}${body}<p class="dopts-note">${FOOT}</p></div></div></div>`}

  function wire(r,o,open){const q=s=>[...r.querySelectorAll(s)];
    q('[data-dg-tab]').forEach(t=>t.onclick=()=>{const k=t.dataset.dgTab;q('[data-dg-tab]').forEach(x=>{x.classList.toggle('on',x===t);x.setAttribute('aria-selected',x===t)});q('[data-dg-panel]').forEach(p=>p.hidden=p.dataset.dgPanel!==k)});
    q('[data-dg-more]').forEach(b=>b.onclick=e=>{e.preventDefault();open&&open(b.dataset.dgMore)});
    q('[data-dg-seg]').forEach(b=>b.onclick=()=>{const k=b.dataset.dgSeg;q('[data-dg-seg]').forEach(x=>x.classList.toggle('on',x===b));q('[data-dg-mpanel]').forEach(p=>p.hidden=p.dataset.dgMpanel!==k)});
    q('[data-dg-acc]>.acc-h').forEach(h=>h.onclick=()=>h.parentElement.classList.toggle('open'));
    const doc=r.ownerDocument||r;q('[data-dg-sellerinfo]').forEach(b=>b.onclick=()=>openSeller(doc,o));
  }
  /* page drop-in: grid already in the page → See more opens the modal over doc.body; X or the scrim closes it */
  function mount(doc,o){const open=tab=>{doc.querySelectorAll('[data-dg-modal]').forEach(n=>n.remove());doc.body.insertAdjacentHTML('beforeend',modal(o,tab));
      const m=doc.querySelector('[data-dg-modal]');wire(m,o);m.querySelectorAll('[data-dg-close]').forEach(x=>x.onclick=()=>m.remove())};
    wire(doc,o,open);return open}
  const bulky=()=>`<p class="dgrid-bulky"><img src="${IC}icons-info.svg" alt="">${BULKY_COPY}</p>`;
  /* only the seller line is re-drawn and re-wired — See more / tabs keep their handlers */
  function setSeller(doc,o){doc.querySelectorAll('[data-dg-seller]').forEach(n=>{n.outerHTML=seller(o,n.classList.contains('dgrid-seller--acc'))});doc.querySelectorAll('[data-dg-sellerinfo]').forEach(b=>b.onclick=()=>openSeller(doc,o))}
  root.DG_delivery={grid,modal,wire,mount,bulky,acc,methods,rows:rowsList,seller,sellerModal,setSeller,SITE,SELLERS,HOME,COLLECT,CC_LIVE};
})(typeof window!=='undefined'?window:globalThis);
