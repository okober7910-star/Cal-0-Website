/* Cal-0 progressive enhancements. Shopping and email links work without JS. */
(() => {
  "use strict";
  const config = window.CAL0_CONFIG || {};
  const email = config.email || "hello@cal-0.com";
  document.querySelectorAll("[data-current-year]").forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });
  if (config.salesEnabled === false) {
    document.querySelectorAll("[data-checkout-link]").forEach(link => {
      link.href = "mailto:" + email + "?subject=Cal-0%20order%20availability";
      link.textContent = "Ask about availability";
    });
  } else if (config.checkoutUrl) {
    try {
      const checkout = new URL(config.checkoutUrl);
      if (checkout.protocol === "https:" && checkout.hostname === "buy.stripe.com") {
        document.querySelectorAll("[data-checkout-link]").forEach(link => {
          link.href = checkout.href;
        });
      }
    } catch (_) { /* Preserve the working static checkout link. */ }
  }
  document.querySelectorAll("[data-gallery-link]").forEach(link => {
    link.addEventListener("click", event => {
      const image = document.querySelector("[data-product-image]");
      if (!image) return;
      event.preventDefault();
      image.src = link.getAttribute("href");
      image.alt = link.dataset.galleryAlt || "Cal-0 Mango Konjac Jelly";
      document.querySelectorAll("[data-gallery-link]").forEach(item => {
        item.removeAttribute("aria-current");
      });
      link.setAttribute("aria-current", "true");
    });
  });
  const list = document.querySelector("[data-store-list]");
  const stores = Array.isArray(config.stores) ? config.stores : [];
  const confirmedStores = stores.filter(store => {
    return store && store.confirmed === true && store.name && store.address;
  });
  if (list && confirmedStores.length) {
    const fragment = document.createDocumentFragment();
    confirmedStores.forEach(store => {
      const card = document.createElement("article");
      card.className = "store-card";
      const name = document.createElement("h3");
      name.textContent = store.name;
      const address = document.createElement("address");
      address.textContent = store.address;
      const directions = document.createElement("a");
      directions.className = "text-link";
      directions.href = "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(store.name + ", " + store.address);
      directions.textContent = "Get directions →";
      directions.target = "_blank";
      directions.rel = "noopener noreferrer";
      card.append(name, address, directions);
      fragment.append(card);
    });
    list.replaceChildren(fragment);
    list.hidden = false;
    const intro = document.querySelector("[data-stores-intro]");
    if (intro) intro.textContent = "Find Cal-0 at these confirmed locations. Contact the store before visiting to check current stock.";
  }
  const form = document.querySelector("[data-email-draft-form]");
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const topic = String(values.get("topic") || "General question");
      const body = [
        "Name: " + String(values.get("name") || ""),
        "Reply email: " + String(values.get("email") || ""),
        "Store / business: " + String(values.get("business") || ""),
        "", String(values.get("message") || "")
      ].join("\n");
      const draft = document.querySelector("[data-draft-link]");
      draft.href = "mailto:" + email + "?subject=" +
        encodeURIComponent("Cal-0: " + topic) + "&body=" + encodeURIComponent(body);
      draft.hidden = false;
      const notice = document.querySelector("[data-form-notice]");
      notice.textContent = "Your email draft is ready, but has not been sent. Click Open Email Draft and send it from your email app. You can also email us directly at " + email + ".";
      draft.focus();
    });
  }
})();

