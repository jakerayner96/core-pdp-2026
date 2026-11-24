# Core PDP 2026 — boohooMAN

Master PDP prototype for the boohooMAN ask: **Shop The Look recommendations → Create The Look**, **advanced bundling → Shop The Set builder** on the Premium Essentials collection, **complete-the-look patterns** (Pairs well with, inline band, hotspot look), and **OOS notify me**. Packaged as a **configurator** stakeholders can drive themselves and export from.

- **Configurator:** `index.html` (serve from repo root: `python3 -m http.server 3010`, assets need HTTP)
- **Other fascias (live recreation):** `live.html?brand=debenhams|boohoo|plt|karenmillen|dorothyperkins|coast` — the brand chips in the configurator load it. Built by the shared **live-PDP module** (`live-pdp.css` + `live-pdp.js` + `brands-live.js`, assets under `assets/live/`), identical copies of which power the PDP in the Virtual Stylist prototype (jakerayner96/vto-prototype). It recreates what is live today (10 Sep 2026 captures): header + USP strips, gallery, buy block with edge-to-edge size row, membership box (Premier / Premier Club / Royalty / Debenhams Unlimited), Deliver+, delivery & returns, BNPL, recommendation grid + carousels, description, footer. No new-format or bundling options for those fascias — boohooMAN stays the configurable page.
- **Page:** `pdp.html` — single file, no build. `data.js` = the live Premium Essentials catalogue (40 SKUs, 8 families).
- **Repo:** github.com/jakerayner96/core-pdp-2026 · **Pages:** jakerayner96.github.io/core-pdp-2026

## Final designs (23 Nov 2026)

The options are gone: the page is what was decided, the left panel is a **showcase** of its screens. Three things stay switchable because both are to be shown: the **customer** (logged out / logged in) and the **size recommender** look (hanger icon / fit scale) in each direction. The shell URL holds the state (`?brand=boohooman&w=390&login=0&srec=hanger&dir=up&scene=pdp`), so copy it to share a screen.

| Screen (`scene`) | What it shows |
|---|---|
| `pdp` | Default PDP — Washed Navy Zip Up Hoodie, in stock |
| `tabs` | Product tabs (DS `.ptabs`, Figma 1367:35397): 12px chips, 8 / 14 padding, radius 4, black selected, #E7E7E7 keyline, top of the buy block |
| `srec` | Size recommender (DS `.srec`): hanger (`icons-hanger-size-up/-down`) or fit scale (`.srec--scale`, marker at Runs Small / Runs Large, never the middle) |
| `set` | Shop The Set (Figma 1319:20398): Made To Match box (Figma 1440:76563: Made To Match · Shop sets) → compact set builder; the size is a **native select** |
| `set-notify` | An out-of-stock size reads **“M - Notify Me”**. Logged in: the row says “You’ll be notified when it’s available” (DS `.ntf-note`) straight away. Logged out: the DS **Notify Me** modal opens over the set builder with the email field. A notify pick stays ticked but isn’t counted in the total / Add to bag |
| `set-notify-again` | Guest who already gave an email this session (on any product): the email is kept (sessionStorage) and used for every later Notify Me — no modal in Shop The Set, no email field on the PDP. Shown on the zip hoodie in **“3XL - Notify Me”** after the tee in M |

