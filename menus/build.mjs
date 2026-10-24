// Builds the public menu pages from menus/data/*.json.
// Run from the repo root:  node menus/build.mjs
// Writes menus/index.html (the finder), menus/<slug>/index.html (one page per café)
// and sitemap.xml. Commit the generated files; Vercel serves them as static pages.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://chopaafrica.com';
const WHATSAPP = '233504093221';
const ROOT = new URL('..', import.meta.url).pathname;
const DATA = join(ROOT, 'menus', 'data');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cedi = n => `GH₵ ${Number(n).toLocaleString('en-GH')}`;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const niceDate = iso => `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const wa = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const cafes = readdirSync(DATA).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(DATA, f), 'utf8')))
  .map(c => {
    const prices = c.sections.flatMap(s => s.items.map(i => i.price)).filter(p => p > 0);
    return { ...c, min: Math.min(...prices), max: Math.max(...prices), count: prices.length };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const head = ({ title, description, path, extra = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta name="theme-color" content="#0B3D2A">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Chopa">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/chopa-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Saira:ital,wght@1,800&amp;display=swap" rel="stylesheet">
${extra}
<style>
*{box-sizing:border-box}
body{margin:0;background:#FAF8F3;color:#16211C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.5}
a{color:#0B3D2A}
.wrap{max-width:760px;margin:0 auto;padding:0 16px}
.top{background:#0B3D2A;color:#fff}
.top nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0}
.top img{height:32px;display:block}
.top a.link{color:#E2ECE5;text-decoration:none;font-size:15px}
h1,h2{font-family:'Saira','Arial Black',sans-serif;font-style:italic;font-weight:800;text-transform:uppercase;line-height:1;margin:0}
h1{font-size:clamp(34px,8vw,56px)}
.hero{padding-top:28px;padding-bottom:32px}
.hero p{color:#D3E3D9;margin:12px 0 0;font-size:17px}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.badge{display:inline-block;font-size:13px;padding:4px 10px;border-radius:999px;background:#1E5440;color:#fff}
.badge.yes{background:#F2B33D;color:#0B3D2A;font-weight:600}
.card .badge{background:#E7EFE9;color:#0B3D2A}.card .badge.yes{background:#F2B33D}
.btn{display:inline-block;background:#F2B33D;color:#0B3D2A;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:6px}
input,button{font:inherit}
a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid #F2B33D;outline-offset:2px}
footer{color:#5B6B62;font-size:13px;padding:32px 0 48px}
</style>
</head>
<body>
<header class="top"><div class="wrap"><nav aria-label="Main"><a href="/"><img src="/images/chopa-logo-white.png" alt="Chopa"></a><a class="link" href="/menus/">All café menus</a></nav></div></header>`;

const claimBox = name => `<aside style="margin:32px 0 0;padding:20px;border-radius:12px;background:#0B3D2A;color:#fff">
<h2 style="font-size:24px">Own ${esc(name)}?</h2>
<p style="margin:8px 0 16px;color:#D3E3D9">Your menu page is free and yours to correct. With Chopa, the same customers can order from their table and pay with MoMo, and you see every confirmed payment.</p>
<a class="btn" href="${wa(`Hi Chopa, I'm from ${name}. I'd like to claim our menu page.`)}">Claim this page on WhatsApp</a>
</aside>`;

