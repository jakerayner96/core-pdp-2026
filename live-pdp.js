/* Live PDP module — renders today's production PDP for a fascia from window.LIVE_BRANDS (brands-live.js).
   Usage: LivePDP.render(container, 'plt', { chip: '<button …>', onAddToBag: fn, onSize: fn, sizeSel: 'M' })
   Shared verbatim between core-pdp-2026 and vto-prototype; assets resolve from assets/live/. */
(function(){
  var A = 'assets/live/';
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var fmt = function(v){ if (v == null || v === '') return ''; if (typeof v === 'number') return '£' + v.toFixed(2); return v; };
  var TICK = '<svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1 5.2L4.6 8.8L12 1" stroke="currentColor" stroke-linecap="round"/></svg>';
  var FONTS = 'https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;600&family=Montserrat:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Jost:wght@400;500;600&family=Public+Sans:wght@300;400;500;600;700&display=swap';
  function ensureFonts(){ if (document.querySelector('link[data-lp-fonts]')) return; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; l.setAttribute('data-lp-fonts', '1'); document.head.appendChild(l); }

  function pct(p){ if (!p.was || !p.price) return ''; var a = num(p.price), b = num(p.was); if (!a || !b || b <= a) return ''; return '-' + Math.round((1 - a / b) * 100) + '%'; }
  function num(v){ return typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, '')); }

  function card(B, p){
    var sale = p.was && num(p.was) > num(p.price);
    var pctTxt = p.pct || (sale ? pct(p) : '');
    var showBrand = B.card.brand !== false && p.brand;
    return '<div class="lp-card">' +
      '<div class="img"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
      '<div class="info">' + (p.sponsored ? '<span class="spons">Sponsored</span>' : '') +
      '<div class="titles">' + (showBrand ? '<span class="cb-brand">' + esc(p.brand) + '</span>' : '') + '<span class="cb-name">' + esc(p.name) + '</span></div>' +
      '<div class="cp"><span class="now' + (sale ? ' sale' : '') + '">' + esc(fmt(p.price)) + '</span>' + (sale ? '<span class="was">' + esc(fmt(p.was)) + '</span>' + (B.card.pct !== false && pctTxt ? '<span class="pct">' + esc(pctTxt) + '</span>' : '') : '') + '</div>' +
      (p.swatches ? '<div class="sw-row">' + p.swatches.map(function(c){ return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</div>' : '') +
      '</div></div>';
  }
  function recs(B, R){
    if (!R || !R.items || !R.items.length) return '';
    var cards = R.items.map(function(p){ return card(B, p); }).join('');
    if (R.type === 'grid') return '<section class="lp-recs grid" data-lp="recs"><span class="lp-rail-title">' + esc(R.title) + '</span><div class="lp-grid3">' + cards + '</div></section>';
    return '<section class="lp-recs' + (R.tinted ? ' tinted' : '') + '" data-lp="recs"><span class="lp-rail-title">' + esc(R.title) + '</span><div class="lp-scroll">' + cards + '</div></section>';
  }
  function stars(n, size){
    var out = '';
    for (var i = 1; i <= 5; i++){ var s = n >= i ? 'fill' : (n >= i - .5 ? 'half' : 'outline'); out += '<img src="' + A + 'icons/icons-star-' + s + '.svg" alt="">'; }
    return out;
  }
  function memberLogo(M){
    if (M.logoImg) return '<span class="lg"><img src="' + esc(M.logoImg) + '" style="height:' + (M.logoH || 24) + 'px" alt="' + esc(M.name || '') + '"></span>';
    switch (M.logo){
      case 'premier-italic': return '<span class="lg italic">Premier</span>';
      case 'premier-club': return '<span class="lg italic" style="color:var(--mb-lg,#8b0f2d)">Premier Club</span>';
      case 'royalty': return '<span class="lg serif">Royalty</span>';
      case 'premier': return '<span class="lg">PREMIER</span>';
      case 'unlimited': return '<span class="lg stack"><span class="word">' + esc(M.brandWord || 'Debenhams') + '</span><big>UNLIMITED</big></span>';
      default: return '<span class="lg">' + esc(M.name || '') + '</span>';
    }
  }
  function deliverLock(B){
    var k = B.deliver.lockup, name = B.name;
    switch (k){
      case 'deb': return '<img src="' + A + 'deliver/deb-word.svg" style="height:20px" alt="Debenhams"><img src="' + A + 'deliver/deb-plus.svg" style="height:6px;margin-top:1px" alt="Deliver+">';
      case 'bh':  return '<img src="' + A + 'deliver/bh.png" style="height:19px" alt="boohoo deliver+">';
      case 'bm':  return '<img src="' + A + 'deliver/bm.svg" style="height:15px" alt="DELIVER+">';
      case 'plt': return '<span style="position:relative;width:113px;height:40px;display:block"><img src="' + A + 'deliver/plt-shield.svg" style="position:absolute;left:0;top:0;height:40px" alt=""><img src="' + A + 'deliver/plt-inner.svg" style="position:absolute;left:6.4px;top:8.3px;height:18px" alt=""><img src="' + A + 'deliver/plt-word.svg" style="position:absolute;left:40.8px;top:11.3px;height:11.8px" alt="Deliver+"></span>';
      case 'km':  return '<img src="' + A + 'deliver/km-word.svg" style="height:10px" class="lp-white" alt="Karen Millen"><img src="' + A + 'deliver/km-plus.svg" style="height:16px;margin-top:4px" class="lp-white" alt="Deliver+">';
      default:    return '<span class="txt">' + (B.deliver.lockupImg ? '<img src="' + esc(B.deliver.lockupImg) + '" style="height:' + (B.deliver.lockupH || 18) + 'px;margin-bottom:3px" alt="' + esc(name) + '">' : esc(name)) + '<small>DELIVER+</small></span>';
    }
  }
  function uspRow(r){
    var icon = r.kw ? '<span class="kw">' + esc(r.kw) + '</span>' : '<img src="' + esc(r.icon) + '" alt="">';
    var body = r.cap ? '<span class="cap">' + esc(r.cap) + '</span><span class="strong">' + esc(r.strong) + '</span>' : '<span class="t14">' + esc(r.t14) + '</span>' + (r.t12 ? '<span class="t12">' + r.t12 + '</span>' : '');
    return '<div class="r">' + icon + '<div class="txt">' + body + '</div></div>';
  }

  function render(container, key, opts){
    opts = opts || {};
    var B = window.LIVE_BRANDS[key]; if (!B) throw new Error('LivePDP: unknown brand ' + key);
    var P = B.product, T = B.tokens || {};
    ensureFonts();
    container.className = 'lpdp'; container.setAttribute('data-brand', key);
    var css = { '--lp-font': B.font, '--lp-w-light': B.weights.light, '--lp-w-reg': B.weights.reg, '--lp-w-med': B.weights.med, '--lp-w-bold': B.weights.bold, '--lp-w-btn': B.weights.btn, '--lp-case-btn': B.caseBtn || 'uppercase', '--lp-case-title': B.caseTitle || 'none',
      '--lp-primary': T.primary, '--lp-primary-ink': T.primaryInk, '--lp-radius': T.radius || '4px', '--lp-link': T.link || T.primary, '--lp-bg': T.bodyBg || '#fff', '--lp-surface': T.surface || '#fafafa', '--lp-media': T.media || '#f2f2f2',
      '--lp-sale': T.sale || '#d33f3f', '--lp-was': T.was || '#6b6b6b', '--lp-badge-bg': T.badgeBg || '#fff2f2', '--lp-badge-ink': T.badgeInk || '#d33f3f', '--lp-size-border': T.sizeBorder || '#e5e7eb', '--lp-ft-band': T.ftBand || '#f8f8f8',
      '--lp-logo-h': (B.logoH || 16) + 'px', '--lp-ft-logo-h': (B.ftLogoH || 20) + 'px', '--lp-hd-icon': (B.iconSize || 24) + 'px', '--lp-nav-bg': T.navBg || 'transparent', '--lp-nav-fg': T.navFg || '#000' };
    Object.keys(css).forEach(function(k){ if (css[k] !== undefined && css[k] !== null) container.style.setProperty(k, css[k]); });

    var sel = opts.sizeSel || P.sel;
    var wish = A + 'icons/' + (B.wishIcon === 'bookmark' ? 'icon-bookmark.svg' : 'icons-heart.svg');
    var h = '';
    /* header */
    h += '<header class="lp-hdr"><div class="wrap"><div class="lp-hdr-row"><div class="lp-hdr-left"><button class="lp-hdr-menu" aria-label="Menu"><img class="ic" src="' + A + 'icons/icons-hamburger-menu.svg" alt=""></button><a href="#" aria-label="' + esc(B.name) + ' home"><img class="lp-hdr-logo" src="' + esc(B.logo) + '" alt="' + esc(B.name) + '"></a></div>' +
      '<div class="lp-hdr-search"><span>' + esc(B.searchPlaceholder || 'Search Products and Brands') + '</span><img class="ic" src="' + A + 'icons/icons-search.svg" alt=""></div>' +
      '<div class="lp-hdr-icons"><button class="lp-hdr-menu" aria-label="Search"><img src="' + A + 'icons/icons-search.svg" alt=""></button><button aria-label="Account"><img src="' + A + 'icons/icons-account.svg" alt=""></button><button aria-label="Wishlist"><img src="' + wish + '" alt=""></button><button aria-label="Bag"><img src="' + A + 'icons/icons-bag.svg" alt=""></button></div></div>' +
      (B.nav ? '<nav class="lp-hdr-nav">' + B.nav.map(function(n){ return '<a class="' + (/sale/i.test(n) ? 'sale' : '') + '" href="#">' + esc(n) + '</a>'; }).join('') + '</nav>' : '') + '</div>' +
      '<div class="lp-usp">' + (B.banners || []).map(function(s){ var st = 'background:' + s.bg + ';color:' + s.fg; if (s.lines) return '<div class="strip two" style="' + st + '"><span><b>' + esc(s.lines[0]) + '</b></span><span>' + esc(s.lines[1]) + '</span></div>'; if (s.cd) return '<div class="strip" style="' + st + '"><b>' + esc(s.text) + '</b><span class="cd" style="color:' + (s.cdColor || 'inherit') + '">' + esc(s.cd) + '</span></div>'; return '<div class="strip' + (s.bold ? ' ticker' : '') + '" style="' + st + '">' + (s.bold ? esc(s.text) : esc(s.text).replace(/(Code: |code: )(\S+)/, '$1<b>$2</b>')) + '</div>'; }).join('') + '</div></header>';
    h += '<div class="wrap">';
    /* breadcrumb */
    h += '<nav class="lp-crumb" aria-label="Breadcrumb">' + (P.crumbs || []).map(function(c, i, arr){ var desk = arr.length > 2 && i < arr.length - 2 ? ' desk' : ''; return '<a class="' + desk.trim() + '" href="#">' + esc(c) + '</a>' + (i < arr.length - 1 ? '<span class="sep' + desk + '">/</span>' : ''); }).join('') + '<button class="share" aria-label="Share"><img class="ic16" src="' + A + 'icons/icons-share.svg" alt=""></button></nav>';
    /* hero */
    h += '<section class="lp-hero"><div class="lp-galwrap"><div class="lp-thumbs">' + P.images.map(function(s, i){ return '<button class="' + (i === 0 ? 'on' : '') + '" data-i="' + i + '"><img src="' + esc(s) + '" alt=""></button>'; }).join('') + '</div><div class="lp-galmain"><div class="lp-gal">' + P.images.map(function(s, i){ return '<div class="slide"><img src="' + esc(s) + '" alt="' + esc(P.title) + ', view ' + (i + 1) + '"></div>'; }).join('') + '</div></div></div>';
    h += '<div class="lp-pag"><div class="track"><div class="fill"></div></div></div>';
    /* buy */
    h += '<div class="lp-buy">';
    h += '<div class="lp-slot" data-lp="chip">' + (opts.chip || '') + '</div>';
    h += '<div class="lp-title-row"><div class="lp-title-text"><span class="lp-brand">' + esc(P.brand) + '</span><h1 class="lp-pname">' + esc(P.title) + '</h1></div><button class="lp-wish" aria-label="Add to wishlist"><img src="' + wish + '" alt=""></button></div>';
    if (P.stars) h += '<div class="lp-stars"><span class="s">' + stars(P.stars.rating) + '</span><span class="c">(' + esc(P.stars.count) + ')</span></div>';
    var sale = P.was && num(P.was) > num(P.price);
    h += '<div class="lp-price-row"><span class="lp-price-now' + (sale ? ' sale' : '') + '">' + esc(fmt(P.price)) + '</span>' + (sale ? '<span class="lp-price-was">' + esc(fmt(P.was)) + '</span>' + (P.save ? '<span class="lp-save' + (B.card.pillSave ? ' pill' : (B.card.saveSmall ? ' sm' : '')) + '">' + esc(P.save) + '</span>' : '') : '') + '</div>';
    if (P.promo && P.promo.length) h += '<div class="lp-promo">' + P.promo.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('') + '</div>';
    if (P.ndd !== false) h += '<div class="lp-ndd"><img src="' + A + 'misc/badge-nextday.svg" alt=""><span>Order in <b>' + esc(P.ndd || '14 hrs 50 mins') + '</b> for Next Day Delivery</span></div>';
    h += '<div class="lp-colour"><span class="lp-colour-lbl">Colour: <b>' + esc(P.colour) + '</b></span>' + (P.swatches && P.swatches.length ? '<div class="lp-swatches">' + P.swatches.map(function(s){ if (s.dot) return '<button class="lp-sw dot' + (s.on ? ' on' : '') + '" style="background:' + esc(s.dot) + '" aria-label="' + esc(s.name || '') + '"></button>'; return '<button class="lp-sw' + (s.on ? ' on' : '') + '" aria-label="' + esc(s.name || '') + '"><img src="' + esc(s.img) + '" alt=""></button>'; }).join('') + '</div>' : '') + '</div>';
    if (P.fit) h += '<div class="lp-fit"><span class="lbl">Body Fit:</span><div class="lp-fit-btns">' + P.fit.map(function(f, i){ return '<button class="lp-sz wide' + (i === 0 ? ' on' : '') + '">' + esc(f) + '</button>'; }).join('') + '</div></div>';
    h += '<div class="lp-sizes"><div class="lp-size-head"><span class="lbl">' + (sel ? 'Size: <b>' + esc(sel) + '</b>' : 'Size: Select a Size') + '</span><span class="lp-size-guide"><img src="' + A + 'icons/icons-measure.svg" alt="">Size Guide</span></div>' +
      '<div class="lp-size-btns">' + P.sizes.map(function(s){ var oos = !!s[1]; return '<button class="lp-sz' + (oos ? ' oos' + (B.oosBell ? ' bell' : '') : '') + (s[0] === sel ? ' on' : '') + '" data-size="' + esc(s[0]) + '"' + (oos ? ' aria-disabled="true"' : '') + '>' + esc(s[0]) + (oos && B.oosBell ? '<img class="bell" src="' + A + 'icons/icons-info.svg" alt="">' : '') + '</button>'; }).join('') + '</div></div>';
    if (P.model) h += '<p class="lp-model">' + P.model + '</p>';
    h += '<button class="lp-btn p" data-lp="atb">' + esc(B.atbLabel || 'Add to bag') + '</button>';
    h += '<div class="lp-slot" data-lp="after-buy">' + (opts.afterBuy || '') + '</div>';
    if (B.membership) h += '<div class="lp-member" style="' + (B.membership.bgImg ? 'background-image:url(' + B.membership.bgImg + ');background-size:100% 100%;' : '') + '--mb-bg:' + B.membership.bg + ';--mb-fg:' + B.membership.fg + ';--mb-cta-bg:' + B.membership.ctaBg + ';--mb-cta-fg:' + B.membership.ctaFg + (B.membership.lg ? ';--mb-lg:' + B.membership.lg : '') + '"><div class="t">' + memberLogo(B.membership) + esc(B.membership.copy) + '</div><button class="add">' + esc(B.membership.cta) + '</button></div>';
    var boxes = '';
    var D = B.deliver;
    boxes += '<div class="lp-deliver" style="--dp-bg:' + D.bg + ';--dp-fg:' + D.fg + ';--dp-rule:' + (D.rule || 'rgba(0,0,0,.15)') + '"><div class="lock">' + deliverLock(B) + '</div><span class="h">' + esc(D.title || 'Peace of mind, guaranteed') + '</span><ul>' + (D.bullets || []).map(function(b){ return '<li>' + TICK + '<span>' + esc(b) + '</span></li>'; }).join('') + '</ul><span class="more">' + esc(D.more || 'Learn More') + '</span>' + (D.quote ? '<p class="quote">' + esc(D.quote) + '</p>' : '') + (D.powered ? '<span class="powered">Powered By <b>seel</b> - your trusted shopper protection partner</span>' : '') + '</div>';
    if (B.extraBox) boxes += '<div class="lp-uspbox">' + uspRow(B.extraBox) + '</div>';
    boxes += '<div class="lp-uspbox">' + (B.uspbox || []).map(uspRow).join('') + '</div>';
    if (B.bnpl) boxes += '<div class="lp-bnpl">' + (B.bnpl.title ? '<span class="h">' + esc(B.bnpl.title) + '</span>' : '') + '<div class="badges">' + B.bnpl.badges.map(function(b){ return '<img src="' + A + 'pay/' + b + '.png" alt="' + b + '">'; }).join('') + '</div><span class="terms">' + esc(B.bnpl.terms || '18+, T&C apply. Credit subject to status.') + '</span><span class="more">' + esc(B.bnpl.more || 'See more') + '</span></div>';
    h += '<div class="buyside" style="flex-direction:column;gap:16px">' + boxes + '</div>';
    h += '</div></section>';
    /* below */
    h += '<section class="lp-below">';
    h += '<div class="inset buyside" style="display:flex;flex-direction:column;gap:16px">' + boxes + '</div>';
    (B.recsAbove || []).forEach(function(R){ h += recs(B, R); });
    h += '<div class="lp-desc">';
    if (P.glance && P.glance.length) h += '<div class="lp-drow"><span class="h">At a Glance</span><ul class="lp-glance">' + P.glance.map(function(g){ return '<li><i><img src="' + A + 'icons/icons-tick.svg" alt=""></i><span>' + esc(g) + '</span></li>'; }).join('') + '</ul></div>';
    h += '<div class="lp-drow lp-acc open"><button class="lp-acc-h"><span class="h">Description</span><img src="' + A + 'icons/icons-down.svg" alt=""></button><div class="lp-acc-b">' + (P.desc && P.desc.length ? '<ul>' + P.desc.map(function(d){ return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '') + (P.descText ? '<p>' + esc(P.descText) + '</p>' : '') + (P.sku ? '<p class="sku">SKU: ' + esc(P.sku) + '</p>' : '') + '</div></div>';
    ['Product Details & Care', 'Delivery', 'Returns'].forEach(function(t){ h += '<div class="lp-drow lp-acc"><button class="lp-acc-h"><span class="h">' + esc(t) + '</span><img src="' + A + 'icons/icons-down.svg" alt=""></button><div class="lp-acc-b"><p>' + esc((P.accordions || {})[t] || '') + '</p></div></div>'; });
    h += '</div>';
    (B.recsBelow || []).forEach(function(R){ h += recs(B, R); });
    if (B.reviews) h += '<section class="lp-reviews"><span class="lp-rail-title">Customer Reviews</span><span class="big">' + esc(B.reviews.rating.toFixed(1)) + '</span><span class="st">' + stars(B.reviews.rating) + '</span><span class="sub">(' + esc(B.reviews.count) + ' Customer Reviews)<small>' + esc(B.reviews.line || '') + '</small></span><button class="lp-btn">Write a review</button></section>';
    if (B.reclinks && B.reclinks.length) h += '<div class="lp-reclinks"><span class="lp-rail-title">Recommendations</span><div class="chips">' + B.reclinks.map(function(l){ return '<a href="#">' + esc(l) + '</a>'; }).join('') + '</div></div>';
    h += '</section></div>';
    /* footer */
    var F = B.footer || {};
    h += '<footer class="lp-ft"><div class="wrap"><div class="news"><h3>' + esc(F.title || "Let's get to know each other") + '</h3><p>' + esc(F.copy || 'Sign up to receive emails from us, so you never miss out on the good stuff.') + '</p><div class="row"><input type="email" placeholder="Please enter your email address"><button>' + esc(F.cta || 'Subscribe') + '</button></div><small>By submitting your details, you agree to receive marketing communications from ' + esc(F.legalName || B.name) + ' & our <u>family of brands</u> by email. You can unsubscribe at any point. You also consent to the use of your details in accordance with our <u>Privacy Policy</u>.</small></div>' +
      (F.brandLogos && F.brandLogos.length ? '<div class="fam">' + F.brandLogos.map(function(b){ return '<img src="' + A + 'brands/' + b + '.svg" alt="' + b + '">'; }).join('') + '</div>' : '') +
      '<div class="pay">' + (F.pay || ['visa', 'mastercard', 'amex', 'maestro', 'visa-electron', 'apple-pay', 'paypal', 'klarna', 'clearpay', 'google-pay']).map(function(b){ return '<img src="' + A + 'pay/' + b + '.png" alt="' + b + '">'; }).join('') + '</div>' +
      '<div class="cols">' + (F.accordions || []).map(function(t){ return '<div class="col">' + esc(t) + '<img src="' + A + 'icons/icons-down.svg" alt=""></div>'; }).join('') + '</div>' +
      '<div class="misc"><span class="h">Download Our App</span><div class="apps">' + (F.apps || ['appstore']).map(function(a){ return a === 'googleplay' ? '<img src="' + A + 'apps/google-play.png" alt="Google Play">' : '<img src="' + A + 'apps/app-store.svg" alt="App Store">'; }).join('') + '</div>' +
      (F.country ? '<span class="h">Country</span><div class="country"><span><i class="flag"></i>' + esc(F.country) + '</span><img class="ic16" src="' + A + 'icons/icons-down.svg" alt=""></div>' : '') +
      '<span class="h">Follow Us On Social Media</span><div class="social">' + (F.social || ['instagram', 'pintrest', 'facebook', 'you-tube', 'tik-tok']).map(function(s){ var f = s === 'you-tube' ? 'you-tube' : 'social-' + s; return '<img src="' + A + 'social/' + f + '.svg" alt="' + s + '">'; }).join('') + '</div>' +
      '<img class="ftlogo" src="' + esc(B.logo) + '" alt="' + esc(B.name) + '"><span class="copy">Copyright © 2026 ' + esc(F.copyright || B.name) + '</span></div></div></footer>';
    container.innerHTML = h;

    /* behaviour */
    var gal = container.querySelector('.lp-gal'), fill = container.querySelector('.lp-pag .fill');
    if (gal && fill){ var n = P.images.length; fill.style.width = (100 / n) + '%'; gal.addEventListener('scroll', function(){ var max = gal.scrollWidth - gal.clientWidth; var pc = max > 0 ? gal.scrollLeft / max : 0; fill.style.transform = 'translateX(' + (pc * (n - 1) * 100) + '%)'; var idx = Math.round(pc * (n - 1)); container.querySelectorAll('.lp-thumbs button').forEach(function(b, i){ b.classList.toggle('on', i === idx); }); }); }
    container.querySelectorAll('.lp-thumbs button').forEach(function(b){ b.onclick = function(){ var i = +b.dataset.i; var s = gal.children[i]; if (s) gal.scrollTo({ left: s.offsetLeft, behavior: 'smooth' }); }; });
    container.querySelectorAll('.lp-acc-h').forEach(function(b){ b.onclick = function(){ b.parentElement.classList.toggle('open'); }; });
    container.querySelectorAll('.lp-sz[data-size]').forEach(function(b){ b.onclick = function(){ if (b.classList.contains('oos')) return; container.querySelectorAll('.lp-sz[data-size]').forEach(function(x){ x.classList.toggle('on', x === b); }); var lbl = container.querySelector('.lp-size-head .lbl'); if (lbl) lbl.innerHTML = 'Size: <b>' + esc(b.dataset.size) + '</b>'; if (opts.onSize) opts.onSize(b.dataset.size); }; });
    container.querySelectorAll('.lp-fit-btns .lp-sz').forEach(function(b){ b.onclick = function(){ container.querySelectorAll('.lp-fit-btns .lp-sz').forEach(function(x){ x.classList.toggle('on', x === b); }); }; });
    container.querySelectorAll('.lp-sw').forEach(function(b){ b.onclick = function(){ container.querySelectorAll('.lp-sw').forEach(function(x){ x.classList.toggle('on', x === b); }); }; });
    var atb = container.querySelector('[data-lp="atb"]'); if (atb && opts.onAddToBag) atb.onclick = opts.onAddToBag;
    return container;
  }
  window.LivePDP = { render: render, card: card };
})();
