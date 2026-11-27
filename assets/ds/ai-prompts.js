/* DG Group Design System — Google PDP prompts drop-in (16 Oct 2026). Markup for .ai-prompts (CSS in components.css), mirroring Google Cloud's
   <google-ai-prompts product-id direction> web component. Promoted from the Shopping agent prototype (projects/shopping-agent: name "Deb",
   prompts from the dev's salesAgentConfig). Named agents: Debenhams = Deb ("Ask Deb"), boohooMAN = Jordan AI ("Ask Jordan AI", Jake 27 Nov); other fascias read "Ask AI" until they get one.
   Use: DG_aiPromptsHTML(brand, {prompts, dir:'column'|'row', head:true, ask:true, sku}) → html */
(function(root){
  const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const AGENT={debenhams:'Deb',boohooman:'Jordan AI'};
  const PROMPTS=['Does this fit true to size?','What shoes would go with this?','Is this suitable for a winter wedding?'];
  const ic=sz=>`<i class="ai-icon" style="width:${sz}px;height:${sz}px"></i>`;
  root.DG_AI_PROMPTS={AGENT,PROMPTS};
  root.DG_aiPromptsHTML=function(brand,o){o=Object.assign({prompts:PROMPTS,dir:'column',head:true,ask:true,sku:''},o||{});
    const item=(t,cls)=>`<div class="prompt-item"><button class="prompt-link ai-pill ${cls} ai-pill--wrap" data-q="${esc(t)}"><span class="prompt-link__icon">${ic(16)}</span><span class="prompt-link__text">${esc(t||'Ask anything')}</span></button></div>`;
    return `<div class="ai-prompts" data-slot="ai-prompts">${o.head?`<h3 class="ai-prompts-hd">${ic(18)}Ask ${esc(AGENT[brand]||'AI')}</h3>`:''}
      <div class="prompts-container" data-dir="${o.dir}" data-product-id="${esc(o.sku)}">${o.prompts.filter(Boolean).map(t=>item(t,'ai-pill--soft')).join('')}${o.ask?item('','ai-pill--outline'):''}</div></div>`};
})(typeof window!=='undefined'?window:globalThis);
