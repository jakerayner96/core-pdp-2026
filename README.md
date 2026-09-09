# Core PDP 2026 — boohooMAN

Master PDP prototype for the boohooMAN ask: **Shop The Look recommendations → Create The Look**, **advanced bundling → Shop The Set builder** on the Premium Essentials collection, **complete-the-look patterns** (Pairs well with, inline band, hotspot look), and **OOS notify me**. Packaged as a **configurator** stakeholders can drive themselves and export from.

- **Configurator:** `index.html` (serve from repo root: `python3 -m http.server 3010`, assets need HTTP)
- **Page:** `pdp.html` — single file, no build. `data.js` = the live Premium Essentials catalogue (40 SKUs, 8 families).
- **Repo:** github.com/jakerayner96/core-pdp-2026 · **Pages:** jakerayner96.github.io/core-pdp-2026

## The configurator

Dark Group-UX chrome. Layout/logic model = PayPal's Checkout demo: **window** controls along the top, **page** controls down the left.

- **Top:** Export · Live now ⇄ New format · Desktop / Mobile (plus an exact-width select and a drag handle on the preview edge).
- **Left panel (cards):** Brand · Set entry point (03 / 04 / 06 / 07 — 03-3 Pairs well with is a complete-the-look pattern; 08 = image banners with no grey, copy overlaid on a row of set images; 09 = range ideas — colour dots strip, set sum, piece chips, colourway rail, one-tap add-on, fan deck, text link, split tile; stacked-card entries 07-3…07-6 and 09-6 get a Static / Shuffle toggle) · Set builder layout (Cards / Compact) · Shop The Look module format (Grey / Carousel / Grid / Inline / Hotspot / Off) · Handpicked For You format · We Think You'll Like format · Stock state · Layout (edit mode toggle, removed blocks, reset) · Current configuration.
- **Edit layout (on the page):** every block — title, price, colour, entry point, body fit, size, buy, each below-fold box, each recs module, each description row — gets a label, ▲▼ to move within its column and ✕ to remove. Removed blocks move to a **"Removed from this layout"** tray under the page (Restore in edit mode) so decisions are visible, not silent. Dividers in the description area only ever sit between rows, so a removed row takes its divider with it.
- **Export** (top left): renders full-page PNGs at 390 and 1440 via html2canvas and builds a zip: `config.json` (the decision record: mode, entry, stock, recs formats, set builder layout, block order, removed blocks), `pdp.html` with that configuration baked in as `window.PDP_PRESET`, `data.js`, `README.txt`, the two PNGs and every asset. Open the zipped `pdp.html` over HTTP and you see exactly what was exported.
- State persists per browser (localStorage); the shell and the page keep each other in sync via postMessage.

## Figma source — Core PDP 2026 (`vVJJ1bgaTGCbGd68bsNiVT`)

| Node | What | Used for |
|---|---|---|
| 839-55750 | 03 Medium Banner - 1 | Buy The Set box under the colours (03-1) |
| 840-59075 | 04 Large Banner 1 | Outfit Module (04-1) under the BNPL box |
| 1038-44550 → 1038:45022 | Create The Look Modal — "Shop The Set" | Set builder sheet, Cards view (rows of cards, 24px checkbox, one pick per row, Size ▾, grey footer Total + ADD TO BAG (n)) |
| 606-56393 | Recs / Entry point board — 638:56822 · 638:57804 · 638:57872 | The Grey / Carousel / Grid formats of the recs module |
| 603-9148 | Create The Look — as is (+ 603:11959 Added to Bag) | Row/size behaviour, Added to Bag modal |
| 606-67916 | OOS flow — 1042:66804 notify me, 606:69277 Shop Similar Items | Stock states |

Other references: the August advanced-bundling prototype (entry-point families 03/04/06/07), the BHMM tech board (Compact set view: hero + rows of small thumbs, first row = the hoodie in its other colours), SKIMS (Inline "Complete The Look" band), Represent (Pairs well with row + list modal), Nike (Hotspot look carousel + View entire look).

## Live truth (captured 08 Sep 2026)

`capture/` holds the live boohooMAN PDP DOM dumps at 390 and 1440, the Algolia feed for `/categories/mens-premium-essentials` (`products-algolia.json`) and the Playwright script. Live mode replicates production: black 3-cell USP bar with red countdown + grey TAKE15 bar, breadcrumb, 66%-wide gallery slides with grey tags, light title, £35.00, NDD countdown, Body Fit, "Size : Select a Size" with 53px buttons (3XL+ greyed), ADD TO BAG + Apple Pay, PREMIER box, Deliver+, delivery/returns, Student, BNPL (DS badge PNGs), **Complete Your Purchase With** (production bundle list), Handpicked For You 3×2, At a Glance, accordions, We Think You'll Like, Recommendations, footer. Product URLs are `/product/<slug>?colour=<colour>`.

## Rules baked in

- **Icons:** fixed square boxes (12 / 16 / 24), `object-fit: contain` (or `none` for 24-grid glyphs at native size), `preserveAspectRatio="none"` stripped from every Figma-exported SVG. Header = production sizes (logo 106×15 / 141×20, 24px icons in 38×40 hit areas, 88px desktop row, 56px search pill) — also landed in the DS.
- **Selected size / fit** = 1px black keyline, weight unchanged. Wishlist = 44px round, shadow, 20px icon (production).
- **Recs module** = one component, formats per module. Shop The Look is the bundle one: Grey/Carousel/Grid open Create The Look; Inline and Hotspot buy in place. No wishlist on PDP recs cards.
- **Entry points:** 03 and 07 sit directly under the colours before Body Fit; 04 under BNPL; 06 = gallery end card; 03-3 under the buy buttons and opens the Pairs-well-with list, not the set builder.
- **USP (new format)** = single DS countdown banner (Black/Red variant). Colour scroller runs edge to edge.
- DS tokens/components are a **snapshot** from `debenhamsgroup.design/assets/ds` — re-copy when the DS moves.
