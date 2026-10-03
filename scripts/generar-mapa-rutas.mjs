// Genera src/components/MapaRutasHonduras.astro: mapa vectorial de Honduras con los
// departamentos cafetaleros y las rutas hacia Puerto Cortés (escena 6 de "El viaje del grano").
// Uso: descarga la geodata y ejecuta
//   curl -o hondurasLow.json https://cdn.amcharts.com/lib/4/geodata/json/hondurasLow.json
//   node scripts/generar-mapa-rutas.mjs hondurasLow.json
import fs from 'node:fs';

const geo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Departamentos cafetaleros (mismos que el mapa de Nosotros)
const CAFE = ['HN-SB', 'HN-EP', 'HN-LM', 'HN-IN', 'HN-YO', 'HN-OC', 'HN-CP', 'HN-OL', 'HN-FM', 'HN-CM', 'HN-LP', 'HN-CR'];
const PUERTO = [-87.94, 15.84];           // Puerto Cortés
const SPS = [-88.03, 15.50];              // San Pedro Sula (oficina principal)

// Proyección equirectangular corregida por la latitud media (suficiente para un país pequeño)
const rings = f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(p => p[0]);
const all = geo.features.flatMap(f => rings(f).flat());
const lons = all.map(c => c[0]), lats = all.map(c => c[1]);
const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
const W = 1000, PAD = 20;
const sx = (W - PAD * 2) / ((maxLon - minLon) * k);
const H = Math.round((maxLat - minLat) * sx + PAD * 2);
const P = ([lon, lat]) => [PAD + (lon - minLon) * k * sx, PAD + (maxLat - lat) * sx];
const r1 = n => Math.round(n * 10) / 10;

function pathOf(f) {
  return rings(f).map(ring => 'M' + ring.map(c => P(c).map(r1).join(',')).join('L') + 'Z').join('');
}
// Centroide del anillo más grande (fórmula del área)
function centroid(f) {
  const ring = rings(f).sort((a, b) => b.length - a.length)[0].map(P);
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i], [x1, y1] = ring[i + 1], c = x0 * y1 - x1 * y0;
    a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  a /= 2; return [cx / (6 * a), cy / (6 * a)];
}

const port = P(PUERTO).map(r1), sps = P(SPS).map(r1);
const deps = geo.features.map(f => ({ id: f.id, name: f.properties.name, d: pathOf(f), cafe: CAFE.includes(f.id) }));
// Rutas curvas desde cada departamento cafetalero hasta el puerto
const routes = geo.features.filter(f => CAFE.includes(f.id) && f.id !== 'HN-CR').map(f => {
  const [x, y] = centroid(f).map(r1);
  const mx = (x + port[0]) / 2, my = (y + port[1]) / 2;
  const dx = port[0] - x, dy = port[1] - y, len = Math.hypot(dx, dy);
  const cx = r1(mx - dy / len * len * 0.18), cy = r1(my + dx / len * len * 0.18);
  return { id: f.id, x, y, d: `M${x},${y}Q${cx},${cy} ${port[0]},${port[1]}`, len: Math.ceil(len * 1.15) };
});
// Salida al mar, hacia el mundo (arriba a la derecha)
const out = `M${port[0]},${port[1]}Q${r1(port[0] + 160)},${r1(port[1] - 120)} ${W - 30},${PAD + 4}`;

const svg = `---
// Generado por scripts/generar-mapa-rutas.mjs — no editar a mano.
---
<svg viewBox="0 0 ${W} ${H}" class="mapa-rutas" role="img" aria-labelledby="mapa-rutas-title">
  <title id="mapa-rutas-title">Mapa de Honduras: rutas del café desde las regiones cafetaleras hasta Puerto Cortés</title>
  <g class="mapa-rutas__deps">
${deps.map(d => `    <path d="${d.d}" class="${d.cafe ? 'is-cafe' : ''}"><title>${d.name}</title></path>`).join('\n')}
  </g>
  <g class="mapa-rutas__routes">
${routes.map((r, i) => `    <path d="${r.d}" style="--len:${r.len};--i:${i}" />`).join('\n')}
    <path class="mapa-rutas__out" d="${out}" style="--len:520;--i:${routes.length}" />
  </g>
  <g class="mapa-rutas__origins">
${routes.map((r, i) => `    <circle cx="${r.x}" cy="${r.y}" r="5" style="--i:${i}" />`).join('\n')}
  </g>
  <g class="mapa-rutas__port">
    <circle cx="${port[0]}" cy="${port[1]}" r="22" class="mapa-rutas__pulse" />
    <circle cx="${port[0]}" cy="${port[1]}" r="9" class="mapa-rutas__dot" />
    <text x="${r1(port[0] + 16)}" y="${r1(port[1] - 14)}" class="mapa-rutas__label">Puerto Cortés</text>
    <circle cx="${sps[0]}" cy="${sps[1]}" r="4" class="mapa-rutas__city" />
    <text x="${r1(sps[0] - 24)}" y="${r1(sps[1] + 46)}" class="mapa-rutas__label mapa-rutas__label--small">San Pedro Sula</text>
  </g>
</svg>
`;
fs.writeFileSync('src/components/MapaRutasHonduras.astro', svg);
console.log(`MapaRutasHonduras.astro: viewBox ${W}x${H}, ${deps.length} departamentos, ${routes.length} rutas, ${Math.round(svg.length / 1024)} KB`);
