// Export the "level 3, stroller pushed onto the road" moment used by every concept render into art/scene.json.
// Usage: node art/export-scene.js
const fs = require('fs'), path = require('path');
const C = require('../game/core.js'); const { LEVELS } = require('../game/levels.js');
const L = C.parseLevel(LEVELS.find(l => l.id === 3)); L.period = 840;
const M = { U: 'up', D: 'down', L: 'left', R: 'right', '.': null };
let s = C.initState(L);
for (const c of '..LLLLLDLLU.URDRDLL') s = C.step(L, s, M[c]);
const dz = C.dangerTimeline(L, s, 3);
const cars = s.cars.map(c => { const ln = L.lanes[c.lane]; const [x, y] = ln.cells[c.i];
  const n = ln.cells[Math.min(c.i + 1, ln.cells.length - 1)], p = ln.cells[Math.max(c.i - 1, 0)];
  return { x, y, dir: n[0] - p[0] > 0 ? 'right' : 'left', id: c.id }; });
const scene = { w: L.w, h: L.h, tiles: L.tiles.map(r => r.join('')), fixed: L.parked,
  // a shop sign and a trash bin are added so every concept shows pushable vs fixed props
  push: [...s.push, { x: 11, y: 1, k: 'sign' }, { x: 4, y: 2, k: 'bin' }], cars, player: s.p,
  danger: [...dz].map(([k, v]) => { const [x, y] = k.split(',').map(Number); return { x, y, k: v }; }) };
fs.writeFileSync(path.join(__dirname, 'scene.json'), JSON.stringify(scene));
console.log('wrote art/scene.json');
