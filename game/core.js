// ===== CORE (pure game logic, no DOM) =====
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LEFT_OF = { up: 'left', left: 'down', down: 'right', right: 'up' };
const BACK_OF = { up: 'down', down: 'up', left: 'right', right: 'left' };
const JUNCTION = new Set(['I', 'Z', 'W']);
const PED_OK = new Set(['.', 'r', 'I', 'Z', 'X', 'M', 'W', 'G', 'P', '^']);
const RIDER_OK = new Set(['r', 'I', 'Z', 'X', 'M', 'W', 'G']);
const PUSH_OK = new Set(['.', 'P', 'M', 'r']);
// a stroller can roll onto the road (and get hit there), but not up or down a step
const STROLLER_OK = new Set(['.', 'P', 'r', 'Z', 'I', 'G']);
// entity chars -> [entity kind, underlying tile]
// fixed: s/S parked scooter, c/C parked car. pushable: n shop sign, u potted plant, b trash bin, o/q cone, B stroller
const ENT = {
  s: ['scooter', '.', 1], S: ['scooter', 'M', 1], c: ['car', 'r', 1], C: ['car', '.', 1],
  n: ['sign', '.'], u: ['plant', '.'], b: ['bin', '.'], o: ['cone', 'r'], q: ['cone', 'M'], B: ['stroller', '.'],
};

function parseLevel(def) {
  const h = def.map.length, w = def.map[0].length;
  const tiles = [], push = [], parked = [];
  let start = null;
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const ch = def.map[y][x];
      if (ch === '@') { start = { x, y }; row.push(def.who === 'rider' ? (def.startTile || 'r') : (def.startTile || '.')); }
      else if (ENT[ch]) {
        const [k, t, fixed] = ENT[ch]; row.push(t);
        if (fixed) parked.push({ x, y, k }); else push.push({ x, y, k });
      } else row.push(ch);
    }
    tiles.push(row);
  }
  const lanes = (def.lanes || []).map((ln, li) => {
    const cells = [];
    for (let i = 0; i < ln.path.length - 1; i++) {
      let [x, y] = ln.path[i]; const [x2, y2] = ln.path[i + 1];
      const dx = Math.sign(x2 - x), dy = Math.sign(y2 - y);
      if (i === 0) cells.push([x, y]);
      while (x !== x2 || y !== y2) { x += dx; y += dy; cells.push([x, y]); }
    }
    return { cells, spawn: ln.spawn, kind: ln.kind || 'car', speed: ln.speed || 1, id: li };
  });
  const laneCell = new Set();
  lanes.forEach(l => l.cells.forEach(([x, y]) => laneCell.add(x + ',' + y)));
  return { ...def, w, h, tiles, start, push, parked, lanes, laneCell, stroller: push.some(p => p.k === 'stroller') };
}

function tileAt(L, x, y) { return (x < 0 || y < 0 || x >= L.w || y >= L.h) ? '#' : L.tiles[y][x]; }

function lightAt(L, tick) {
  if (!L.light) return { v: 'g', h: 'g', remain: 0, phase: -1 };
  const { g, r } = L.light, len = 2 * g + 2 * r;
  const t = ((tick + (L.light.offset || 0)) % len + len) % len;
  if (t < g) return { v: 'g', h: 'r', remain: g - t, phase: 0 };
  if (t < g + r) return { v: 'r', h: 'r', remain: g + r - t, phase: 1 };
  if (t < 2 * g + r) return { v: 'r', h: 'g', remain: 2 * g + r - t, phase: 2 };
  return { v: 'r', h: 'r', remain: len - t, phase: 3 };
}

let CAR_ID = 1;
function carCell(L, c) { return L.lanes[c.lane].cells[c.i]; }

