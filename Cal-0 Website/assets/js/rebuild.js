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
  const list = document.querySelector("[data-store-list]:not([data-static-store-directory])");
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
    ["case-and-pouch.webp?v=cal0-images-20261025", "Cal-0 10-pack box and mango pouch", "10-Pack"],
    ["product-back-approved.webp?v=label-corrections-20261120", "Back of the CAL-0 mango konjac jelly pouch", "Back of Pouch"],
    ["product-benefits-alt.webp?v=cal0-images-20261025", "Cal-0 mango pouch and product benefits", "Product Benefits"],
    ["nutrition-label.webp?v=cal0-images-20261025", "Cal-0 Nutrition Facts", "Nutrition Facts"]
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
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let photoAnimation = 0;
    let photoTarget = 0;
    function cancelPhotoMotion() {
      if (photoAnimation) cancelAnimationFrame(photoAnimation);
      photoAnimation = 0;
      track.style.scrollSnapType = '';
      photoTarget = Math.round(track.scrollLeft / track.clientWidth) || 0;
    }
    function goToPhoto(index) {
      cancelPhotoMotion();
      photoTarget = index;
      const start = track.scrollLeft;
      const target = index * track.clientWidth;
      if (motionPreference.matches || Math.abs(target - start) < 1) {
        track.scrollTo({left: target, behavior: 'auto'});
        return;
      }
      const startedAt = performance.now();
      track.style.scrollSnapType = 'none';
      function step(now) {
        const progress = Math.min(1, (now - startedAt) / 450);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        track.scrollLeft = start + (target - start) * eased;
        if (progress < 1) photoAnimation = requestAnimationFrame(step);
        else { photoAnimation = 0; track.style.scrollSnapType = ''; }
      }
      photoAnimation = requestAnimationFrame(step);
    }
    track.addEventListener('pointerdown', cancelPhotoMotion, {passive: true});
    track.addEventListener('wheel', cancelPhotoMotion, {passive: true});
    window.addEventListener('resize', cancelPhotoMotion, {passive: true});
    motionPreference.addEventListener('change', cancelPhotoMotion);
    track.addEventListener('keydown', event => {
      const current = photoAnimation ? photoTarget : Math.round(track.scrollLeft / track.clientWidth);
      let next;
      if (event.key === 'ArrowRight') next = (current + 1) % images.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + images.length) % images.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = images.length - 1;
      else return;
      event.preventDefault();
      goToPhoto(next);
    });
    images.forEach((item, index) => {
      const slide = document.createElement("div");
      slide.className = "photo-slide";
      const picture = document.createElement("img");
      picture.src = "assets/images/" + item[0];
      picture.alt = item[1];
      picture.width = index === 1 ? 1254 : 800;
      picture.height = index === 1 ? 1254 : 800;
      if (index > 0) picture.loading = "lazy";
      else picture.fetchPriority = "high";
      picture.decoding = "async";
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
        goToPhoto(index);
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
        const current = photoAnimation ? photoTarget : Math.round(track.scrollLeft / track.clientWidth);
        const next = (current + direction + images.length) % images.length;
        goToPhoto(next);
      });
      controls.append(button);
      if (direction < 0) controls.append(status);
    });
    track.addEventListener("scroll", () => {
      const current = Math.min(3, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
      buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === current)));
      const label = (current + 1) + " / 4";
      if (status.textContent !== label) status.textContent = label;
    }, {passive: true});
    const proof = host.parentElement.querySelector('.hero-proof, .catalog-proof');
    // Keep the product proof beside the photos it supports, before the controls.
    if (proof) host.replaceChildren(track, thumbs, proof, controls);
    else host.replaceChildren(track, thumbs, controls);
    const oldNav = document.querySelector(".gallery-nav");
    if (oldNav) oldNav.remove();
  }
  const nutrition = document.querySelector(".nutrition-photo img");
  if (nutrition) {
    nutrition.src = "assets/images/nutrition-composite.webp?v=label-corrections-20261120";
    nutrition.alt = "Cal-0 mango pouch with full Nutrition Facts and ingredients";
    nutrition.width = 1254;
    nutrition.height = 1254;
    const link = nutrition.closest("a");
    if (link) link.href = nutrition.src;
    document.querySelectorAll('#nutrition a[href="assets/images/nutrition-label.webp?v=cal0-images-20261025"]').forEach(link => { link.href = "assets/images/nutrition-composite.webp?v=label-corrections-20261120"; });
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
  {name:'Valley Marketplace', area:'Reseda · Los Angeles', address:'18345 Vanowen Street, Reseda, CA 91335'},
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
 const base = '/assets/images/';
 [
  ['C60350A5-6951-416A-9C4B-85C29963435E_1_105_c.jpeg','Cal-0 mango jelly pouches on a local market shelf'],
  ['CoronadoCal-0.jpeg','Cal-0 photographed in Coronado']
 ].forEach(photo => {
  const figure = document.createElement('figure'); const image = document.createElement('img');
  image.src = base + photo[0]; image.alt = photo[1]; image.loading = 'lazy'; image.width = 768; image.height = 1024; image.decoding = 'async';
  figure.append(image); photos.append(figure);
 });
 section.insertBefore(photos,dropdown);
 if (dropdown) dropdown.querySelector('summary').textContent = 'All Store Locations & Directions';
 const list = section.querySelector('[data-store-list]:not([data-static-store-directory])');
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
 const list = stores.querySelector('[data-store-list]:not([data-static-store-directory])');
 if (list) { list.replaceChildren(); list.hidden = true; }
 if (details) details.querySelector('summary').textContent = 'More Local Stores';
 const note = stores.querySelector('[data-stores-intro]');
 if (note) note.textContent = 'For additional convenience store and gas station stockists, contact us for current locations.';
})();
/* Founder-requested header and new real-world photography. */
(() => {
 const base='/assets/images/';
 const founder=document.querySelector('.founder-photo img');
 if(founder){founder.src=base+'4998EBAA-9C87-4F8B-8C02-428B6650AB24_1_105_c.jpeg';founder.alt='Oliver holding Cal-0 at Take-A-Bite';founder.width=768;founder.height=1024;}
 const style=document.createElement('style');
 style.textContent='.header-inner{display:grid;grid-template-columns:160px minmax(0,1fr) 160px;gap:12px}.site-logo{margin:0;justify-self:start}.main-nav{justify-self:center;justify-content:center;width:auto;gap:22px;order:initial;font-size:1rem}.header-inner>.button{justify-self:end}.founder-photo{max-width:360px}.founder-photo img{aspect-ratio:3/4;object-fit:cover;object-position:center 35%}#about .rounded-photo img{aspect-ratio:1;object-fit:cover;object-position:center 35%}@media(max-width:800px){.header-inner{grid-template-columns:1fr 1fr}.main-nav{grid-column:1/-1;grid-row:2;gap:16px;width:100%;font-size:.85rem}.header-inner>.button{grid-column:2;grid-row:1}}';
 document.head.append(style);
})();
/* Public placement directory. No private contacts, payments or invoice details. */
(() => {
 const section=document.querySelector('#stores'); if(!section)return;
 const locations=[
 ['Big Rock Liquor','8011 Mission Gorge Rd, Santee, CA 92071','placement'],
 ["Valley Marketplace — Reseda", "18345 Vanowen Street, Reseda, CA 91335", "listed"],
 ["Valley Marketplace — Simi Valley", "1117 E. Los Angeles Ave, Simi Valley, CA 93065", "listed"],
 ["Valley Marketplace — Valencia / Santa Clarita", "23975 Newhall Ranch Road, Valencia, CA 91355", "listed"],
 ['Golden Bagel Cafe','2744 Fletcher Pkwy, El Cajon, CA 92020','placement'],
 ['Shell','1145 S 28th St, San Diego, CA 92113','placement','shell-south-28th'],
 ['Anderson’s Liquor Beer & Wine','4131 Home Ave, San Diego, CA 92105','placement'],
 ['Ramona Chevron','1210 Main St, Ramona, CA 92065','placement'],
 ['Sky Fuel','1699 E Main St, El Cajon, CA','placement'],
 ['ARCO','1619 G St, San Diego, CA 92101','placement'],
 ['The Bottle House','3012 Grape St, San Diego, CA 92102','placement'],
 ['Nutrimart, Hillcrest','3854 Fifth Ave, San Diego, CA 92103','placement'],
 ['Nutrimart, Parkway Plaza','549 Parkway Plaza, El Cajon, CA 92020','placement'],
 ['Nutrimart, La Jolla','8843 Villa La Jolla Dr, La Jolla, CA 92037','placement'],
 ['Windmill Farms','6386 Del Cerro Blvd, San Diego, CA 92120','placement'],
 ['Happy Liquor','2567 University Ave, San Diego, CA 92104','placement'],
 ['7-Eleven, Adams Avenue','3436 Adams Ave, San Diego, CA 92116','placement'],
 ['7-Eleven, Ohio Street','4687 Ohio St, San Diego, CA 92116','placement'],
 ['Chevron','2290 Camino Del Rio North, San Diego, CA','placement'],
 ["Adams Wine & Spirits",'2740 Adams Ave, San Diego, CA 92116','trial'],
 ['Take A Hike','7448 Jackson Dr, San Diego, CA 92119','placement'],
 ['Cheers Liquor & Deli','6983 Navajo Rd, San Diego, CA 92119','placement'],
 ["Keil’s Fresh Foods",'7403 Jackson Dr, San Diego, CA 92119','placement'],
 ['The Strand Liquor','600 Palm Ave, Imperial Beach, CA 91932','placement'],
 ["Monroe’s Market",'4502 Oregon St, San Diego, CA 92116','samples'],
 ['Heights Market','3355 Adams Avenue, San Diego, CA 92116','placement'],
 ['Monroe Market','4127 Monroe Avenue, San Diego, CA 92116','placement'],
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
 ['Mesa Mart','7611 Linda Vista Road, San Diego, CA','placement'],
 ['Kearny Mesa Market','7631 Linda Vista Road, San Diego, CA','placement'],
 ['7-Eleven, Mission Gorge 5829','5829 Mission Gorge Rd, San Diego, CA 92120','placement'],
 ['Iowa Meat Farms','6041 Mission Gorge Rd., San Diego, CA 92120','placement'],
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
 ['7-Eleven','2190 Bacon Street, San Diego, CA','placement'],
 ['Vine Ripe Market','8191 Fletcher Pkwy, La Mesa, CA 91942','samples'],
 ['7-Eleven, Waring Road','5102 Waring Rd, San Diego, CA 92120','placement'],
 ['7-Eleven, El Cajon Boulevard 6991','6991 El Cajon Blvd, San Diego, CA 92115','placement']
 ];
 const heading=section.querySelector('h2');if(heading)heading.textContent='Cal-0 near you.';
 const intro=section.querySelector('.section-heading .lead');
 const trials=locations.filter(row=>row[2]==='samples').length;
 if(intro)intro.textContent=locations.length+' local placements across markets, convenience stores, liquor stores and gas stations, including '+trials+' sample-only locations. Check current stock before visiting.';
 const details=section.querySelector('details');
 if(details)details.querySelector('summary').textContent='View all stores (50+)';
 const note=section.querySelector('[data-stores-intro]');
 if(note)note.textContent='Placement list updated October 8, 2026. Sample and limited trial locations are marked below; placement does not guarantee current shelf stock.';
 const list=section.querySelector('[data-store-list]:not([data-static-store-directory])');if(!list)return;
 list.replaceChildren();list.hidden=false;
 locations.forEach(row=>{
  const card=document.createElement('article');card.className='store-card';
  if(row[3])card.dataset.storeKey=row[3];
  const name=document.createElement('h3');name.textContent=row[0];
  const address=document.createElement('address');address.textContent=row[1]||'Address confirmation pending';
  const label=document.createElement('p');label.className='small';
  label.textContent=row[2]==='listed'?'Contact the store for current availability':row[2]==='samples'?'Samples only; retail stock not confirmed':row[2]==='limited'?'Limited introductory placement; call before visiting':row[2]==='trial'?'Trial case placed; check availability':'Product placed; check current stock';
  card.append(name,address,label);
  if(row[1]){const link=document.createElement('a');link.className='text-link';link.textContent='Get Directions';link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(row[0]+', '+row[1]);link.target='_blank';link.rel='noopener noreferrer';card.append(link);}
  list.append(card);
 });
})();
/* Review: concise availability wording, fifth featured market and compact story. */
(() => {
 const section=document.querySelector('#stores');
 if(section){
  const intro=section.querySelector('.section-heading .lead');
  if(intro)intro.textContent='Find Cal-0 in 50+ stores, from neighborhood markets to convenience stores and gas stations. Contact the store to check availability before visiting.';
  const note=section.querySelector('[data-stores-intro]');
  if(note)note.textContent='Store list updated November 10, 2026. Availability varies; contact the store before visiting.';
  section.querySelectorAll('.store-card .small').forEach(label=>{label.textContent='Contact the store for current availability';});
  const featured=section.querySelector('.featured-stores');
  if(featured){
   const link=document.createElement('a');link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent("Keil's Fresh Foods, 7403 Jackson Dr, San Diego, CA 92119");link.target='_blank';link.rel='noopener noreferrer';
   const name=document.createElement('strong');name.textContent='Keil’s Fresh Foods';
   const area=document.createElement('span');area.textContent='San Carlos';
   link.append(name,area);featured.append(link);
  }
 }
 const pouch=document.querySelector('#about .rounded-photo img');
 if(pouch){pouch.src='assets/images/product-front-beach.webp?v=cal0-images-20261025';pouch.alt='Cal-0 mango konjac jelly pouch on a tropical beach';pouch.width=800;pouch.height=800;}
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
  const link=document.createElement('a');link.className='button button-outline';link.href='https://www.instagram.com/cal0llc/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Follow @cal0llc';
  container.append(copy,link);section.append(container);main.insertBefore(section,wholesale);
 }
})();
/* Neighborhood directory and restrained bold accents; preserve approved layout. */
(() => {
 const list=document.querySelector('#stores [data-store-list]:not([data-static-store-directory])');
 if(list){
  const groups=[
   ["Central San Diego", ["Happy Liquor", "7-Eleven, Adams Avenue", "7-Eleven, Ohio Street", "Monroe’s Market", "Heights Market", "Monroe Market", "7-Eleven, University Avenue", "7-Eleven, El Cajon Boulevard", "Anderson’s Liquor Beer & Wine", "The Bottle House", "Nutrimart, Hillcrest", "7-Eleven, El Cajon Boulevard 6991", "Adams Wine & Spirits"], "North Park, University Heights, Normal Heights, Kensington, Hillcrest, South Park, Fairmount Park and College Area/Rolando."],
   ["Ocean Beach, Point Loma & Midway", ["Liticker’s Liquor & Deli", "OB Quick Stop Liquor", "One Stop Shop", "OB Corner", "KRISP, Ocean Beach", "Shell", "Pat’s Liquor Store", "7-Eleven, Voltaire 4205", "7-Eleven", "7-Eleven, Midway 3185", "7-Eleven, Sports Arena", "7-Eleven, Midway 2387"], ""],
   ["Mission Valley, Del Cerro & San Carlos", ["Windmill Farms", "Take A Hike", "Cheers Liquor & Deli", "Keil’s Fresh Foods", "7-Eleven, Mission Gorge 5829", "Iowa Meat Farms", "7-Eleven, Mission Gorge 6401", "7-Eleven, Mission Gorge 7427", "7-Eleven, Waring Road", "Chevron"], "Includes Mission Gorge."],
   ["Clairemont, Kearny Mesa & Linda Vista", ["7-Eleven, Balboa Avenue", "7-Eleven, Clairemont Mesa West", "7-Eleven, Clairemont Mesa East", "7-Eleven, Mesa College Drive", "Mesa Mart", "Kearny Mesa Market"], ""],
   ["La Mesa & El Cajon", ["Golden Bagel Cafe", "Helix Liquor (Mama Liquor)", "Nutrimart, Parkway Plaza", "Sky Fuel", "Vine Ripe Market"], ""],
   ["Pacific Beach & La Jolla", ["High Vibes Smoke Shop PB", "7-Eleven, Garnet Avenue", "Nutrimart, La Jolla"], ""],
   ["Downtown & Barrio Logan", ["KRISP, Downtown", "ARCO", "shell-south-28th"], ""],
   ["Los Angeles & Ventura County", ["Valley Marketplace — Reseda", "Valley Marketplace — Simi Valley", "Valley Marketplace — Valencia / Santa Clarita"], ""],
   ["Ramona", ["Ramona Chevron"], ""],
   ["Coronado", ["Boney’s Bayside Market"], ""],
   ["Imperial Beach", ["The Strand Liquor"], ""],
   ["Santee", ["Big Rock Liquor"], ""]
  ];
  const cards=Array.from(list.querySelectorAll('.store-card'));
  const lookup=new Map(cards.map(card=>[card.dataset.storeKey||card.querySelector('h3').textContent,card]));
  list.replaceChildren();list.classList.add('neighborhood-directory');
  groups.forEach(([area,names,description])=>{
   const matched=names.map(name=>lookup.get(name)).filter(Boolean);if(!matched.length)return;
   const group=document.createElement('details');group.className='neighborhood-group';
   const summary=document.createElement('summary');summary.textContent=area+' ('+matched.length+')';
   const grid=document.createElement('div');grid.className='neighborhood-cards';
   matched.forEach(card=>{grid.append(card);lookup.delete(card.dataset.storeKey||card.querySelector('h3').textContent);});
   group.append(summary);
   if(description){const note=document.createElement('p');note.className='small';note.textContent=description;group.append(note);}
   group.append(grid);list.append(group);
  });
  if(lookup.size){const group=document.createElement('details');group.className='neighborhood-group';const title=document.createElement('summary');title.textContent='Other locations';const grid=document.createElement('div');grid.className='neighborhood-cards';lookup.forEach(card=>grid.append(card));group.append(title,grid);list.append(group);}
 }
 const style=document.createElement('style');
 style.textContent='#stores .neighborhood-directory{display:block}#stores .neighborhood-group{margin:10px 0;border:1px solid #C7D4CB;border-radius:12px;overflow:hidden;background:#FFFAF0}#stores .neighborhood-group>summary{padding:15px 18px;font-size:1rem;font-weight:800;color:#0F4D3F}#stores .neighborhood-group[open]>summary{background:#0F4D3F;color:#FFFAF0}#stores .neighborhood-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px}#stores .neighborhood-cards .store-card{margin:0;border:1px solid #D6DED3;border-radius:12px;padding:18px}#stores .store-status>summary{font-weight:900;font-size:1.12rem}#stores .store-status{border:2px solid #0F4D3F}#main-content h2{font-weight:850;letter-spacing:-.045em}#main-content .eyebrow{font-weight:850;display:inline-block;border-bottom:3px solid #F2B331;padding-bottom:5px}#story .founder-grid{border-left:5px solid #0F4D3F;padding-left:24px}#main-content .instagram-inner{background:#0F4D3F;color:#FFFAF0;padding:24px;border:0;border-radius:18px}#main-content .instagram-inner h2,#main-content .instagram-inner p{color:#FFFAF0}#main-content .instagram-inner .button{background:#FFFAF0;color:#0F4D3F;border-color:#FFFAF0}.button:not(.button-outline){font-weight:800}.photo-thumbs button[aria-pressed="true"]{border-width:3px}.featured-stores a:hover{background:#0F4D3F;color:#FFFAF0}@media(max-width:720px){#stores .neighborhood-cards{grid-template-columns:1fr;padding:12px}#story .founder-grid{padding-left:16px}#main-content .instagram-inner{padding:20px}}';
 document.head.append(style);
})();
/* Subtly richer cream palette. */
(() => {
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
  inner.tabIndex=0;inner.setAttribute('aria-label','Customer reviews. Scroll horizontally to read all three.');
  ['Incredible Mango Flavor','The best Konjac Jelly I have ever had.','Darn good Konjac'].forEach(text=>{const quote=document.createElement('blockquote');quote.textContent='“'+text+'”';inner.append(quote);});
  section.append(inner);about.before(section);
 }
 const style=document.createElement('style');
 style.textContent='.customer-quotes{padding:18px 0;background:#F0E7D3}.quote-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center}.quote-row blockquote{margin:0;padding:12px 18px;border-left:3px solid #F2B331;font-size:clamp(1rem,1.6vw,1.25rem);font-weight:800;line-height:1.45}.site-header .header-inner{grid-template-columns:150px minmax(0,1fr) 145px;column-gap:12px}.site-header .header-inner .main-nav{grid-column:2;grid-row:1;order:initial;position:static;top:auto;width:100%;min-width:0;flex-wrap:nowrap;gap:16px;justify-content:center;font-size:.9rem}.site-header .header-inner .main-nav a{white-space:nowrap;flex-shrink:0}.site-header .header-inner>.button{grid-column:3;grid-row:1}@media(max-width:800px){.site-header .header-inner{grid-template-columns:104px minmax(0,1fr) 120px;column-gap:10px}.site-header .header-inner .main-nav{gap:12px;font-size:.8rem;overflow-x:auto;justify-content:flex-start;scrollbar-width:thin}.site-header .header-inner>.button{font-size:.78rem;padding:10px 12px}}@media(max-width:480px){.site-header .header-inner{grid-template-columns:98px minmax(0,1fr) 105px;column-gap:8px}.quote-row{grid-template-columns:1fr;gap:4px}.quote-row blockquote{padding:10px 14px}}@media(max-width:360px){.site-header .header-inner{grid-template-columns:88px minmax(0,1fr) 105px}}';
 document.head.append(style);
})();