/* Restore the original image-rich experience without changing checkout. */
(() => {
  const images = [
    ["case-and-pouch.webp", "Cal-0 10-pack box and mango pouch", "10-Pack"],
    ["product-back-beach.webp", "Back of the Cal-0 mango pouch", "Back of Pouch"],
    ["product-benefits-alt.webp", "Cal-0 mango pouch and product benefits", "Product Benefits"],
    ["nutrition-label.webp", "Cal-0 Nutrition Facts", "Nutrition Facts"]
  ];
  const host = document.querySelector(".hero-photo") || document.querySelector(".rounded-photo:has([data-product-image])");
  if (host) {
    const track = document.createElement("div");
    track.className = "photo-track";
    track.id = "cal0-photo-track";
    track.tabIndex = 0;
    track.setAttribute("role", "region");
    track.setAttribute("aria-label", "Product photos. Swipe or use the thumbnail buttons.");
    const thumbs = document.createElement("div");
    thumbs.className = "photo-thumbs";
    const buttons = [];
    images.forEach((item, index) => {
      const slide = document.createElement("div");
      slide.className = "photo-slide";
      const picture = document.createElement("img");
      picture.src = "assets/images/" + item[0];
      picture.alt = item[1];
      picture.width = 800;
      picture.height = 800;
      if (index > 0) picture.loading = "lazy";
      slide.append(picture);
      track.append(slide);
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", "View " + item[2]);
      button.setAttribute("aria-controls", track.id);
      button.setAttribute("aria-pressed", String(index === 0));
      const thumb = document.createElement("img");
      thumb.src = picture.src;
      thumb.alt = "";
      thumb.width = 160;
      thumb.height = 160;
      thumb.loading = "lazy";
      button.append(thumb);
      button.addEventListener("click", () => {
        track.scrollTo({left: track.clientWidth * index, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
      });
      buttons.push(button);
      thumbs.append(button);
    });
    const controls = document.createElement("div");
    controls.className = "photo-controls";
    const status = document.createElement("span");
    status.textContent = "1 / 4";
    status.setAttribute("aria-live", "polite");
    [-1, 1].forEach(direction => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = direction < 0 ? "Previous" : "Next";
      button.setAttribute("aria-label", direction < 0 ? "Previous product photo" : "Next product photo");
      button.addEventListener("click", () => {
        const current = Math.round(track.scrollLeft / track.clientWidth);
        const next = (current + direction + images.length) % images.length;
        track.scrollTo({left: next * track.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
      });
      controls.append(button);
      if (direction < 0) controls.append(status);
    });
    track.addEventListener("scroll", () => {
      const current = Math.min(3, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
      buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === current)));
      status.textContent = (current + 1) + " / 4";
    }, {passive: true});
    host.replaceChildren(track, thumbs, controls);
    const oldNav = document.querySelector(".gallery-nav");
    if (oldNav) oldNav.remove();
  }
  const nutrition = document.querySelector(".nutrition-photo img");
  if (nutrition) {
    nutrition.src = "assets/images/nutrition-composite.webp";
    nutrition.alt = "Cal-0 mango pouch with full Nutrition Facts and ingredients";
    nutrition.width = 1254;
    nutrition.height = 1254;
    const link = nutrition.closest("a");
    if (link) link.href = nutrition.src;
    document.querySelectorAll('#nutrition a[href="assets/images/nutrition-label.webp"]').forEach(link => { link.href = "assets/images/nutrition-composite.webp"; });
  }
})();
/* Keep the retailer inquiry last, just above the footer. */
(() => {
 const main = document.querySelector("#main-content");
 const wholesale = document.querySelector("#wholesale");
 if (main && wholesale) main.append(wholesale);
})();
/* Retail locations supplied by the founder; addresses checked against public listings. */
(() => {
 const section = document.querySelector('#stores > .container');
 if (!section) return;
 const stores = [
  {name:'Windmill Farms', area:'Del Cerro', address:'6386 Del Cerro Blvd, San Diego, CA 92120'},
  {name:"Boney’s Bayside Market", area:'Coronado', address:'155 Orange Ave, Coronado, CA 92118'},
  {name:'Vine Ripe Market', area:'La Mesa', address:'8191 Fletcher Parkway, La Mesa, CA 91942'},
  {name:'KRISP', area:'Ocean Beach', address:'4976 Newport Ave, San Diego, CA 92107'}
 ];
 const maps = store => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(store.name + ', ' + store.address);
 const intro = section.querySelector('.section-heading .lead');
 if (intro) intro.textContent = 'Pick up Cal-0 at these local markets. Check with the store for current stock before visiting.';
 const featured = document.createElement('div');
 featured.className = 'featured-stores';
 featured.setAttribute('aria-label','Featured Cal-0 retailers');
 stores.forEach(store => {
  const link = document.createElement('a');
  link.href = maps(store); link.target = '_blank'; link.rel = 'noopener noreferrer';
  const name = document.createElement('strong'); name.textContent = store.name;
  const area = document.createElement('span'); area.textContent = store.area;
  link.append(name,area); featured.append(link);
 });
 const dropdown = section.querySelector('details');
 section.insertBefore(featured,dropdown);
 const photos = document.createElement('div'); photos.className = 'retail-photos';
 const base = 'https://raw.githubusercontent.com/okober7910-star/Cal-0-Website/71f93f856cef69169cb69f72e9efbf31d39eea6d/Cal-0%20Website/assets/images/';
 [
  ['C60350A5-6951-416A-9C4B-85C29963435E_1_105_c.jpeg','Cal-0 mango jelly pouches on a local market shelf'],
  ['CoronadoCal-0.jpeg','Cal-0 photographed in Coronado']
 ].forEach(photo => {
  const figure = document.createElement('figure'); const image = document.createElement('img');
  image.src = base + photo[0]; image.alt = photo[1]; image.loading = 'lazy';
  figure.append(image); photos.append(figure);
 });
 section.insertBefore(photos,dropdown);
 if (dropdown) dropdown.querySelector('summary').textContent = 'All Store Locations & Directions';
 const list = section.querySelector('[data-store-list]');
 if (list) {
  list.replaceChildren(); list.hidden = false;
  stores.forEach(store => {
   const card = document.createElement('article'); card.className = 'store-card';
   const name = document.createElement('h3'); name.textContent = store.name;
   const address = document.createElement('address'); address.textContent = store.address;
   const link = document.createElement('a'); link.className = 'text-link'; link.textContent = 'Get Directions';
   link.href = maps(store); link.target = '_blank'; link.rel = 'noopener noreferrer';
   card.append(name,address,link); list.append(card);
  });
 }
 const note = section.querySelector('[data-stores-intro]');
 if (note) note.textContent = 'Current listed locations. Product availability can vary by store.';
 const style = document.createElement('style');
 style.textContent = '.featured-stores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.featured-stores a{display:grid;gap:4px;padding:16px;border:2px solid #0F4D3F;border-radius:14px;line-height:1.35}.featured-stores strong{font-size:1.05rem}.featured-stores span{font-size:.85rem}.retail-photos{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}.retail-photos figure{overflow:hidden;border-radius:18px}.retail-photos img{width:100%;height:320px;object-fit:cover;object-position:center}.store-grid{grid-template-columns:repeat(2,minmax(0,1fr))}@media(max-width:720px){.featured-stores{grid-template-columns:repeat(2,minmax(0,1fr))}.retail-photos img{height:220px}.store-grid{grid-template-columns:1fr}}@media(max-width:420px){.retail-photos{grid-template-columns:1fr}}';
 document.head.append(style);
})();
/* Preserve the full uploaded photographs rather than cropping faces. */
document.querySelectorAll('.retail-photos img').forEach(image => {
 image.style.height = 'auto';
 image.style.aspectRatio = '4 / 3';
 image.style.objectFit = 'contain';
 image.style.background = '#EAF0DF';
});
/* Additional stockists belong in the dropdown, not duplicate featured retailers. */
(() => {
 const stores = document.querySelector('#stores');
 if (!stores) return;
 const details = stores.querySelector('details');
 const list = stores.querySelector('[data-store-list]');
 if (list) { list.replaceChildren(); list.hidden = true; }
 if (details) details.querySelector('summary').textContent = 'More Local Stores';
 const note = stores.querySelector('[data-stores-intro]');
 if (note) note.textContent = 'For additional convenience store and gas station stockists, contact us for current locations.';
})();
/* Founder-requested header and new real-world photography. */
(() => {
 document.querySelectorAll('.site-logo').forEach(logo => {
  logo.replaceChildren();
  const word = document.createElement('span'); word.className='brand-word'; word.textContent='Cal-0'; logo.append(word);
 });
 const base='https://raw.githubusercontent.com/okober7910-star/Cal-0-Website/main/Cal-0%20Website/assets/images/';
 const founder=document.querySelector('.founder-photo img');
 if(founder){founder.src=base+'4998EBAA-9C87-4F8B-8C02-428B6650AB24_1_105_c.jpeg';founder.alt='Oliver holding Cal-0 at Take-A-Bite';founder.width=768;founder.height=1024;}
 const pouch=document.querySelector('#about .rounded-photo img');
 if(pouch){pouch.src=base+'ED7DAB44-EDBB-43D4-AFBD-031344472FDF_1_105_c.jpeg';pouch.alt='The actual Cal-0 mango konjac jelly pouch held in hand';pouch.width=768;pouch.height=1024;}
 const style=document.createElement('style');
 style.textContent='.header-inner{display:grid;grid-template-columns:160px minmax(0,1fr) 160px;gap:12px}.site-logo{margin:0;justify-self:start}.brand-word{display:inline-block;font-family:Trebuchet MS,Arial,sans-serif;font-size:42px;line-height:1;font-weight:900;letter-spacing:-3px;color:#0F4D3F;font-style:normal}.main-nav{justify-self:center;justify-content:center;width:auto;gap:22px;order:initial;font-size:1rem}.header-inner>.button{justify-self:end}.founder-photo{max-width:360px}.founder-photo img{aspect-ratio:3/4;object-fit:cover;object-position:center 35%}#about .rounded-photo img{aspect-ratio:1;object-fit:cover;object-position:center 35%}@media(max-width:800px){.header-inner{grid-template-columns:1fr 1fr}.main-nav{grid-column:1/-1;grid-row:2;gap:16px;width:100%;font-size:.85rem}.header-inner>.button{grid-column:2;grid-row:1}.brand-word{font-size:36px}}';
 document.head.append(style);
})();
/* Public placement directory. No private contacts, payments or invoice details. */
(() => {
 const section=document.querySelector('#stores'); if(!section)return;
 const locations=[
 ['Windmill Farms','6386 Del Cerro Blvd, San Diego, CA 92120','placement'],
 ['Happy Liquor','2567 University Ave, San Diego, CA 92104','placement'],
 ['7-Eleven, Adams Avenue','3436 Adams Ave, San Diego, CA 92116','placement'],
 ['7-Eleven, Ohio Street','4687 Ohio St, San Diego, CA 92116','placement'],
 ['Chevron','2290 Camino Del Rio North, San Diego, CA','placement'],
 ["Adam’s Wine & Spirits",'','trial'],
 ['Take A Hike','7448 Jackson Dr, San Diego, CA 92119','placement'],
 ['Cheers Liquor & Deli','6983 Navajo Rd, San Diego, CA 92119','placement'],
 ["Keil’s Fresh Foods",'7403 Jackson Dr, San Diego, CA 92119','placement'],
 ['The Strand Liquor','600 Palm Ave, Imperial Beach, CA 91932','placement'],
 ["Monroe’s Market",'4502 Oregon St, San Diego, CA 92116','samples'],
 ['KRISP, Downtown','1427 First Ave, San Diego, CA 92101','placement'],
 ['Helix Liquor (Mama Liquor)','444 W Chase Ave, El Cajon, CA 92020','placement'],
 ["Liticker’s Liquor & Deli",'4955 Voltaire St, San Diego, CA 92107','placement'],
 ['OB Quick Stop Liquor','4984 Voltaire St, San Diego, CA 92107','placement'],
 ['One Stop Shop','5040 Newport Ave, San Diego, CA 92107','placement'],
 ['High Vibes Smoke Shop PB','4150 Mission Blvd, Ste 155, San Diego, CA 92109','placement'],
 ['OB Corner','4991 Newport Ave, San Diego, CA 92107','samples'],
 ['KRISP, Ocean Beach','4976 Newport Ave, San Diego, CA 92107','placement'],
 ["Boney’s Bayside Market",'155 Orange Ave, Coronado, CA 92118','placement'],
 ['7-Eleven, Balboa Avenue','7807 Balboa Ave, San Diego, CA 92111','placement'],
 ['7-Eleven, Clairemont Mesa West','7801 Clairemont Mesa Blvd, San Diego, CA 92111','placement'],
 ['7-Eleven, Clairemont Mesa East','9187 Clairemont Mesa Blvd, San Diego, CA 92123','placement'],
 ['7-Eleven, Mesa College Drive','7488 Mesa College Dr, San Diego, CA 92111','placement'],
 ['7-Eleven, Mission Gorge 5829','5829 Mission Gorge Rd, San Diego, CA 92120','placement'],
 ['7-Eleven, Mission Gorge 6401','6401 Mission Gorge Rd, San Diego, CA 92120','placement'],
 ['7-Eleven, Mission Gorge 7427','7427 Mission Gorge Rd, San Diego, CA 92120','placement'],
 ['Shell','4794 Voltaire St, San Diego, CA 92107','placement'],
 ["Pat’s Liquor Store",'5096 Voltaire St, San Diego, CA 92107','placement'],
 ['7-Eleven, Midway 3185','3185 Midway Dr, San Diego, CA 92110','samples'],
 ['7-Eleven, Sports Arena','3146 Sports Arena Blvd, San Diego, CA 92110','placement'],
 ['7-Eleven, Midway 2387','2387 Midway Dr, San Diego, CA 92110','placement'],
 ['7-Eleven, University Avenue','2404 University Ave, San Diego, CA 92104','placement'],
 ['7-Eleven, El Cajon Boulevard','1995 El Cajon Blvd, San Diego, CA 92104','limited'],
 ['7-Eleven, Garnet Avenue','1305 Garnet Ave, San Diego, CA 92109','limited'],
 ['7-Eleven, Voltaire 4205','4205 Voltaire St, San Diego, CA 92107','limited'],
 ['Vine Ripe Market','8191 Fletcher Pkwy, La Mesa, CA 91942','samples']
 ];
 const heading=section.querySelector('h2');if(heading)heading.textContent='Cal-0 near you.';
 const intro=section.querySelector('.section-heading .lead');
 const trials=locations.filter(row=>row[2]==='samples').length;
 if(intro)intro.textContent=locations.length+' local placements across markets, convenience stores, liquor stores and gas stations, including '+trials+' sample-only locations. Check current stock before visiting.';
 const details=section.querySelector('details');
 if(details)details.querySelector('summary').textContent='View All Stores, Convenience Stores & Stations ('+locations.length+')';
 const note=section.querySelector('[data-stores-intro]');
 if(note)note.textContent='Placement list updated October 7, 2026. Sample and limited trial locations are marked below; placement does not guarantee current shelf stock.';
 const list=section.querySelector('[data-store-list]');if(!list)return;
 list.replaceChildren();list.hidden=false;
 locations.forEach(row=>{
  const card=document.createElement('article');card.className='store-card';
  const name=document.createElement('h3');name.textContent=row[0];
  const address=document.createElement('address');address.textContent=row[1]||'Address confirmation pending';
  const label=document.createElement('p');label.className='small';
  label.textContent=row[2]==='samples'?'Samples only; retail stock not confirmed':row[2]==='limited'?'Limited introductory placement; call before visiting':row[2]==='trial'?'Trial case placed; check availability':'Product placed; check current stock';
  card.append(name,address,label);
  if(row[1]){const link=document.createElement('a');link.className='text-link';link.textContent='Get Directions';link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(row[0]+', '+row[1]);link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
  list.append(card);
 });
 const vine=section.querySelector('.featured-stores a:nth-child(3) span');if(vine)vine.textContent='La Mesa · Trial samples';
})();
/* Review: concise availability wording, fifth featured market and compact story. */
(() => {
 const section=document.querySelector('#stores');
 if(section){
  const intro=section.querySelector('.section-heading .lead');
  if(intro)intro.textContent='Find Cal-0 across 37 local placement locations, from neighborhood markets to convenience stores and gas stations. Contact the store to check availability before visiting.';
  const note=section.querySelector('[data-stores-intro]');
  if(note)note.textContent='Locations from our October 7, 2026 placement report. Availability varies; contact the store before visiting.';
  section.querySelectorAll('.store-card .small').forEach(label=>{label.textContent='Contact the store for current availability';});
  const vine=section.querySelector('.featured-stores a:nth-child(3) span');if(vine)vine.textContent='La Mesa';
  const featured=section.querySelector('.featured-stores');
  if(featured){
   const link=document.createElement('a');link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent("Keil's Fresh Foods, 7403 Jackson Dr, San Diego, CA 92119");link.target='_blank';link.rel='noopener noreferrer';
   const name=document.createElement('strong');name.textContent='Keil’s Fresh Foods';
   const area=document.createElement('span');area.textContent='San Carlos';
   link.append(name,area);featured.append(link);
  }
 }
 const pouch=document.querySelector('#about .rounded-photo img');
 if(pouch){pouch.src='assets/images/product-front-beach.webp';pouch.alt='Cal-0 mango konjac jelly pouch on a tropical beach';pouch.width=800;pouch.height=800;}
 const style=document.createElement('style');
 style.textContent='.featured-stores{grid-template-columns:repeat(5,minmax(0,1fr))}#story .founder-grid{grid-template-columns:260px minmax(0,1fr);gap:32px;max-width:980px;align-items:center}#story .founder-photo{width:260px;max-width:100%}#story .founder-photo img{aspect-ratio:4/5;object-fit:cover;object-position:center 32%}#story h2{font-size:clamp(2rem,3vw,2.8rem);margin-bottom:16px}#story p{margin-bottom:14px}#story .lead{font-size:1.1rem}#story.section{padding-block:14px}#about .rounded-photo img{object-fit:contain;aspect-ratio:1}@media(max-width:900px){.featured-stores{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:720px){#story .founder-grid{grid-template-columns:1fr;gap:18px}#story .founder-photo{width:230px}.featured-stores{grid-template-columns:repeat(2,minmax(0,1fr))}}';
 document.head.append(style);
})();
/* Final design review: one retailer row and a compact Instagram invitation. */
(() => {
 const style=document.createElement('style');
 style.textContent='#stores .featured-stores{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:12px;padding-bottom:5px;scroll-snap-type:x proximity}#stores .featured-stores a{flex:1 0 0;min-width:155px;scroll-snap-align:start;padding:14px;box-sizing:border-box}#stores .featured-stores strong{font-size:.95rem}#about .split{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);max-width:1040px;gap:28px;align-items:center}#about .rounded-photo{width:100%;max-width:340px}#about .steps{margin:14px 0}#about .steps li{padding-block:5px}#about .lead{font-size:1.1rem}#about h2{font-size:clamp(2rem,3vw,2.8rem);margin-bottom:16px}.instagram-strip{padding:22px 0}.instagram-inner{border-top:1px solid #D6DED3;border-bottom:1px solid #D6DED3;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 0}.instagram-inner h2{font-size:1.6rem;margin-bottom:8px}.instagram-inner p{margin:0;font-size:1rem}@media(max-width:720px){#about .split{grid-template-columns:1fr;gap:18px}#about .rounded-photo{max-width:300px}.instagram-inner{align-items:flex-start;flex-direction:column}#stores .featured-stores a{min-width:170px}}';
 document.head.append(style);
 const main=document.querySelector('#main-content');
 const wholesale=document.querySelector('#wholesale');
 if(main){
  const section=document.createElement('section');section.className='instagram-strip';
  const container=document.createElement('div');container.className='container instagram-inner';
  const copy=document.createElement('div');
  const title=document.createElement('h2');title.textContent='Follow along on Instagram.';
  const text=document.createElement('p');text.textContent='New store stops, pouch moments and updates from Cal-0.';
  copy.append(title,text);
  const link=document.createElement('a');link.className='button button-outline';link.href='https://www.instagram.com/cal_0_llc/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Follow @cal_0_llc';
  container.append(copy,link);section.append(container);main.insertBefore(section,wholesale);
 }
})();
/* Neighborhood directory and restrained bold accents; preserve approved layout. */
(() => {
 const list=document.querySelector('#stores [data-store-list]');
 if(list){
  const groups=[
   ['Ocean Beach',["Liticker’s Liquor & Deli",'OB Quick Stop Liquor','One Stop Shop','OB Corner','KRISP, Ocean Beach','Shell',"Pat’s Liquor Store",'7-Eleven, Voltaire 4205']],
   ['North Park & University Heights',['Happy Liquor','7-Eleven, Adams Avenue','7-Eleven, Ohio Street',"Monroe’s Market",'7-Eleven, University Avenue','7-Eleven, El Cajon Boulevard']],
   ['Pacific Beach',['High Vibes Smoke Shop PB','7-Eleven, Garnet Avenue']],
   ['Midway & Sports Arena',['7-Eleven, Midway 3185','7-Eleven, Sports Arena','7-Eleven, Midway 2387']],
   ['Clairemont & Kearny Mesa',['7-Eleven, Balboa Avenue','7-Eleven, Clairemont Mesa West','7-Eleven, Clairemont Mesa East','7-Eleven, Mesa College Drive']],
   ['Del Cerro, San Carlos & Mission Gorge',['Windmill Farms','Take A Hike','Cheers Liquor & Deli',"Keil’s Fresh Foods",'7-Eleven, Mission Gorge 5829','7-Eleven, Mission Gorge 6401','7-Eleven, Mission Gorge 7427']],
   ['Mission Valley',['Chevron']],
   ['Downtown',['KRISP, Downtown']],
   ['Coronado',["Boney’s Bayside Market"]],
   ['Imperial Beach',['The Strand Liquor']],
   ['La Mesa',['Vine Ripe Market']],
   ['El Cajon',['Helix Liquor (Mama Liquor)']],
   ['Location to confirm',["Adam’s Wine & Spirits"]]
  ];
  const cards=Array.from(list.querySelectorAll('.store-card'));
  const lookup=new Map(cards.map(card=>[card.querySelector('h3').textContent,card]));
  list.replaceChildren();list.classList.add('neighborhood-directory');
  groups.forEach(([area,names])=>{
   const matched=names.map(name=>lookup.get(name)).filter(Boolean);if(!matched.length)return;
   const group=document.createElement('details');group.className='neighborhood-group';
   const summary=document.createElement('summary');summary.textContent=area+' ('+matched.length+')';
   const grid=document.createElement('div');grid.className='neighborhood-cards';
   matched.forEach(card=>{grid.append(card);lookup.delete(card.querySelector('h3').textContent);});
   group.append(summary,grid);list.append(group);
  });
  if(lookup.size){const group=document.createElement('details');group.className='neighborhood-group';const title=document.createElement('summary');title.textContent='Other locations';const grid=document.createElement('div');grid.className='neighborhood-cards';lookup.forEach(card=>grid.append(card));group.append(title,grid);list.append(group);}
 }
 const style=document.createElement('style');
 style.textContent='#stores .neighborhood-directory{display:block}#stores .neighborhood-group{margin:10px 0;border:1px solid #C7D4CB;border-radius:12px;overflow:hidden;background:#FFFAF0}#stores .neighborhood-group>summary{padding:15px 18px;font-size:1rem;font-weight:800;color:#0F4D3F}#stores .neighborhood-group[open]>summary{background:#0F4D3F;color:#FFFAF0}#stores .neighborhood-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px}#stores .neighborhood-cards .store-card{margin:0;border:1px solid #D6DED3;border-radius:12px;padding:18px}#stores .store-status>summary{font-weight:900;font-size:1.12rem}#stores .store-status{border:2px solid #0F4D3F}#main-content h2{font-weight:850;letter-spacing:-.045em}#main-content .eyebrow{font-weight:850;display:inline-block;border-bottom:3px solid #F2B331;padding-bottom:5px}#story .founder-grid{border-left:5px solid #0F4D3F;padding-left:24px}#main-content .instagram-inner{background:#0F4D3F;color:#FFFAF0;padding:24px;border:0;border-radius:18px}#main-content .instagram-inner h2,#main-content .instagram-inner p{color:#FFFAF0}#main-content .instagram-inner .button{background:#FFFAF0;color:#0F4D3F;border-color:#FFFAF0}.button:not(.button-outline){font-weight:800}.photo-thumbs button[aria-pressed="true"]{border-width:3px}.featured-stores a:hover{background:#0F4D3F;color:#FFFAF0}@media(max-width:720px){#stores .neighborhood-cards{grid-template-columns:1fr;padding:12px}#story .founder-grid{padding-left:16px}#main-content .instagram-inner{padding:20px}}';
 document.head.append(style);
})();
/* Final neighborhood correction and subtly richer cream palette. */
(() => {
 const directory=document.querySelector('.neighborhood-directory');
 if(directory){
  const groups=Array.from(directory.querySelectorAll('.neighborhood-group'));
  const destination=groups.find(group=>group.querySelector('summary').textContent.startsWith('North Park & University Heights'));
  const source=groups.find(group=>group.querySelector('summary').textContent.startsWith('Location to confirm'));
  if(destination && source){
   const card=Array.from(source.querySelectorAll('.store-card')).find(card=>card.querySelector('h3').textContent==='Adam’s Wine & Spirits');
   if(card){destination.querySelector('.neighborhood-cards').append(card);source.remove();destination.querySelector('summary').textContent='North Park, University Heights & Kensington ('+destination.querySelectorAll('.store-card').length+')';}
  }
 }
 const style=document.createElement('style');
 style.textContent=':root{--cream:#F6EFDF}body{background:#F6EFDF}.site-header{background:#F6EFDF}#main-content .hero,#main-content .story-section,#main-content .faq-section,#main-content .wholesale-section{background:#F6EFDF}#main-content #about{background:#F0E7D3}#main-content #nutrition{background:#F0E7D3}#stores .featured-stores a{background:#F3EBD9}#stores .neighborhood-group{background:#F6EFDF}#stores .neighborhood-cards .store-card{background:#FAF5EB}#main-content .facts{border-top-width:3px;border-bottom-width:3px}#main-content .eyebrow{border-bottom-width:4px}#main-content .instagram-inner{background:#0C4236}';
 document.head.append(style);
})();
/* Supplied customer quotes and a single-row header. */
(() => {
 const about=document.querySelector('#about');
 if(about && !document.querySelector('.customer-quotes')){
  const section=document.createElement('section');section.className='customer-quotes';section.setAttribute('aria-label','Customer quotes');
  const inner=document.createElement('div');inner.className='container quote-row';
  ['Incredible Mango Flavor','The best Konjac Jelly I have ever had.'].forEach(text=>{const quote=document.createElement('blockquote');quote.textContent='“'+text+'”';inner.append(quote);});
  section.append(inner);about.before(section);
 }
 const style=document.createElement('style');
 style.textContent='.customer-quotes{padding:18px 0;background:#F0E7D3}.quote-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center}.quote-row blockquote{margin:0;padding:12px 18px;border-left:3px solid #F2B331;font-size:clamp(1rem,1.6vw,1.25rem);font-weight:800;line-height:1.45}.site-header .header-inner{grid-template-columns:125px minmax(0,1fr) 145px;column-gap:12px}.site-header .header-inner .main-nav{grid-column:2;grid-row:1;order:initial;position:static;top:auto;width:100%;min-width:0;flex-wrap:nowrap;gap:16px;justify-content:center;font-size:.9rem}.site-header .header-inner .main-nav a{white-space:nowrap;flex-shrink:0}.site-header .header-inner>.button{grid-column:3;grid-row:1}@media(max-width:800px){.site-header .header-inner{grid-template-columns:90px minmax(0,1fr) 120px;column-gap:10px}.site-header .brand-word{font-size:34px}.site-header .header-inner .main-nav{gap:12px;font-size:.8rem;overflow-x:auto;justify-content:flex-start;scrollbar-width:thin}.site-header .header-inner>.button{font-size:.78rem;padding:10px 12px}}@media(max-width:480px){.site-header .header-inner{grid-template-columns:70px minmax(0,1fr) 105px;column-gap:8px}.site-header .brand-word{font-size:30px}.quote-row{grid-template-columns:1fr;gap:4px}.quote-row blockquote{padding:10px 14px}}';
 document.head.append(style);
})();
