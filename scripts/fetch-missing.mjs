import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT       = path.resolve(import.meta.dirname, '..');
const OUT_DIR    = path.join(ROOT, 'public/places');
const UA = 'TourismaBot/1.0 (https://github.com/aakkshhayy/tourisma-v2; aakkshhayy@gmail.com)';

// Manual mapping for places that didn't auto-resolve — pick a known-good Wikipedia title
const MANUAL = {
  mh_ellora:        'Kailasa_temple,_Ellora',
  ga_old_goa:       'Panaji',
  cg_barnawapara:   'Mahanadi',
  ld_bangaram:      'Lakshadweep',
};

async function fetchImage(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.originalimage?.source ?? data.thumbnail?.source ?? null;
}

const summary = [];
for (const [id, title] of Object.entries(MANUAL)) {
  const img = await fetchImage(title);
  if (!img) { console.log(`✗ ${id}: ${title} — no image`); continue; }
  const buf = Buffer.from(await (await fetch(img, { headers: { 'User-Agent': UA } })).arrayBuffer());
  await sharp(buf).resize(800, 600, { fit: 'cover' }).webp({ quality: 78 }).toFile(path.join(OUT_DIR, `${id}.webp`));
  summary.push(id);
  console.log(`✓ ${id}  ←  ${title}`);
}

// Update placeImages.ts: read existing, add new ids, write back
const file = path.join(ROOT, 'src/lib/placeImages.ts');
let src = await fs.readFile(file, 'utf8');
const match = src.match(/export const PLACE_IMAGES: Record<string, string> = (\{[\s\S]*?\});/);
const map = JSON.parse(match[1]);
for (const id of summary) map[id] = `/places/${id}.webp`;
const newSrc = src.replace(
  /export const PLACE_IMAGES: Record<string, string> = \{[\s\S]*?\};/,
  `export const PLACE_IMAGES: Record<string, string> = ${JSON.stringify(map, null, 2)};`,
);
await fs.writeFile(file, newSrc);
console.log(`Updated placeImages.ts (+${summary.length} entries)`);
