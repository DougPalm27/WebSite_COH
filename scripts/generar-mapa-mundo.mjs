// Genera public/img/viaje/mundo.svg: mapa del mundo ilustrado (mismo estilo que el de
// Honduras) con rutas desde Puerto Cortés a cada país destino. Escena 7 de "El viaje del grano".
// Se carga con fetch al acercarse a la sección, para no pesar en el HTML.
// Uso:
//   curl -o worldLow.json https://cdn.amcharts.com/lib/4/geodata/json/worldLow.json
//   node scripts/generar-mapa-mundo.mjs worldLow.json
import fs from 'node:fs';

const geo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Países destino de exportación (mismos 24 que marcaba el mapa anterior)
const DEST = ['US','CA','MX','DE','BE','IT','FR','SE','NL','GB','CH','ES','FI','NO','DK','JP','KR','CN','TW','AU','NZ','CO','EC','ZA'];
const PUERTO = [-87.94, 15.84];

// Proyección Natural Earth (la de los atlas), en radianes
const rad = Math.PI / 180;
function natural([lon, lat]) {
  const l = lon * rad, p = lat * rad, p2 = p * p, p4 = p2 * p2;
  return [
    l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
    p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))),
  ];
}
const LAT_MIN = -56, LAT_MAX = 80;                         // sin Antártida ni el Ártico extremo
const xMax = natural([180, 0])[0], yTop = natural([0, LAT_MAX])[1], yBot = natural([0, LAT_MIN])[1];
const W = 1000, s = W / (2 * xMax), H = Math.round((yTop - yBot) * s);
const P = c => { const [x, y] = natural(c); return [(x + xMax) * s, (yTop - y) * s]; };

// Simplificación Douglas–Peucker (en unidades del SVG)
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let max = 0, idx = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      // anillo cerrado (inicio = fin): se mide la distancia al punto, no a una "recta" de largo 0
      const d = len === 0
        ? Math.hypot(pts[i][0] - x1, pts[i][1] - y1)
        : Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = r => Math.abs(r.reduce((s2, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s2 + x * y2 - x2 * y; }, 0) / 2);
const rings = f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(p => p[0]);

let paths = [], origin = null;
const centers = {};
for (const f of geo.features) {
  if (f.id === 'AQ') continue;
  const isDest = DEST.includes(f.id), isHN = f.id === 'HN';
  const proj = rings(f)
    .map(r => r.map(([lon, lat]) => [lon, Math.max(LAT_MIN, Math.min(LAT_MAX, lat))]).map(P))
    // países pequeños (Bélgica, Suiza, Taiwán…): si al simplificar desaparecen, se deja el contorno original
    .map(r => { const sr = simplify(r, 0.7); return sr.length > 3 || !(isDest || isHN) ? sr : r; })
    .filter(r => r.length > 3 && (area(r) > 4 || isDest || isHN));      // fuera islas diminutas
  if (!proj.length) continue;
  // centro del polígono más grande (destino de la ruta)
  const big = proj.slice().sort((a, b) => area(b) - area(a))[0];
  let A = 0, cx = 0, cy = 0;
  big.forEach(([x, y], i) => { const [x2, y2] = big[(i + 1) % big.length], c = x * y2 - x2 * y; A += c; cx += (x + x2) * c; cy += (y + y2) * c; });
  centers[f.id] = [cx / (3 * A), cy / (3 * A)];
  const d = proj.map(r => 'M' + r.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join('L') + 'Z').join('');
  paths.push({ id: f.id, name: f.properties.name, d, cls: isHN ? 'is-origin' : isDest ? 'is-dest' : '' });
}
// Ajustes manuales del punto de llegada donde el centroide no cae en el territorio principal
const LLEGADA = { US: [-98, 39], CA: [-100, 55], NO: [9, 61], FR: [2.5, 46.8], CN: [108, 34], AU: [134, -25] };
for (const [id, c] of Object.entries(LLEGADA)) centers[id] = P(c);

const port = P(PUERTO);
const dist = id => Math.hypot(centers[id][0] - port[0], centers[id][1] - port[1]);
const order = DEST.slice().sort((a, b) => dist(a) - dist(b));
const r1 = n => Math.round(n * 10) / 10;

const arcs = order.map((id, i) => {
  const [x, y] = centers[id], dx = x - port[0], dy = y - port[1], L = Math.hypot(dx, dy);
  // punto de control elevado: arco tipo "vuelo"
  const cx = port[0] + dx / 2 + (-dy / L) * L * 0.22 * Math.sign(dx || 1), cy = port[1] + dy / 2 - Math.abs(dx) * 0.22 - 8;
  return { id, i, x: r1(x), y: r1(y), d: `M${r1(port[0])},${r1(port[1])}Q${r1(cx)},${r1(cy)} ${r1(x)},${r1(y)}`, len: Math.ceil(L * 1.3) };
});
const delay = Object.fromEntries(arcs.map(a => [a.id, a.i]));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="mundo" role="img" aria-label="Mapa del mundo con las rutas de exportación de COHONDUCAFE desde Puerto Cortés hacia ${DEST.length} países">
<g class="mundo__zoom" style="transform-origin:${r1(port[0])}px ${r1(port[1])}px">
<g class="mundo__countries">
${paths.map(p => `<path d="${p.d}"${p.cls ? ` class="${p.cls}"` : ''}${p.cls === 'is-dest' ? ` style="--d:${delay[p.id]}"` : ''}><title>${p.name}</title></path>`).join('\n')}
</g>
<g class="mundo__arcs">
${arcs.map(a => `<path d="${a.d}" style="--d:${a.i};--len:${a.len}"/>`).join('\n')}
</g>
<g class="mundo__dests">
${arcs.map(a => `<circle cx="${a.x}" cy="${a.y}" r="3.2" style="--d:${a.i}"/>`).join('\n')}
</g>
<circle class="mundo__pulse" cx="${r1(port[0])}" cy="${r1(port[1])}" r="12"/>
<circle class="mundo__port" cx="${r1(port[0])}" cy="${r1(port[1])}" r="4.5"/>
</g>
</svg>
`;
fs.writeFileSync('public/img/viaje/mundo.svg', svg);
console.log(`mundo.svg: ${W}x${H}, ${paths.length} países, ${arcs.length} rutas, ${Math.round(svg.length / 1024)} KB`);
console.log('orden de llegada:', order.join(' '));
