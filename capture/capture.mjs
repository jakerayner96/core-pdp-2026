import { chromium } from 'playwright';
const OUT=process.argv[2];
const b=await chromium.launch({headless:true});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',locale:'en-GB'});
const p=await ctx.newPage();
await p.goto('https://www.boohooman.com/categories/mens-premium-essentials',{waitUntil:'domcontentloaded',timeout:90000});
await p.waitForTimeout(6000);
// dismiss cookie banner if present
for(const sel of ['button:has-text("Accept All")','button:has-text("Accept all")','#onetrust-accept-btn-handler','button:has-text("Accept")']){try{await p.click(sel,{timeout:1500});break;}catch{}}
for(let i=0;i<8;i++){await p.mouse.wheel(0,1600);await p.waitForTimeout(900);}
await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(800);
await p.screenshot({path:OUT+'/cat-390.png',fullPage:true});
const products=await p.evaluate(()=>{
  const out=[];const seen=new Set();
  document.querySelectorAll('a[href*="/products/"]').forEach(a=>{
    const href=a.getAttribute('href');if(seen.has(href))return;seen.add(href);
    const card=a.closest('li,article,[class*="card"],[class*="Card"],[class*="product"],[class*="Product"]')||a;
    const img=card.querySelector('img');
    out.push({href, text:(card.innerText||'').replace(/\s+/g,' ').trim().slice(0,240), img:img&&(img.currentSrc||img.src), srcset:img&&img.getAttribute('srcset')});
  });
  return {title:document.title,count:out.length,products:out};
});
const fs=await import('fs');fs.writeFileSync(OUT+'/cat.json',JSON.stringify(products,null,1));
console.log('category products',products.count);
// PDP: first product
const first=products.products.find(x=>x.href&&x.href.includes('/products/'));
if(first){
  const url=new URL(first.href,'https://www.boohooman.com').href;console.log('PDP',url);
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(6000);
  for(let i=0;i<10;i++){await p.mouse.wheel(0,1400);await p.waitForTimeout(700);}
  await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(800);
  await p.screenshot({path:OUT+'/pdp-390.png',fullPage:true});
  const dom=await p.evaluate(()=>{
    const walk=(el,d,acc)=>{if(d>14||!el||!el.tagName)return;const t=el.tagName.toLowerCase();if(['script','style','svg','path','noscript'].includes(t))return;const cls=(el.className&&typeof el.className==='string')?el.className.split(' ').filter(Boolean).slice(0,3).join('.'):'';const own=Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean).join(' ').slice(0,90);const r=el.getBoundingClientRect();if(r.width<2||r.height<2)return;acc.push(' '.repeat(d)+t+(cls?'.'+cls:'')+(own?' "'+own+'"':'')+` [${Math.round(r.width)}x${Math.round(r.height)}]`);Array.from(el.children).forEach(c=>walk(c,d+1,acc));};
    const acc=[];walk(document.body,0,acc);return acc.join('\n');
  });
  fs.writeFileSync(OUT+'/pdp-dom.txt',dom);
  fs.writeFileSync(OUT+'/pdp.html',await p.content());
  const d=await ctx.browser().newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,locale:'en-GB'});const dp=await d.newPage();
  await dp.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await dp.waitForTimeout(6000);
  for(const sel of ['#onetrust-accept-btn-handler','button:has-text("Accept All")']){try{await dp.click(sel,{timeout:1500});break;}catch{}}
  for(let i=0;i<10;i++){await dp.mouse.wheel(0,1400);await dp.waitForTimeout(600);}
  await dp.evaluate(()=>window.scrollTo(0,0));await dp.waitForTimeout(800);
  await dp.screenshot({path:OUT+'/pdp-1440.png',fullPage:true});
}
await b.close();
