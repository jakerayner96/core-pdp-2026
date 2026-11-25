/* DG Group Design System — top toast drop-in (9 Nov 2026, Virtual Stylist v2; Figma DS Toast 5146-559, Device=Web).
   One spec: solid white (--surface-raised; 11 Nov, as the Figma library), radius --radius-lg, shadow 0 0 20 10%, padding 16 · message 14/18 regular · action 13.33 strong in --text-link · 16 gap · 12px close.
   PLACEMENT (10 Nov 2026): phones + tablets (< 1024) float it at the BOTTOM, 16 in and 16 up (components.css), lifted above anything pinned to the
   bottom of the screen (--toast-bottom: sticky add-to-bag bars, cookie bars, [data-toast-avoid]). Desktop: top-centred UNDER THE USP BANNERS —
   --toast-top = the bottom of the lowest USP row in view (the sticky black bar once the page scrolls) + 16 — following that edge while it shows.
     DG_toast({msg, action:'View', onAction, close:true, ms:6000, busy:false}) → {el, close(), done(action)}   (one at a time; a new toast replaces the old)
       busy:true shows the small spinner where the action goes (saving…); done('Manage') swaps it for the action when the save lands.
     DG_toastTop() → the px value the toast uses (also exported for .toast--prod callers) */
(function(root){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  function toastTop(){const gap=innerWidth>=1024?16:12;let y=0;
    document.querySelectorAll('.usp-row1').forEach(r=>{const b=r.getBoundingClientRect();if(b.height&&b.bottom>0&&b.top<innerHeight)y=Math.max(y,b.bottom)});
    if(!y){const h=document.querySelector('.hd');if(h){const b=h.getBoundingClientRect();if(b.bottom>0)y=b.bottom}}
    return Math.round(y)+gap}
  /* bottom offset on phones: the tallest bar pinned to the bottom edge (fixed / sticky, under half the screen) + 12, else 16 */
  function toastBottom(){let h=0;
    document.querySelectorAll('[data-toast-avoid],[class*="sticky"],[class*="-bar"],[class*="cookie"],.tabbar').forEach(el=>{if(el.closest('[data-dg-toast]'))return;
      const cs=getComputedStyle(el);if(!el.matches('[data-toast-avoid]')&&cs.position!=='fixed'&&cs.position!=='sticky')return;   /* [data-toast-avoid] always counts (17 Nov: the VS result sheet is absolute inside a fixed overlay) */const b=el.getBoundingClientRect();
      if(!b.height||b.height>innerHeight/2||Math.abs(b.bottom-innerHeight)>2)return;h=Math.max(h,innerHeight-b.top)});
    return h?Math.round(h)+12:16}
  let cur=null;
  function toast(o){o=o||{};if(cur)cur.close(true);
    const el=document.createElement('div');el.className='toast toast--top';el.setAttribute('role','status');el.setAttribute('data-dg-toast','');
    el.innerHTML=`<span class="toast-msg">${esc(o.msg)}</span><span class="toast-end">${o.busy?'<span class="spin sm" aria-label="Saving"></span>':o.action?`<button class="act" type="button">${esc(o.action)}</button>`:''}${o.close===false?'':'<button class="toast-x" type="button" aria-label="Close"></button>'}</span>`;
    document.body.appendChild(el);
    const place=()=>{el.style.setProperty('--toast-top',toastTop()+'px');el.style.setProperty('--toast-bottom',toastBottom()+'px')};let raf=0;const onMove=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(place)};
    place();addEventListener('scroll',onMove,{passive:true});addEventListener('resize',onMove);
    let t=0,done=false;
    const close=now=>{if(done)return;done=true;clearTimeout(t);removeEventListener('scroll',onMove);removeEventListener('resize',onMove);if(cur&&cur.el===el)cur=null;
      if(now){el.remove();return}el.classList.add('toast--out');setTimeout(()=>el.remove(),300)};
    const wire=()=>{const a=el.querySelector('.act'),x=el.querySelector('.toast-x');
      if(a)a.onclick=()=>{close();o.onAction&&o.onAction()};if(x)x.onclick=()=>close()};wire();
    const finish=action=>{const sp=el.querySelector('.toast-end .spin');if(!sp)return;
      if(action){const b=document.createElement('button');b.className='act';b.type='button';b.textContent=action;sp.replaceWith(b);wire()}else sp.remove()};
    t=setTimeout(close,o.ms||6000);
    cur={el,close,done:finish};return cur}
  root.DG_toast=toast;root.DG_toastTop=toastTop;root.DG_toastBottom=toastBottom;
})(typeof window!=='undefined'?window:globalThis);