function trafficTick(L, s, withPlayer) {
  const lt = lightAt(L, s.tick);
  const occ = new Set(s.cars.map(c => carCell(L, c).join(',')));
  const pushSet = new Set(s.push.filter(p => p.k !== 'stroller').map(p => p.x + ',' + p.y));
  const pram = s.push.find(p => p.k === 'stroller');
  const parkSet = new Set(L.parked.map(p => p.x + ',' + p.y));
  const maxSp = Math.max(1, ...L.lanes.map(l => l.speed));
  for (let sub = 0; sub < maxSp; sub++)
  for (const lane of L.lanes) {
    if (sub >= lane.speed) continue;
    const mine = s.cars.filter(c => c.lane === lane.id && !c.gone).sort((a, b) => b.i - a.i);
    for (const c of mine) {
      const cur = lane.cells[c.i];
      if (c.i === lane.cells.length - 1) { occ.delete(cur.join(',')); c.gone = true; continue; }
      const n = lane.cells[c.i + 1], nk = n.join(',');
      const curT = tileAt(L, cur[0], cur[1]), nT = tileAt(L, n[0], n[1]);
      if (!JUNCTION.has(curT) && JUNCTION.has(nT)) {
        const axis = n[0] !== cur[0] ? 'h' : 'v';
        if (lt[axis] !== 'g') continue;
      }
      if (occ.has(nk) || pushSet.has(nk) || parkSet.has(nk)) continue;
      if (withPlayer && s.p.x === n[0] && s.p.y === n[1]) {
        if (nT === 'W') continue; // 待轉區 is safe
        if (s.status === 'play') { s.status = 'crash'; s.msg = lane.kind; }
      }
      if (withPlayer && pram && pram.x === n[0] && pram.y === n[1] && s.status === 'play') { s.status = 'crash'; s.msg = 'stroller'; }
      occ.delete(cur.join(',')); occ.add(nk); c.i++;
    }
  }
  s.cars = s.cars.filter(c => !c.gone);
  for (const lane of L.lanes) {
    const sp = lane.spawn;
    if (sp && sp[s.tick % sp.length] === '1') {
      const k = lane.cells[0].join(',');
      const onPlayer = withPlayer && s.p.x === lane.cells[0][0] && s.p.y === lane.cells[0][1];
      if (!occ.has(k)) {
        s.cars.push({ lane: lane.id, i: 0, id: CAR_ID++ }); occ.add(k);
        // a car driving in from off the map hits whoever stands at the edge
        if (onPlayer && s.status === 'play') { s.status = 'crash'; s.msg = lane.kind; }
        if (withPlayer && pram && pram.x === lane.cells[0][0] && pram.y === lane.cells[0][1] && s.status === 'play') { s.status = 'crash'; s.msg = 'stroller'; }
      }
    }
  }
  s.tick++;
}

function initState(L) {
  const s = { p: { ...L.start, f: L.facing || 'up' }, push: L.push.map(p => ({ ...p })), cars: [], tick: 0, status: 'play', msg: '', steps: 0 };
  for (let i = 0; i < (L.warm ?? 24); i++) trafficTick(L, s, false);
  return s;
}

function cloneState(s) {
  return { p: { ...s.p }, push: s.push.map(p => ({ ...p })), cars: s.cars.map(c => ({ ...c })), tick: s.tick, status: s.status, msg: s.msg, steps: s.steps };
}

