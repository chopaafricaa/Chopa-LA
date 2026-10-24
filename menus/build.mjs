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
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const wa = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

// Occasion tags. Keep in sync with the checkboxes in menus/add.html.
// key: [chip label, page heading, page description]
const OCCASIONS = {
  'study': ['Study spot', 'Study spots in Accra', 'Quiet cafés in Accra where you can sit and study, with menus and prices.'],
  'remote-work': ['Remote work', 'Cafés for remote work in Accra', 'Accra cafés good for working on a laptop: wifi, seats and full menus with prices.'],
  'birthday-shoot': ['Birthday shoot', 'Birthday shoot spots in Accra', 'Photogenic cafés and restaurants in Accra for birthday shoots and celebrations.'],
  'date-night': ['Date night', 'Date night spots in Accra', 'Places in Accra for a date, with menus and prices so you know before you go.'],
  'brunch': ['Brunch', 'Brunch spots in Accra', 'Where to get brunch in Accra, with full menus and prices.'],
  'budget-eats': ['Budget eats', 'Budget eats in Accra', 'Good food in Accra that won’t finish your money, with prices.'],
  'group-hangout': ['Group hangout', 'Group hangout spots in Accra', 'Accra spots with room for a group, with menus and prices.'],
};
const PLATFORMS = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', x: 'X' };
const handleSlug = h => slugify(String(h).replace(/^@/, ''));

