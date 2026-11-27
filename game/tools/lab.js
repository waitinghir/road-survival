// usage: node lab.js file.json  -> for each variant: min steps, path, pushes used, careful-player win rate
const C=require('../core.js');
const vs=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
const M={U:'up',D:'down',L:'left',R:'right','.':null};
for(const d of vs){const L=C.parseLevel(d);L.period=840;const r=C.solve(L,100,3000000);
 let pushes=0;if(r.steps>0){let s=C.initState(L);for(const c of r.path){const b=JSON.stringify(s.push);s=C.step(L,s,M[c]);if(JSON.stringify(s.push)!==b)pushes++;}}
 let wins=0;const N=300;
 if(r.steps>0)for(let k=0;k<N;k++){let s=C.initState(L);for(let i=0;i<300;i++){const dz=C.dangerCells(L,s);const opts=[];
  for(const m of d.bias||['up','down','left','left','left',null]){const n=C.step(L,s,m);if(!n)continue;if(n.status==='crash'||n.status==='ticket')continue;
   const pr=n.push.find(p=>p.k==='stroller');if(dz.has(n.p.x+','+n.p.y)||(pr&&dz.has(pr.x+','+pr.y)))continue;opts.push(n);}
  s=opts.length?opts[Math.floor(Math.random()*opts.length)]:C.step(L,s,null);if(s.status!=='play')break;}if(s.status==='win')wins++;}
 console.log((d.label||d.name).padEnd(14),'min',r.steps,'pushes',pushes,'careful',wins+'/'+N,r.path||'');}
