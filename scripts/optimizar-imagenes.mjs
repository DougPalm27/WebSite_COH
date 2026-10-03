// Convierte a WebP las imágenes referenciadas en src/ y actualiza las rutas.
// Los originales se mueven a _originales/ (fuera de public/, no se publican).
// Uso: node scripts/optimizar-imagenes.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const PUBLIC = path.join(ROOT, 'public');
const BACKUP = path.join(ROOT, '_originales');
const MIN_KB = 100;
// Se mantienen en PNG: favicon y logos que usa i18n.js
const KEEP = new Set(['/img/logos_varios/Logotipo_COHONDUCAFE_Colores.png', '/img/logos_varios/Logotipo_COHONDUCAFE_Blanco.png']);

function srcFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? srcFiles(path.join(dir, d.name)) : /\.(astro|ts|js|css)$/.test(d.name) ? [path.join(dir, d.name)] : []);
}

// Ancho máximo según uso
function maxWidth(p) {
  if (p.includes('/junta directiva/')) return 600;
  if (p.includes('/hero/') || p.includes('/BannerPrincipal/') || p.includes('/Bosques/')) return 1920;
  return 1400;
}

const files = srcFiles(path.join(ROOT, 'src'));
const refs = new Set();
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\/img\/[^"'`)]+?\.(?:jpe?g|png)/gi)) refs.add(decodeURIComponent(m[0]));
}

const renames = [];
let before = 0, after = 0;
for (const ref of [...refs].sort()) {
  if (KEEP.has(ref)) continue;
  const abs = path.join(PUBLIC, ref);
  if (!fs.existsSync(abs)) { console.warn('No existe:', ref); continue; }
  const size = fs.statSync(abs).size;
  if (size < MIN_KB * 1024) continue;

  const outRef = ref.replace(/\.(jpe?g|png)$/i, '.webp');
  const outAbs = path.join(PUBLIC, outRef);
  await sharp(abs).rotate().resize({ width: maxWidth(ref), withoutEnlargement: true })
    .webp({ quality: 78 }).toFile(outAbs);
  const newSize = fs.statSync(outAbs).size;
  before += size; after += newSize;
  console.log(`${(size / 1024).toFixed(0).padStart(6)}K -> ${(newSize / 1024).toFixed(0).padStart(4)}K  ${ref}`);

  const bak = path.join(BACKUP, ref);
  fs.mkdirSync(path.dirname(bak), { recursive: true });
  fs.renameSync(abs, bak);
  renames.push([ref, outRef]);
}

// Actualizar referencias (forma normal y con %20)
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8'), orig = s;
  for (const [a, b] of renames) {
    s = s.split(a).join(b);
    s = s.split(a.replace(/ /g, '%20')).join(b.replace(/ /g, '%20'));
  }
  if (s !== orig) { fs.writeFileSync(f, s); console.log('Actualizado', path.relative(ROOT, f)); }
}
console.log(`\nTotal: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