/* One gently scrolling menu on every page; touch and keyboard always take priority. */
(() => {
  'use strict';
  const nav = document.querySelector('.site-header .main-nav');
  if (!nav || nav.dataset.cal0ScrollReady === 'true') return;
  const oldGroup = nav.querySelector('.nav-motion-group:not(.nav-motion-clone)');
  if (oldGroup) nav.replaceChildren(...oldGroup.querySelectorAll('a'));
  const links = Array.from(nav.children).filter(node => node.tagName === 'A');
  if (!links.length) return;
  nav.dataset.cal0ScrollReady = 'true';
  nav.classList.add('nav-scroll-ready', 'nav-motion-ready');
  const header = nav.closest('.header-inner');
  if (header) header.classList.add('nav-scroll-header');

  const style = document.createElement('style');
  style.id = 'cal0-shared-nav-motion';
  style.textContent = `
    .announcement-bar:has(.nav-motion-toggle) { position: relative; padding-right: 32px; }
    .nav-motion-toggle { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #FFFAF0; opacity: .65; font: 10px/1 Arial, sans-serif; }
    .nav-motion-toggle:hover, .nav-motion-toggle:focus-visible { opacity: 1; }
    @media (min-width: 801px) {
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready { display: flex; width: min(100%,350px); min-width: 0; max-width: 100%; justify-self: center; justify-content: flex-start; flex-wrap: nowrap; gap: 10px; padding: 4px 0; overflow-x: auto; overflow-y: hidden; scroll-behavior: auto; scroll-snap-type: none; scrollbar-width: none; overscroll-behavior-x: contain; }
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready > a { flex: 0 0 auto; min-height: 34px; padding: 5px 9px; border: 1px solid rgba(15,77,63,.1); border-radius: 999px; background: rgba(15,77,63,.022); line-height: 1.2; white-space: nowrap; }
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready > a:hover { background: rgba(15,77,63,.045); border-color: rgba(15,77,63,.2); text-decoration: none; }
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready > a:focus-visible { outline-offset: -3px; }
    }
    @media (max-width: 800px) {
      body .site-header .header-inner.nav-scroll-header { display: grid; grid-template-columns: 104px minmax(0,1fr) 120px; gap: 10px; align-items: center; min-height: 64px; padding-block: 8px; }
      body .site-header .header-inner.nav-scroll-header > .site-logo { grid-column: 1; grid-row: 1; width: 104px; min-width: 0; margin: 0; }
      body .site-header .header-inner.nav-scroll-header > .site-logo img { width: 100%; height: auto; }
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready { display: flex; grid-column: 2; grid-row: 1; order: initial; position: static; top: auto; width: 100%; min-width: 0; max-width: 100%; flex-wrap: nowrap; justify-content: flex-start; gap: 10px; padding: 3px 0 5px; overflow-x: auto; overflow-y: hidden; scroll-behavior: auto; scroll-snap-type: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; overscroll-behavior-x: contain; font-size: .8rem; }
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready > a { flex: 0 0 auto; min-height: 34px; padding: 5px 9px; border: 1px solid rgba(15,77,63,.1); border-radius: 999px; background: rgba(15,77,63,.022); line-height: 1.2; white-space: nowrap; }
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready > a:hover { background: rgba(15,77,63,.045); border-color: rgba(15,77,63,.2); text-decoration: none; }
      body .site-header .header-inner.nav-scroll-header > .main-nav.nav-scroll-ready > a:focus-visible { outline-offset: -3px; }
      body .site-header .header-inner.nav-scroll-header > .button { grid-column: 3; grid-row: 1; justify-self: end; width: 100%; min-height: 36px; padding: 8px 10px; font-size: .78rem; white-space: nowrap; }
      .announcement-bar:has(.nav-motion-toggle) { position: relative; padding-right: 32px; }
      .nav-motion-toggle { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #FFFAF0; opacity: .65; font: 10px/1 Arial, sans-serif; }
      .nav-motion-toggle:hover, .nav-motion-toggle:focus-visible { opacity: 1; }
    }
    @media (max-width: 480px) {
      body .site-header .header-inner.nav-scroll-header { grid-template-columns: 98px minmax(0,1fr) 105px; column-gap: 8px; }
      body .site-header .header-inner.nav-scroll-header > .site-logo { width: 98px; }
    }
    @media (max-width: 360px) {
      body .site-header .header-inner.nav-scroll-header { grid-template-columns: 88px minmax(0,1fr) 105px; }
      body .site-header .header-inner.nav-scroll-header > .site-logo { width: 88px; }
    }
    @media (prefers-reduced-motion: reduce) { .nav-motion-toggle { display: none; } }
  `;
  document.head.append(style);

  const mobile = window.matchMedia('(max-width: 800px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let timer = 0;
  let lastTime = 0;
  let position = nav.scrollLeft;
  let direction = 1;
  let pointerHeld = false;
  let hovered = false;
  let keyboardFocus = false;
  let lastAutoScroll = -Infinity;
  const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }
  function canMove() {
    return !reducedMotion.matches && !document.hidden &&
      !document.body.classList.contains('header-motion-paused') &&
      !pointerHeld && !(hoverPointer.matches && hovered) && !keyboardFocus &&
      nav.scrollWidth > nav.clientWidth + 1;
  }
  function tick(now) {
    frame = 0;
    if (!canMove()) { lastTime = 0; return; }
    const maximum = nav.scrollWidth - nav.clientWidth;
    if (lastTime) {
      position += direction * Math.min(now - lastTime, 50) * (mobile.matches ? .012 : .004);
      if (position >= maximum) { position = maximum; direction = -1; }
      else if (position <= 0) { position = 0; direction = 1; }
      lastAutoScroll = now;
      nav.scrollLeft = position;
    }
    lastTime = now;
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (frame || timer || !canMove()) return;
    position = nav.scrollLeft;
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }
  function resumeAfter(delay = 2500) {
    stop();
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { timer = 0; start(); }, delay);
  }
  function refresh() {
    stop();
    window.clearTimeout(timer);
    timer = 0;
    start();
  }
  nav.addEventListener('pointerdown', event => { pointerHeld = true; keyboardFocus = false; if (event.pointerType !== 'mouse') hovered = false; resumeAfter(); }, {passive: true});
  nav.addEventListener('touchstart', () => { pointerHeld = true; keyboardFocus = false; hovered = false; resumeAfter(); }, {passive: true});
  function releasePointer() {
    if (!pointerHeld) return;
    pointerHeld = false;
    resumeAfter();
  }
  window.addEventListener('pointerup', releasePointer, {passive: true});
  window.addEventListener('pointercancel', releasePointer, {passive: true});
  window.addEventListener('touchend', releasePointer, {passive: true});
  window.addEventListener('touchcancel', releasePointer, {passive: true});
  nav.addEventListener('wheel', () => resumeAfter(), {passive: true});
  nav.addEventListener('scroll', () => { if (performance.now() - lastAutoScroll > 180) resumeAfter(); }, {passive: true});
  nav.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !hoverPointer.matches) return;
    hovered = true;
    stop();
  });
  nav.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse' || !hoverPointer.matches) return;
    hovered = false;
    resumeAfter();
  });
  nav.addEventListener('focusin', event => {
    keyboardFocus = event.target.matches(':focus-visible');
    if (keyboardFocus) { stop(); window.clearTimeout(timer); timer = 0; }
    else resumeAfter();
  });
  nav.addEventListener('focusout', event => {
    if (!nav.contains(event.relatedTarget)) { keyboardFocus = false; resumeAfter(); }
  });
  nav.addEventListener('keydown', event => {
    keyboardFocus = true;
    resumeAfter();
    const current = links.indexOf(event.target.closest('a'));
    if (current < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = Math.min(links.length - 1, current + 1);
    else if (event.key === 'ArrowLeft') next = Math.max(0, current - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = links.length - 1;
    else return;
    event.preventDefault();
    links[next].focus({preventScroll: true});
    links[next].scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'auto'});
  });
  mobile.addEventListener('change', refresh);
  reducedMotion.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', () => { pointerHeld = false; hovered = false; refresh(); });
  window.addEventListener('resize', () => resumeAfter(250), {passive: true});
  window.addEventListener('blur', () => { pointerHeld = false; hovered = false; stop(); });
  window.addEventListener('pageshow', () => { pointerHeld = false; hovered = false; keyboardFocus = false; refresh(); });
  window.addEventListener('focus', () => resumeAfter());
  document.addEventListener('cal0-header-motion-change', refresh);

  const announcement = document.querySelector('.announcement-bar');
  if (announcement && !announcement.querySelector('.header-motion-toggle, .nav-motion-toggle')) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-motion-toggle';
    toggle.setAttribute('aria-label', 'Pause header motion');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Ⅱ';
    announcement.append(toggle);
  }
  document.querySelectorAll('.header-motion-toggle, .nav-motion-toggle').forEach(toggle => {
    if (toggle.dataset.cal0MotionBound === 'true') return;
    toggle.dataset.cal0MotionBound = 'true';
    toggle.addEventListener('click', () => {
      const paused = document.body.classList.toggle('header-motion-paused');
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Resume header motion' : 'Pause header motion');
      toggle.textContent = paused ? '▶' : 'Ⅱ';
      document.dispatchEvent(new Event('cal0-header-motion-change'));
    });
  });
  start();
})();
