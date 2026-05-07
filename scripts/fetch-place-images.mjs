// One-off: fetch Wikipedia lead images for every PLACE, resize to WebP, save to public/places.
// Usage: node scripts/fetch-place-images.mjs
//
// No API key needed. Honors Wikimedia rate limits (~1 req/sec courtesy delay).

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT          = path.resolve(import.meta.dirname, '..');
const PLACES_FILE   = path.join(ROOT, 'src/lib/places.ts');
const OUT_DIR       = path.join(ROOT, 'public/places');
const ATTRIB_FILE   = path.join(ROOT, 'src/lib/placeImages.ts');
const FAILED_LOG    = path.join(ROOT, 'scripts/MISSING_IMAGES.txt');

const USER_AGENT = 'TourismaBot/1.0 (https://github.com/aakkshhayy/tourisma-v2; aakkshhayy@gmail.com)';

// ── Parse places.ts to extract { id, name, state } tuples ─────────────────────
async function parsePlaces() {
  const src = await fs.readFile(PLACES_FILE, 'utf8');
  const start = src.indexOf('export const PLACES: TouristPlace[]');
  if (start < 0) throw new Error('Could not find PLACES export');
  const slice = src.slice(start);

  const places = [];
  // Match each top-level place object — id, name, state appear together at the start of each
  const re = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?state:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(slice)) !== null) {
    const [, id, name, state] = m;
    // Skip state-level dummies (state ids match state field)
    if (id === state) continue;
    places.push({ id, name, state });
  }
  return places;
}

// ── Wikipedia helpers ─────────────────────────────────────────────────────────
async function wikiSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  return res.json();
}

async function wikiSearch(query) {
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=3`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.pages?.[0]?.title ?? null;
}

function titleCase(s) {
  return s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// Try several search variants in priority order — most specific first
async function findImageForPlace(place) {
  const stateName = titleCase(place.state);
  const candidates = [
    place.name,                              // "Gangtok"
    `${place.name}, ${stateName}`,           // "Gangtok, Sikkim"
    `${place.name} ${stateName}`,            // "Kedarnath Uttarakhand"
  ];

  for (const title of candidates) {
    const summary = await wikiSummary(title);
    if (summary?.originalimage?.source) {
      return { url: summary.originalimage.source, title: summary.title, attribution: summary.description };
    }
  }

  // Fallback: full-text search and try the first result
  const found = await wikiSearch(`${place.name} ${stateName}`);
  if (found) {
    const summary = await wikiSummary(found);
    if (summary?.originalimage?.source) {
      return { url: summary.originalimage.source, title: summary.title, attribution: summary.description };
    }
  }

  return null;
}

async function downloadAndResize(url, outPath) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf)
    .resize(800, 600, { fit: 'cover', position: 'centre' })
    .webp({ quality: 78 })
    .toFile(outPath);
}

// ── Main ─────────────────────────────────────────────────────────────────────
const places = await parsePlaces();
console.log(`Found ${places.length} places. Starting fetch…\n`);

await fs.mkdir(OUT_DIR, { recursive: true });

const imageMap = {};   // id → { src, attribution, wikiTitle }
const failed   = [];

let done = 0;
for (const p of places) {
  done++;
  const outFile = path.join(OUT_DIR, `${p.id}.webp`);

  // Skip if already downloaded (idempotent)
  try { await fs.access(outFile); console.log(`[${done}/${places.length}] ⊙ ${p.id} (cached)`); imageMap[p.id] = { src: `/places/${p.id}.webp`, cached: true }; continue; }
  catch { /* not cached, fetch */ }

  try {
    const found = await findImageForPlace(p);
    if (!found) {
      console.log(`[${done}/${places.length}] ✗ ${p.id} — no image`);
      failed.push(`${p.id}\t${p.name}\t${p.state}`);
      continue;
    }
    await downloadAndResize(found.url, outFile);
    imageMap[p.id] = {
      src: `/places/${p.id}.webp`,
      wikiTitle: found.title,
      attribution: 'Wikimedia Commons',
    };
    console.log(`[${done}/${places.length}] ✓ ${p.id}  ←  ${found.title}`);
  } catch (err) {
    console.log(`[${done}/${places.length}] ✗ ${p.id} — ${err.message}`);
    failed.push(`${p.id}\t${p.name}\t${p.state}\t${err.message}`);
  }

  // Courtesy delay — Wikimedia is generous but we're polite
  await new Promise(r => setTimeout(r, 250));
}

// ── Write helper module ──────────────────────────────────────────────────────
const ts = `// Auto-generated by scripts/fetch-place-images.mjs — do not edit by hand.
// Photos sourced from Wikimedia Commons (CC / public domain).

export const PLACE_IMAGES: Record<string, string> = ${JSON.stringify(
  Object.fromEntries(Object.entries(imageMap).map(([id, v]) => [id, v.src])),
  null, 2,
)};

export function getPlaceImage(id: string): string | undefined {
  return PLACE_IMAGES[id];
}
`;
await fs.writeFile(ATTRIB_FILE, ts);

if (failed.length) {
  await fs.writeFile(FAILED_LOG, `# Places without images — fill manually\n# id\tname\tstate\terror\n\n${failed.join('\n')}\n`);
}

console.log(`\n──────────────────────────────────────────────`);
console.log(`✓ Got images for ${Object.keys(imageMap).length}/${places.length} places`);
console.log(`✗ Missing: ${failed.length} (see scripts/MISSING_IMAGES.txt)`);
console.log(`Wrote: src/lib/placeImages.ts`);
