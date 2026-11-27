// compare the red preview with what actually happens, over random play in every level
const C=require('../core.js');const {LEVELS}=require('../levels.js');
for(const d of LEVELS){const L=C.parseLevel(d);let redSafe=0,greenDeath=0,n=0;const ex={};
 for(let k=0;k<300;k++){let s=C.initState(L);for(let i=0;i<80;i++){const dz=C.dangerCells(L,s);
  const m=['up','down','left','right',null][Math.floor(Math.random()*5)];const nx=C.step(L,s,m);if(!nx)continue;
  if(nx.status==='ticket'||nx.status==='win')break;const key=nx.p.x+','+nx.p.y;n++;
  if(dz.has(key)&&nx.status==='play'){redSafe++;ex.redSafe=ex.redSafe||key;}
  const pr=nx.push.find(q=>q.k==='stroller');const prk=pr&&(pr.x+','+pr.y);if(!dz.has(key)&&!(nx.msg==='stroller'&&dz.has(prk))&&nx.status==='crash'){greenDeath++;ex.greenDeath=ex.greenDeath||key;}
  s=nx;if(s.status!=='play')break;}}
 console.log(d.id,'moves',n,'red-but-safe',redSafe,'unmarked-but-hit',greenDeath,JSON.stringify(ex));}
