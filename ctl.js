/* Create the Look experience (Jake 24 Nov 2026, Figma vVJJ1bgaTGCbGd68bsNiVT section 1368:47152 "CREATE THE LOOK - OOS").
   The PDP is the Extreme Washed Bleached Boxy Denim Jacket (1368:47157); Shop The Look = the pieces in its product image
   (jacket · jeans · It's Coming Home tee). The tee is the out-of-stock piece: not being reordered (1368:47272) or being reordered (1368:47359 / 1368:47445).
   Images are the Figma frames' own product shots (img/ctl/). Figma's cards are placeholders ("Brand Name · Product name · £0.00"), so the jeans and the
   similar tees carry stand-in names and prices — swap them for the real SKUs when we have them. */
window.CTL_PRODUCTS=[
  {id:'CTLJ01',fam:'ctl-jacket',name:'Extreme Washed Bleached Boxy Denim Jacket',colour:'Bleached Blue',price:16,was:40,
   allSizes:['XS','S','M','L','XL'],sizes:['XS','S','L','XL'],strike:true, // M sold out and not coming back: struck through, no bell (Figma Size Button "Out of Stock")
   img:'img/ctl/jacket-1.jpg',img2:'img/ctl/jacket-2.jpg',gallery:['img/ctl/jacket-1.jpg','img/ctl/jacket-2.jpg'],sw:'img/ctl/jacket-1.jpg',
   crumb:['Denim','Denim Jackets'],
   glance:['Extreme washed, bleached finish','Boxy, cropped fit','Rigid 100% cotton denim'],
   desc:'A boxy denim jacket with an extreme bleached wash that fades from the chest out to deep blue sleeves. Cropped at the waist, with chest pockets and a classic button front — wear it with the matching bleached jeans for the full look.'},
  {id:'CTLJ02',fam:'ctl-jeans',name:'Extreme Washed Bleached Baggy Jeans',colour:'Bleached Blue',price:28,was:40,
   allSizes:['28','30','32','34','36'],sizes:['28','30','32','34','36'],
   img:'img/ctl/jeans-1.jpg',gallery:['img/ctl/jeans-1.jpg'],sw:'img/ctl/jeans-1.jpg',
   crumb:['Denim','Jeans'],
   glance:['Extreme washed, bleached finish','Baggy, wide leg','Rigid 100% cotton denim'],
   desc:'Baggy wide-leg jeans in the same extreme bleached wash as the boxy denim jacket, stacking at the ankle.'},
  {id:'CTLT01',fam:'ctl-tee',name:'Regular It’s Coming Home Print T-Shirt',colour:'Ecru',price:38.5,was:55,
   allSizes:['8','10','12','14','16'],sizes:[], // out of stock — not being reordered or being reordered (panel: S.teeStock)
   img:'img/ctl/tee-1.jpg',img2:'img/ctl/tee-2.jpg',gallery:['img/ctl/tee-1.jpg','img/ctl/tee-2.jpg'],sw:'img/ctl/tee-1.jpg',
   crumb:['T-Shirts','Printed T-Shirts'],
   glance:['It’s Coming Home print','Regular fit','Soft cotton jersey'],
   desc:'A regular-fit T-shirt in soft ecru jersey with the It’s Coming Home print.'},
  /* Shop Similar Items (the endless grid under both out-of-stock PDPs, Figma 1368:47342) — 6 shots that repeat as the grid loads */
  {id:'CTLS01',fam:'ctl-sim',name:'Oversized Boxy Heavyweight T-Shirt',colour:'Ecru',price:12,was:18,img:'img/ctl/sim-1.jpg',sw:'img/ctl/sim-1.jpg'},
  {id:'CTLS02',fam:'ctl-sim',name:'Oversized Textured Rib T-Shirt',colour:'White',price:14,was:20,img:'img/ctl/sim-2.jpg',sw:'img/ctl/sim-2.jpg'},
  {id:'CTLS03',fam:'ctl-sim',name:'Regular Fit Pique T-Shirt',colour:'Ecru',price:10,was:16,img:'img/ctl/sim-3.jpg',sw:'img/ctl/sim-3.jpg'},
  {id:'CTLS04',fam:'ctl-sim',name:'Oversized Boxy Waffle T-Shirt',colour:'White',price:15,was:22,img:'img/ctl/sim-4.jpg',sw:'img/ctl/sim-4.jpg'},
  {id:'CTLS05',fam:'ctl-sim',name:'Regular Fit Heavyweight T-Shirt',colour:'Stone',price:12,was:18,img:'img/ctl/sim-5.jpg',sw:'img/ctl/sim-5.jpg'},
  {id:'CTLS06',fam:'ctl-sim',name:'Oversized Boxy Textured T-Shirt',colour:'Cream',price:14,was:20,img:'img/ctl/sim-6.jpg',sw:'img/ctl/sim-6.jpg'},
];
