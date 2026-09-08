# Core PDP 2026 — boohooMAN

Master PDP prototype for the boohooMAN ask: **Shop The Look recommendations → Create The Look**, and **advanced bundling → Shop The Set builder** on the Premium Essentials collection, plus **OOS notify me**. Same review format as the PLP work (P-05): black strip + iframed page with a live ⇄ new switch and a width resizer.

- **Review shell:** `index.html` (serve from repo root: `python3 -m http.server 3000`, assets need HTTP)
- **Page:** `pdp.html` — single file, no build. `data.js` = the live Premium Essentials catalogue.
- **Repo:** github.com/jakerayner96/core-pdp-2026 · **Pages:** jakerayner96.github.io/core-pdp-2026

## Figma source — Core PDP 2026 (`vVJJ1bgaTGCbGd68bsNiVT`)

| Node | What | Used for |
|---|---|---|
| 839-55750 | 03 Medium Banner - 1 (full PDP) | Buy The Set box under the buy buttons (03-1) |
| 840-59075 | 04 Large Banner 1 (full PDP) | Outfit Module (04-1) — grey-05, caption "Shop Sets / 3 matching pieces / LAUNCH SET BUILDER" |
| 1038-44550 → 1038:45022 | Mobile PDP · Create The Look Modal — "Shop The Set" | The set builder sheet (rows per family, 24px checkbox, one pick per row, dimmed siblings, Size ▾, grey footer Total + ADD TO BAG (n)) |
| 606-56393 | Recs / Entry point board — 638:56822 Buy The Outfit (no data, grey-05) · 638:57804 Reccs carousel (with data) · 638:57872 Reccs grid | The three Shop The Look module variants |
| 603-9148 | Create The Look — as is (flow + 603:11959 Added to Bag) | Row/size behaviour, Added to Bag modal |
| 606-67916 | OOS flow — 1042:66804 notify me, 606:69277 Shop Similar Items | Stock states |

Entry-point families 01 / 06 / 07 come from the August prototype (`PROTOTYPES/advanced-bundling-prototype`) — 03 and 04 are the ones in play; the rest are kept in the selector for reference.

## Live truth (captured 08 Sep 2026)

`capture/` holds the live boohooMAN PDP DOM dumps at 390 and 1440 (`live-pdp-*-dom.txt`), the Algolia product feed for `/categories/mens-premium-essentials` (`products-algolia.json`, 40 SKUs, 8 families × up to 6 colours) and the Playwright script. PNGs are gitignored.

Live mode replicates production: black 3-cell USP bar with red countdown + grey TAKE15 bar, breadcrumb, 66%-wide gallery slides with grey overlay tags, light-weight title, £35.00, NDD countdown, "Size : Select a Size" with 53px buttons (3XL+ greyed), ADD TO BAG + Apple Pay, PREMIER box, Deliver+, delivery/returns box, Student box, BNPL, **Complete Your Purchase With** (the production bundle list), Handpicked For You 3×2, At a Glance, accordions, We Think You'll Like, Recommendations links, footer. Product URLs on the platform are `/product/<slug>?colour=<colour>`.

## Shell controls

- **Live now ⇄ New format**
- **Shop The Look module:** carousel — no data (grey, per the brief: this one opens Create The Look) · carousel — with data · grid · off
- **Set entry point:** 03-1/03-2 · 04-1…04-4 · 06-1 · 07-1…07-6 · 01 pills (parked) · none — every one opens **Shop The Set**
- **Stock:** in stock · some sizes OOS (M/L + 3XL+ show the bell; picking one swaps the buy block for notify me) · product OOS (Out of Stock label, notify me, Shop Similar Items grid; look module + entry points hidden)
- **⚙ Set rows:** which Premium Essentials families the set builder shows (default Zip Hoodies · Sweatshirts · T-Shirts · Wide Leg Joggers). Create The Look is a fixed 3-tier look (Zip Hoodie · Wide Leg Jogger · T-Shirt), colour-matched to the hero.
- Width presets 390 → 1440 + drag handle. Desktop (≥1024) = thumbs + main image left, buy panel right, live-style header with search + category nav.

## Decisions / assumptions

- New format runs the DS single USP strip (P-05 decision), breadcrumb drops Home and never wraps.
- Colour selector in new format = the hoodie family's other colours as 60×89 thumbnails (they are separate SKUs on the platform, so live shows no swatches). Picking one swaps the hero.
- One selection per row in the builder; choosing a size ticks that card and unticks the previous one (Figma note). ADD TO BAG flags any ticked item without a size in red.
- Notify me needs a valid email + the consent tick; success state = "You'll be notified…" + Stock Alert Enabled toast.
- DS tokens/components are a **snapshot** copied from `debenhamsgroup.design/assets/ds` on 08 Sep — re-copy when the DS moves.
