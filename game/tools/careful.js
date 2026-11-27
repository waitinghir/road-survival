// simulated player who can see the danger preview: never ends a move on a red cell, otherwise wanders with a bias toward the goal
const C=require('../core.js');const {LEVELS}=require('../levels.js');
const id=+process.argv[2]; const variant=process.argv[3]?JSON.parse(process.argv[3]):null;
const d={...LEVELS.find(l=>l.id===id)}; if(variant){d.map=d.map.slice();for(const[k,v]of Object.entries(variant.map||{}))d.map[k]=v; if(variant.lanes)d.lanes=variant.lanes;}
const L=C.parseLevel(d);L.period=840;
console.log('min',C.solve(L,90,2000000).steps);
let wins=0,deaths=0,stuck=0;const N=400;
const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
for(let k=0;k<N;k++){let s=C.initState(L);let i=0;
 for(;i<300;i++){const danger=C.dangerCells(L,s);
  const opts=[];for(const m of ['up','down','left','left','left',null]){const n=C.step(L,s,m);if(!n)continue;const key=n.p.x+','+n.p.y;if(danger.has(key))continue;opts.push(n);}
  if(!opts.length){const n=C.step(L,s,null);s=n;}else s=opts[Math.floor(Math.random()*opts.length)];
  if(s.status!=='play')break;}
 if(s.status==='win')wins++;else if(s.status!=='play')deaths++;else stuck++;}
console.log('careful: wins',wins,'deaths',deaths,'stuck',stuck,'of',N);