let skipped = 0;
const cafes = readdirSync(DATA).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(DATA, f), 'utf8')))
  .map(c => {
    const prices = c.sections.flatMap(s => s.items.map(i => i.price)).filter(p => p > 0);
    const occasions = (c.occasions || []).filter(o => OCCASIONS[o]);
    // Only show posts the creator has agreed to have featured.
    const posts = (c.posts || []).filter(p => {
      const ok = p.permission === true && /^https:\/\//.test(p.url || '') && p.handle;
      if (!ok) skipped++;
      return ok;
    }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return { ...c, occasions, posts, min: Math.min(...prices), max: Math.max(...prices), count: prices.length };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
if (skipped) console.warn(`Skipped ${skipped} creator post(s) without permission, handle or an https link.`);

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

// A post card links out to the original post. No third-party embed scripts,
// so pages stay fast on mobile data and creators keep the views on their own accounts.
const postCard = (p, cafe) => `<a href="${esc(p.url)}" rel="noopener" target="_blank" style="display:block;padding:14px 16px;border-radius:12px;background:#fff;border:1px solid #E4DED2;text-decoration:none;color:inherit">
<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;color:#5B6B62"><span>${esc(PLATFORMS[p.platform] || 'Post')}${p.date ? ` · ${niceDate(p.date)}` : ''}</span><span style="color:#0B3D2A;font-weight:600">Watch ↗</span></div>
${p.caption ? `<p style="margin:6px 0 0">${esc(p.caption)}</p>` : ''}
<p style="margin:6px 0 0;font-size:14px;color:#5B6B62">${cafe ? `at <strong style="color:#0B3D2A">${esc(cafe)}</strong>` : `by <strong style="color:#0B3D2A">${esc(p.creator || '@' + p.handle.replace(/^@/, ''))}</strong> @${esc(p.handle.replace(/^@/, ''))}`}</p>
</a>`;

const seenOn = c => c.posts.length ? `<section id="seen-on" style="scroll-margin-top:64px;margin-top:36px">
<h2 style="font-size:26px;color:#0B3D2A">Seen on</h2>
<p style="margin:6px 0 0;color:#5B6B62">Posts from creators who visited ${esc(c.name)}.</p>
<div style="display:grid;gap:10px;margin-top:12px">${c.posts.map(p => postCard(p) + `<p style="margin:-4px 0 4px 4px;font-size:13px"><a href="/menus/creators/${handleSlug(p.handle)}/">All of ${esc(p.creator || '@' + p.handle.replace(/^@/, ''))}'s spots →</a></p>`).join('\n')}</div>
</section>` : '';

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
${c.occasions.map(o => `<a class="badge" href="/menus/for/${o}/" style="background:#E7EFE9;color:#0B3D2A;text-decoration:none">${esc(OCCASIONS[o][0])}</a>`).join('\n')}
</div>
${c.posts.length ? `<p style="font-size:15px"><a href="#seen-on" style="color:#F2B33D">See ${c.posts.length} creator post${c.posts.length === 1 ? '' : 's'} from here ↓</a></p>` : ''}
</div></div>
<div style="position:sticky;top:0;z-index:5;background:#FAF8F3;border-bottom:1px solid #E4DED2"><div class="wrap" style="display:flex;gap:8px;overflow-x:auto;padding:10px 16px">${nav}</div></div>
<div class="wrap">
${sections}
${seenOn(c)}
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

const creatorBox = `<aside style="margin:24px 0 0;padding:20px;border-radius:12px;background:#fff;border:1px solid #E4DED2">
<h2 style="font-size:22px;color:#0B3D2A">Food creator in Accra?</h2>
<p style="margin:8px 0 16px">Get a free Chopa page listing every spot you've posted about, linked from each café's page.</p>
<a class="btn" href="${wa('Hi Chopa, I create food content in Accra and want a creator page. My handle is: ')}">Get listed on WhatsApp</a>
</aside>`;

// ---------- the finder ----------
const areas = [...new Set(cafes.map(c => c.area))].sort();
const card = c => `<a class="card" href="/menus/${c.slug}/" data-name="${esc(c.name.toLowerCase())}" data-area="${esc(c.area)}" data-wifi="${c.wifi}" data-occ=" ${c.occasions.join(' ')} " style="display:block;padding:18px;border-radius:12px;background:#fff;border:1px solid #E4DED2;text-decoration:none;color:inherit">
<strong style="font-size:19px;color:#0B3D2A">${esc(c.name)}</strong>
<div style="color:#5B6B62;font-size:14px;margin-top:2px">${esc(c.type)} · ${esc(c.area)} · ${c.count} item${c.count === 1 ? "" : "s"}${c.posts.length ? ` · ${c.posts.length} creator post${c.posts.length === 1 ? '' : 's'}` : ''}</div>
<div class="badges" style="margin-top:10px"><span class="badge">${cedi(c.min)} – ${cedi(c.max)}</span>${c.wifi === 'yes' ? '<span class="badge yes">Wifi</span>' : ''}${c.laptopFriendly ? '<span class="badge yes">Laptop-friendly</span>' : ''}${c.occasions.map(o => `<span class="badge">${esc(OCCASIONS[o][0])}</span>`).join('')}</div>
</a>`;
const cards = cafes.map(card).join('\n');
const usedOccasions = Object.keys(OCCASIONS).filter(o => cafes.some(c => c.occasions.includes(o)));

const chip = (label, attrs) => `<button type="button" class="chip" ${attrs} aria-pressed="false" style="border:1px solid #0B3D2A;background:#fff;color:#0B3D2A;border-radius:999px;padding:6px 14px;cursor:pointer">${esc(label)}</button>`;

const finder = `${head({ title: 'Café menus and prices in Accra | Chopa', description: `Menus with prices for ${cafes.length} Accra café${cafes.length === 1 ? '' : 's'}. Find places with wifi in Osu, East Legon, Airport and more.`, path: '/menus/' })}
<main>
<div class="top"><div class="wrap hero">
<h1>Where to next in Accra?</h1>
<p>Study spots, remote work, birthday shoots, date night. See the menu, the prices and what creators posted before you go.</p>
</div></div>
<div class="wrap" style="padding-top:20px">
<label for="q" style="position:absolute;left:-9999px">Search cafés</label>
<input id="q" type="search" placeholder="Search a café" style="width:100%;padding:12px 14px;border:1px solid #CFC8BA;border-radius:8px;background:#fff">
${usedOccasions.length ? `<div style="font-size:13px;color:#5B6B62;margin-top:14px">Good for</div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
${usedOccasions.map(o => chip(OCCASIONS[o][0], `data-occ="${o}"`)).join('\n')}
</div>` : ''}
<div style="font-size:13px;color:#5B6B62;margin-top:14px">Area and wifi</div>
<div id="chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
${chip('Wifi', 'data-filter="wifi"')}
${areas.map(a => chip(a, `data-area="${esc(a)}"`)).join('\n')}
</div>
<div id="list" style="display:grid;gap:12px;margin-top:20px">
${cards}
</div>
<p id="none" hidden style="color:#5B6B62">No café matches that yet.</p>
${claimBox('a café in Accra')}
${creatorBox}
<footer>Menus are taken from each café's public menu and dated on its page. Cafés can claim, correct or remove their page at any time.</footer>
</div>
</main>
<script>
(function(){
  var q=document.getElementById('q'),cards=[].slice.call(document.querySelectorAll('.card')),none=document.getElementById('none');
  var wifi=false,area=null,occ=null;
  function apply(){
    var t=q.value.trim().toLowerCase(),shown=0;
    cards.forEach(function(c){
      var ok=(!t||c.dataset.name.indexOf(t)>-1)&&(!wifi||c.dataset.wifi==='yes')&&(!area||c.dataset.area===area)&&(!occ||c.dataset.occ.indexOf(' '+occ+' ')>-1);
      c.hidden=!ok; if(ok) shown++;
    });
    none.hidden=shown>0;
  }
  q.addEventListener('input',apply);
  [].slice.call(document.querySelectorAll('.chip')).forEach(function(b){
    b.addEventListener('click',function(){
      if(b.dataset.filter==='wifi'){wifi=!wifi;b.setAttribute('aria-pressed',wifi);}
      else if(b.dataset.occ){occ=occ===b.dataset.occ?null:b.dataset.occ;
        [].slice.call(document.querySelectorAll('.chip[data-occ]')).forEach(function(o){o.setAttribute('aria-pressed',o.dataset.occ===occ);});}
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


const page = (path, html) => { mkdirSync(join(ROOT, ...path.split('/').filter(Boolean)), { recursive: true }); writeFileSync(join(ROOT, ...path.split('/').filter(Boolean), 'index.html'), html); };
const simplePage = ({ path, title, description, h1, lead, body }) => `${head({ title, description, path })}
<main>
<div class="top"><div class="wrap hero">
<h1>${esc(h1)}</h1>
<p>${esc(lead)}</p>
</div></div>
<div class="wrap" style="padding-top:20px">
${body}
<footer>Menus are taken from each café's public menu and dated on its page. Creator posts appear with the creator's permission and link to the original.</footer>
</div>
</main>
</body>
</html>
`;

// ---------- occasion pages: /menus/for/<occasion>/ ----------
for (const o of usedOccasions) {
  const list = cafes.filter(c => c.occasions.includes(o));
  const [, h1, description] = OCCASIONS[o];
  page(`/menus/for/${o}/`, simplePage({
    path: `/menus/for/${o}/`, title: `${h1} | Chopa`, description, h1,
    lead: `${list.length} place${list.length === 1 ? '' : 's'} so far, with full menus and prices.`,
    body: `<div style="display:grid;gap:12px">${list.map(card).join('\n')}</div>
<p style="margin-top:20px"><a href="/menus/">See every café →</a></p>
${claimBox('a spot that belongs here')}`,
  }));
}

// ---------- creator pages: /menus/creators/<handle>/ ----------
const creators = new Map();
for (const c of cafes) for (const p of c.posts) {
  const key = handleSlug(p.handle);
  if (!creators.has(key)) creators.set(key, { handle: p.handle.replace(/^@/, ''), name: p.creator || '@' + p.handle.replace(/^@/, ''), items: [] });
  creators.get(key).items.push({ p, cafe: c });
}
for (const [key, cr] of creators) {
  const places = [...new Set(cr.items.map(i => i.cafe.slug))].length;
  page(`/menus/creators/${key}/`, simplePage({
    path: `/menus/creators/${key}/`, title: `${cr.name}'s food spots in Accra | Chopa`,
    description: `${places} Accra spot${places === 1 ? '' : 's'} ${cr.name} has posted about, with menus and prices.`,
    h1: cr.name, lead: `@${cr.handle} · ${places} spot${places === 1 ? '' : 's'} in Accra`,
    body: `<div style="display:grid;gap:10px">${cr.items.sort((a, b) => String(b.p.date || '').localeCompare(String(a.p.date || ''))).map(i => postCard(i.p, i.cafe.name) + `<p style="margin:-4px 0 4px 4px;font-size:13px"><a href="/menus/${i.cafe.slug}/">${esc(i.cafe.name)} menu and prices →</a></p>`).join('\n')}</div>
${creatorBox}`,
  }));
}
if (creators.size) page('/menus/creators/', simplePage({
  path: '/menus/creators/', title: 'Accra food creators | Chopa', description: 'Food creators in Accra and the spots they have posted about.',
  h1: 'Accra food creators', lead: 'See where they ate, then see the menu.',
  body: `<div style="display:grid;gap:10px">${[...creators].map(([key, cr]) => `<a href="/menus/creators/${key}/" style="display:block;padding:16px;border-radius:12px;background:#fff;border:1px solid #E4DED2;text-decoration:none;color:inherit"><strong style="color:#0B3D2A;font-size:18px">${esc(cr.name)}</strong><div style="color:#5B6B62;font-size:14px">@${esc(cr.handle)} · ${[...new Set(cr.items.map(i => i.cafe.slug))].length} spots</div></a>`).join('\n')}</div>
${creatorBox}`,
}));

// ---------- sitemap ----------
const urls = ['/', '/menus/', ...cafes.map(c => `/menus/${c.slug}/`), ...usedOccasions.map(o => `/menus/for/${o}/`),
  ...(creators.size ? ['/menus/creators/'] : []), ...[...creators.keys()].map(k => `/menus/creators/${k}/`)];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`Built ${cafes.length} café page(s), ${usedOccasions.length} occasion page(s), ${creators.size} creator page(s), the finder and sitemap.xml`);
