const C=require('../core.js');
const vs=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));const M={U:'up',D:'down',L:'left',R:'right','.':null};
for(const d of vs){const L=C.parseLevel(d);L.period=840;const r=C.solve(L,90,3000000);let road=0;
 if(r.steps>0){let s=C.initState(L);for(const c of r.path){s=C.step(L,s,M[c]);const pr=s.push.find(p=>p.k==='stroller');if(L.laneCell.has(pr.x+','+pr.y))road++;}}
 console.log(d.label.padEnd(8),'min',r.steps,'stroller-on-road turns',road,r.path||'',r.reason||'');}
