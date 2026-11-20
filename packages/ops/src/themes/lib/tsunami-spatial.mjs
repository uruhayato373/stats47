import assert from 'node:assert/strict';
export const DEPTH_BANDS = [
  ['d001-03', '0.01m以上0.3m未満', 0.01, 0.3],
  ['d03-1', '0.3m以上1m未満', 0.3, 1],
  ['d1-2', '1m以上2m未満', 1, 2],
  ['d2-3', '2m以上3m未満', 2, 3],
  ['d3-5', '3m以上5m未満', 3, 5],
  ['d5-10', '5m以上10m未満', 5, 10],
  ['d10-20', '10m以上20m未満', 10, 20],
  ['d20plus', '20m以上', 20, null],
];
export function depthBand(depth) {
  assert.ok(
    Number.isFinite(depth) && depth >= 0.01 && depth < 1000,
    'Invalid depth'
  );
  return DEPTH_BANDS.findIndex(
    (b) => depth >= b[2] && (b[3] === null || depth < b[3])
  );
}
export function fixedPopulation(value) {
  assert.ok(Number.isFinite(value) && value >= 0, 'Invalid population');
  const n = Math.round(value * 10000);
  assert.ok(
    Number.isSafeInteger(n) && Math.abs(n / 10000 - value) < 1e-8,
    'Population precision'
  );
  return n;
}
export function quarterMeshCenter(code) {
  assert.match(code, /^\d{8}[1-4]{2}$/);
  assert.ok(+code[4] < 8 && +code[5] < 8, 'Invalid second mesh');
  let y = +code.slice(0, 2) / 1.5 + +code[4] / 12 + +code[6] / 120,
    x = 100 + +code.slice(2, 4) + +code[5] / 8 + +code[7] / 80,
    dx = 1 / 80,
    dy = 1 / 120;
  for (const q of code.slice(8)) {
    dx /= 2;
    dy /= 2;
    if (q === '2' || q === '4') x += dx;
    if (q === '3' || q === '4') y += dy;
  }
  return [x + dx / 2, y + dy / 2];
}
function ringRelation(point, ring) {
  assert.ok(ring.length >= 4);
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[j],
      [c, d] = ring[i];
    const cross = (x - a) * (d - b) - (y - b) * (c - a),
      len = Math.hypot(c - a, d - b);
    if (
      len > 0 &&
      Math.abs(cross) <= 1e-12 * len &&
      x >= Math.min(a, c) - 1e-12 &&
      x <= Math.max(a, c) + 1e-12 &&
      y >= Math.min(b, d) - 1e-12 &&
      y <= Math.max(b, d) + 1e-12
    )
      return 2;
    if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a)
      inside = !inside;
  }
  return inside ? 1 : 0;
}
export function pointInPolygonInclusive(p, rings) {
  const outer = ringRelation(p, rings[0]);
  if (!outer) return false;
  if (outer === 2) return true;
  for (const hole of rings.slice(1)) {
    const hit = ringRelation(p, hole);
    if (hit === 2) return true;
    if (hit === 1) return false;
  }
  return true;
}
export function gridCellKey(x, y) {
  assert.ok(
    Number.isFinite(x) && Number.isFinite(y),
    'Invalid projected point'
  );
  return `${Math.floor(x / 10)},${Math.floor(y / 10)}`;
}
export function uniqueIdentity(set, id) {
  assert.ok(!set.has(id), `Duplicate identity ${id}`);
  set.add(id);
}
export function accumulate(points) {
  const keys = [
    ...DEPTH_BANDS.map((b) => b[0]),
    'outside-published-inundation',
  ];
  const rows = keys.map((key) => ({
    key,
    populationRecords: 0,
    population2020Units: 0,
    population2050Units: 0,
    administrativeFacilities: 0,
    publicMeetingFacilities: 0,
  }));
  for (const p of points) {
    const row = rows[p.band < 0 ? 8 : p.band];
    assert.ok(row, 'Invalid band');
    if (p.kind === 'population') {
      row.populationRecords++;
      row.population2020Units += p.p2020;
      row.population2050Units += p.p2050;
    } else if (p.group === 'administrative') row.administrativeFacilities++;
    else if (p.group === 'public-meeting') row.publicMeetingFacilities++;
    else throw Error('Invalid facility group');
  }
  const total = {};
  for (const key of Object.keys(rows[0]).filter((k) => k !== 'key')) {
    total[key] = rows.reduce((s, r) => s + r[key], 0);
    assert.ok(Number.isSafeInteger(total[key]), 'Unsafe aggregate');
  }
  return { bands: rows, total };
}