// ---------- one page per café ----------
for (const c of cafes) {
  const path = `/menus/${c.slug}/`;
  const title = `${c.name} menu and prices, ${c.area} | Chopa`;
  const description = `${c.name} menu with prices in cedis: ${c.count} items from ${cedi(c.min)} to ${cedi(c.max)}. ${c.wifi === 'yes' ? 'Wifi available. ' : ''}${c.area}, Accra.`;
  const ld = {
    '@context': 'https://schema.org', '@type': c.type === 'Café' ? 'CafeOrCoffeeShop' : 'Restaurant',
    name: c.name, url: SITE + path, priceRange: `${cedi(c.min)}–${cedi(c.max)}`, servesCuisine: c.cuisine,
    address: { '@type': 'PostalAddress', streetAddress: c.address, addressLocality: 'Accra', addressCountry: 'GH' },
    hasMenu: { '@type': 'Menu', hasMenuSection: c.sections.map(s => ({ '@type': 'MenuSection', name: s.name,
      hasMenuItem: s.items.map(i => ({ '@type': 'MenuItem', name: i.name, offers: { '@type': 'Offer', price: i.price, priceCurrency: 'GHS' } })) })) },
  };
  const nav = c.sections.map(s => `<a href="#${slugify(s.name)}" style="flex:none;padding:6px 12px;border-radius:999px;background:#E7EFE9;color:#0B3D2A;text-decoration:none;font-size:14px;white-space:nowrap">${esc(s.name)}</a>`).join('');
  const sections = c.sections.map(s => `<section id="${slugify(s.name)}" style="scroll-margin-top:64px;margin-top:28px">
<h2 style="font-size:26px;color:#0B3D2A">${esc(s.name)}</h2>
<ul style="list-style:none;margin:12px 0 0;padding:0">${s.items.map(i => `
<li style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #E4DED2"><span>${esc(i.name)}${i.description ? `<br><small style="color:#5B6B62">${esc(i.description)}</small>` : ''}</span><strong style="white-space:nowrap">${cedi(i.price)}</strong></li>`).join('')}
</ul></section>`).join('\n');

  const html = `${head({ title, description, path, extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` })}
<main>
<div class="top"><div class="wrap hero">
<h1>${esc(c.name)}</h1>
<p>${esc(c.about || '')}</p>
<div class="badges">
<span class="badge">${esc(c.area)}</span>
<span class="badge">${cedi(c.min)} – ${cedi(c.max)}</span>
${c.wifi === 'yes' ? '<span class="badge yes">Wifi</span>' : ''}
${c.laptopFriendly ? '<span class="badge yes">Laptop-friendly</span>' : ''}
</div>
</div></div>
<div style="position:sticky;top:0;z-index:5;background:#FAF8F3;border-bottom:1px solid #E4DED2"><div class="wrap" style="display:flex;gap:8px;overflow-x:auto;padding:10px 16px">${nav}</div></div>
<div class="wrap">
${sections}
<p style="margin-top:24px;color:#5B6B62;font-size:14px">${esc(c.address || c.area)}${c.instagram ? ` · <a href="https://instagram.com/${esc(c.instagram)}">@${esc(c.instagram)}</a>` : ''}${c.website ? ` · <a href="${esc(c.website)}">Website</a>` : ''}</p>
${claimBox(c.name)}
<footer>Prices in Ghana cedis, taken from <a href="${esc(c.source)}">the café's public menu</a> on ${niceDate(c.checked)}. Prices can change; check with the café. Spotted a mistake or want this page removed? <a href="${wa(`Hi Chopa, a correction for the ${c.name} menu page:`)}">Tell us on WhatsApp</a>.</footer>
</div>
</main>
</body>
</html>
`;
  mkdirSync(join(ROOT, 'menus', c.slug), { recursive: true });
  writeFileSync(join(ROOT, 'menus', c.slug, 'index.html'), html);
}

// ---------- the finder ----------
const areas = [...new Set(cafes.map(c => c.area))].sort();
const cards = cafes.map(c => `<a class="card" href="/menus/${c.slug}/" data-name="${esc(c.name.toLowerCase())}" data-area="${esc(c.area)}" data-wifi="${c.wifi}" style="display:block;padding:18px;border-radius:12px;background:#fff;border:1px solid #E4DED2;text-decoration:none;color:inherit">
<strong style="font-size:19px;color:#0B3D2A">${esc(c.name)}</strong>
<div style="color:#5B6B62;font-size:14px;margin-top:2px">${esc(c.type)} · ${esc(c.area)} · ${c.count} items</div>
<div class="badges" style="margin-top:10px"><span class="badge">${cedi(c.min)} – ${cedi(c.max)}</span>${c.wifi === 'yes' ? '<span class="badge yes">Wifi</span>' : ''}${c.laptopFriendly ? '<span class="badge yes">Laptop-friendly</span>' : ''}</div>
</a>`).join('\n');

const chip = (label, attrs) => `<button type="button" class="chip" ${attrs} aria-pressed="false" style="border:1px solid #0B3D2A;background:#fff;color:#0B3D2A;border-radius:999px;padding:6px 14px;cursor:pointer">${esc(label)}</button>`;

const finder = `${head({ title: 'Café menus and prices in Accra | Chopa', description: `Menus with prices for ${cafes.length} Accra café${cafes.length === 1 ? '' : 's'}. Find places with wifi in Osu, East Legon, Airport and more.`, path: '/menus/' })}
<main>
<div class="top"><div class="wrap hero">
<h1>Accra café menus</h1>
<p>See the full menu and prices before you go. Filter for wifi and the area you're in.</p>
</div></div>
<div class="wrap" style="padding-top:20px">
<label for="q" style="position:absolute;left:-9999px">Search cafés</label>
<input id="q" type="search" placeholder="Search a café" style="width:100%;padding:12px 14px;border:1px solid #CFC8BA;border-radius:8px;background:#fff">
<div id="chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
${chip('Wifi', 'data-filter="wifi"')}
${areas.map(a => chip(a, `data-area="${esc(a)}"`)).join('\n')}
</div>
<div id="list" style="display:grid;gap:12px;margin-top:20px">
${cards}
</div>
<p id="none" hidden style="color:#5B6B62">No café matches that yet.</p>
${claimBox('a café in Accra')}
<footer>Menus are taken from each café's public menu and dated on its page. Cafés can claim, correct or remove their page at any time.</footer>
</div>
</main>
<script>
(function(){
  var q=document.getElementById('q'),cards=[].slice.call(document.querySelectorAll('.card')),none=document.getElementById('none');
  var wifi=false,area=null;
  function apply(){
    var t=q.value.trim().toLowerCase(),shown=0;
    cards.forEach(function(c){
      var ok=(!t||c.dataset.name.indexOf(t)>-1)&&(!wifi||c.dataset.wifi==='yes')&&(!area||c.dataset.area===area);
      c.hidden=!ok; if(ok) shown++;
    });
    none.hidden=shown>0;
  }
  q.addEventListener('input',apply);
  [].slice.call(document.querySelectorAll('.chip')).forEach(function(b){
    b.addEventListener('click',function(){
      if(b.dataset.filter==='wifi'){wifi=!wifi;b.setAttribute('aria-pressed',wifi);}
      else{area=area===b.dataset.area?null:b.dataset.area;
        [].slice.call(document.querySelectorAll('.chip[data-area]')).forEach(function(o){o.setAttribute('aria-pressed',o.dataset.area===area);});}
      [].slice.call(document.querySelectorAll('.chip')).forEach(function(o){var on=o.getAttribute('aria-pressed')==='true';o.style.background=on?'#0B3D2A':'#fff';o.style.color=on?'#fff':'#0B3D2A';});
      apply();
    });
  });
})();
</script>
</body>
</html>
`;
writeFileSync(join(ROOT, 'menus', 'index.html'), finder);

// ---------- sitemap ----------
const urls = ['/', '/menus/', ...cafes.map(c => `/menus/${c.slug}/`)];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`Built ${cafes.length} café page(s), the finder and sitemap.xml`);