// returns new state, or null if the move is blocked (no turn spent)
function step(L, s0, dir) {
  if (s0.status !== 'play') return null;
  const s = cloneState(s0);
  const rider = L.who === 'rider';
  s.pushed = null;
  if (dir) {
    const [dx, dy] = DIRS[dir];
    const fromT = tileAt(L, s.p.x, s.p.y);
    const nx = s.p.x + dx, ny = s.p.y + dy;
    const t = tileAt(L, nx, ny);
    const ok = rider ? RIDER_OK : PED_OK;
    if (!ok.has(t)) return null;
    if (L.parked.some(p => p.x === nx && p.y === ny)) return null;
    const carHere = s.cars.some(c => { const [cx, cy] = carCell(L, c); return cx === nx && cy === ny; });
    if (carHere) return null;
    const pi = s.push.findIndex(p => p.x === nx && p.y === ny);
    if (pi >= 0) {
      const bx = nx + dx, by = ny + dy, bt = tileAt(L, bx, by);
      if (s.push[pi].k === 'stroller') { if (!STROLLER_OK.has(bt) || tileAt(L, nx, ny) === '^') return null; }
      else if (!PUSH_OK.has(bt) || L.laneCell.has(bx + ',' + by)) return null;
      if (s.push.some(p => p.x === bx && p.y === by)) return null;
      if (L.parked.some(p => p.x === bx && p.y === by)) return null;
      if (s.cars.some(c => { const [cx, cy] = carCell(L, c); return cx === bx && cy === by; })) return null;
      s.push[pi] = { ...s.push[pi], x: bx, y: by };
      s.pushed = s.push[pi];
    }
    // rider traffic rules
    if (rider) {
      const lt = lightAt(L, s.tick);
      if (t === 'X') { s.status = 'ticket'; s.msg = 'nomoto'; }
      else if (fromT === 'I' && (dir === LEFT_OF[s.p.f] || dir === BACK_OF[s.p.f])) { s.status = 'ticket'; s.msg = 'leftturn'; }
      else if (t === 'I' && fromT !== 'I') {
        const axis = dx !== 0 ? 'h' : 'v';
        if (lt[axis] !== 'g') { s.status = 'ticket'; s.msg = 'redlight'; }
      }
    }
    s.p.x = nx; s.p.y = ny; s.p.f = dir;
  }
  s.steps++;
  if (s.status !== 'play') return s;
  if (L.stroller) { const pr = s.push.find(p => p.k === 'stroller'); if (tileAt(L, pr.x, pr.y) === 'G') { s.status = 'win'; return s; } }
  else if (tileAt(L, s.p.x, s.p.y) === 'G') { s.status = 'win'; return s; }
  trafficTick(L, s, true);
  return s;
}


// cells that a car will drive into (or through) during the next traffic tick
function dangerCells(L, s) {
  const t = cloneState(s); t.status = 'play';
  const before = new Map(t.cars.map(c => [c.id, c.i]));
  trafficTick(L, t, false);
  const out = new Set();
  const after = new Map(t.cars.map(c => [c.id, c]));
  const mark = (lane, from, to) => { for (let i = from; i <= to; i++) { const [x, y] = lane.cells[i]; if (tileAt(L, x, y) !== 'W') out.add(x + ',' + y); } };
  for (const c of t.cars) mark(L.lanes[c.lane], before.has(c.id) ? before.get(c.id) + 1 : 0, c.i);
  // cars that drove off the map this tick still crossed the cells up to the edge
  for (const c of s.cars) if (!after.has(c.id)) { const lane = L.lanes[c.lane]; mark(lane, c.i + 1, lane.cells.length - 1); }
  return out;
}


// for the next n traffic ticks (player standing still), the first tick at which a car drives into each cell
function dangerTimeline(L, s, n) {
  const out = new Map();
  let cur = cloneState(s); cur.status = 'play';
  for (let k = 1; k <= n; k++) {
    for (const key of dangerCells(L, cur)) if (!out.has(key)) out.set(key, k);
    const nx = cloneState(cur); trafficTick(L, nx, false); cur = nx;
  }
  return out;
}

function stateKey(L, s) {
  return s.p.x + ',' + s.p.y + ',' + (L.who === 'rider' ? s.p.f : '') + '|' +
    s.push.map(p => p.x + ',' + p.y).sort().join(';') + '|' +
    s.cars.map(c => c.lane + ':' + c.i).sort().join(';') + '|' + (s.tick % (L.period || 840));
}

function solve(L, maxDepth = 80, limit = 400000) {
  const s0 = initState(L);
  let frontier = [{ s: s0, path: '' }];
  const seen = new Set([stateKey(L, s0)]);
  const moves = [null, 'left', 'up', 'down', 'right'];
  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const next = [];
    for (const { s, path } of frontier) {
      for (const m of moves) {
        const n = step(L, s, m);
        if (!n) continue;
        const np = path + (m ? m[0].toUpperCase() : '.');
        if (n.status === 'win') return { steps: d + 1, path: np, explored: seen.size };
        if (n.status !== 'play') continue;
        const k = stateKey(L, n);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ s: n, path: np });
      }
    }
    if (seen.size > limit) return { steps: -1, explored: seen.size, reason: 'limit' };
    frontier = next;
  }
  return { steps: -1, explored: seen.size };
}

if (typeof module !== 'undefined') module.exports = { dangerTimeline, dangerCells, parseLevel, initState, step, solve, lightAt, tileAt, carCell };
// ===== END CORE =====