**Shop The Set options (left panel, 23 Nov):** Rows **By product** (row title, then that product's colours) or **By colour** (`set=colour`: each row is one colour with every product of the set in it, no title; the picked line names the product — T-Shirt, Zip Up Hoodie). **Colour swatch** (`sw=1`, rows by product): the DS PLP swatch (`.pc-swatch`, 20 rounded square) before the colour on the picked line.
| `look` | Shop The Look: a normal recs carousel of the pieces in the product image (DS Product carousel); a tap opens that product’s PDP (in the colour its swatch shows) |
| `oos-gone` | Out of stock, not being reordered (Figma 1368:47272) — Washed Navy Wide Leg Jogger: name · price · **Out Of Stock**, then an endless grid of similar items |
| `oos-restock` | Out of stock, being reordered (Figma 1368:47445) — Washed Navy T-Shirt: every size carries the bell |
| `oos-restock-size` | …size picked: “Get notified when it’s back in stock?” (logged out: email + NOTIFY ME + consent · logged in: “You’ll be notified when it’s available” straight away, 24 Nov), then the endless similar grid |

## Experiences (24 Nov 2026)

Top of the left panel: **Bundles** (`exp=set`, everything above — the Washed Navy tracksuit, product tabs, Made To Match, Shop The Set) or **Create the Look** (`exp=look`).
Create the Look is the Figma section *CREATE THE LOOK - OOS* (1368:47152): the **Extreme Washed Bleached Boxy Denim Jacket** PDP (1368:47157) — no product tabs, no Made To Match box, no size recommender / model line / Body Fit / Premier / Student; Colour above the sizes; now · was · Save X%. **Shop The Look** (under BNPL) is the exact pieces in the product image: jacket · jeans · It’s Coming Home tee. A tap opens that PDP: in stock (jacket, jeans) → its PDP; the tee is out of stock — `tee=gone` (not being reordered: Out Of Stock, no alerts, 1368:47272) or `tee=restock` (being reordered: every size carries the bell, pick one → email + NOTIFY ME, or logged in “You’ll be notified”, 1368:47359 / 1368:47445). Both then scroll into the endless Shop Similar Items grid (1368:47342).

| Screen (`scene`) | What it shows |
|---|---|
| `ctl` | Denim jacket PDP, in stock (M sold out for good: struck through, no bell) |
| `ctl-look` | Shop The Look carousel (jacket · jeans · tee) |
| `ctl-jeans` | Tap a piece in stock → the jeans PDP |
| `ctl-oos-gone` | Tap the tee, not being reordered |
| `ctl-oos-restock` | Tap the tee, being reordered |
| `ctl-oos-size` | …size 8 picked: notify (guest email / logged-in line) |

Data: `ctl.js` (`window.CTL_PRODUCTS`), images `img/ctl/` from the Figma frames. Figma’s cards are placeholders, so the **jeans and the six similar tees have stand-in names and prices** — swap in the real SKUs when we have them.

- **Stock** is per product now (`OOS` in `pdp.html`: `CMM29657` gone, `CMM29620` restock); sizes come from the live feed (`data.js sizes[]`) — anything else is out of stock with the bell. Products that aren’t coming back leave the set builder.
- **Shop Similar Items**: its own family first, then the nearest families, then the range; 15 cards at a time as the end comes into view (DS Product carousel grid — 3 across mobile, 5 desktop). Footer and the rest of the PDP are hidden under it.
- **Rails** (Shop The Look, Handpicked For You grid, We Think You’ll Like, Shop Similar Items) are the DS Product carousel (`assets/ds/carousel.js`), as in debenhamsgroup.design/projects/product-carousel.
- **DS**: tokens / components / carousel.js / icons/lib copied from debenhamsgroup.design on 23 Nov 2026 (was an 8 Sep snapshot). New in the DS for this: Product tabs, Size recommender, the notified line `.ntf-note`.
- Still in `pdp.html` but no longer offered: the other entry points and recs formats, edit-layout mode.

## Figma export — all screens, all states, as components (`NP51VuDk959arTzzTr9cBo`)

https://www.figma.com/design/NP51VuDk959arTzzTr9cBo — built 18 Sep 2026 straight from the rendered DOM of `pdp.html` (Playwright → node tree → Figma Plugin API), so every frame is pixel-exact to the code at 390 and 1440: Montserrat, real product imagery, DS icons as components. Pages: **Screens — Mobile** / **Screens — Desktop** (19 states each: default, entry 09-3, entry off, OOS notify, some sizes OOS, size selected, recommender down/off, tabs off, six Shop The Look layouts, Pairs well with, look off, Handpicked grid, WTYL grid), **Overlays** (Shop The Set compact + cards, Complete The Look, Pairs well with, Size Guide, Added to Bag — `Device = Mobile / Desktop` variant sets), **Components — Mobile / Desktop** (one component per block; blocks with states are `State = …` variant sets), **Icons**, **README**.

Regenerate after a code change (`python3 -m http.server 3010` in the repo root first):

```
PW=<path to playwright> node figma/extract.mjs 390 all && node figma/extract.mjs 1440 all   # DOM → figma/out/<width>/*.json
node figma/build.mjs icons                    # SVG icon list → upload_assets → figma/chunks/icons.json
node figma/build.mjs plan 390 --limit 34000   # → figma/chunks/390/components-*.js, overlays-*.js, manifest.json
node figma/build.mjs plan 1440 --limit 34000
node figma/build.mjs componentise "Components — Mobile"   # prints the use_figma code
node figma/build.mjs screens 390 / 1440                    # assembles the screens from component instances
```

Each chunk is a self-contained `use_figma` script (runtime + data); run them in order on the named page, then componentise, then screens, then upload the `img: <file> · <fit>` placeholder rectangles with `upload_assets` and copy the image hashes to the same-named rectangles. `figma/out/` is derived and not committed.

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
- **Buy block order (MAN, new format, 18 Sep):** product tabs (solid pills at the top of the buy block, below the gallery pagination; on by default, keep their scroll position) → product name (no brand line) → price → NDD countdown → Body Fit → Size (+ recommender + model line) → Colour → buy buttons → set entry point → Premier. (15 Sep had Size before Body Fit, and the tabs and the entry point between Colour and the buttons.) Live mode still mirrors production.
- **USP (new format)** = single DS countdown banner (Black/Red variant). Colour scroller runs edge to edge.
- DS tokens/components/carousel.js are copied from `debenhamsgroup.design/assets/ds` (23 Nov 2026) — re-copy when the DS moves.
