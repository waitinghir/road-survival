// Solve every level, record its minimum steps as par, and inline everything into game/index.html.
// Usage: node game/build.js
const fs = require('fs'), path = require('path');
const here = f => path.join(__dirname, f);
const C = require('./core.js'); const { LEVELS } = require('./levels.js');
const pars = {};
for (const d of LEVELS) {
  const L = C.parseLevel(d); L.period = 840;
  const r = C.solve(L, 100, 4000000);
  if (r.steps < 0) throw new Error('level ' + d.id + ' is unsolvable');
  pars[d.id] = r.steps; console.log(d.id, d.name, r.steps, r.path);
}
const strip = s => s.replace(/if \(typeof module !== 'undefined'\) module\.exports = .*\n/, '');
let t = fs.readFileSync(here('template.html'), 'utf8');
t = t.replace('/*__CORE__*/', strip(fs.readFileSync(here('core.js'), 'utf8')))
  .replace('/*__LEVELS__*/', strip(fs.readFileSync(here('levels.js'), 'utf8')) + '\n// par = minimum steps, found by the solver at build time\nLEVELS.forEach(l => { l.par = ' + JSON.stringify(pars) + '[l.id]; });\n');
if (t.includes('module.exports')) throw new Error('an export statement leaked into the page');
fs.writeFileSync(here('index.html'), t);
console.log('wrote game/index.html');
