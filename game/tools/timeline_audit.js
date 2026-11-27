// check: if the player waits k turns, they are hit exactly at the first turn the preview said
const C=require('../core.js');const {LEVELS}=require('../levels.js');
for(const d of LEVELS){const L=C.parseLevel(d);let ok=0,bad=0;
 for(let r=0;r<200;r++){let s=C.initState(L);
  for(let i=0;i<40;i++){const m=['up','down','left','right',null][Math.floor(Math.random()*5)];const n=C.step(L,s,m);if(!n)continue;if(n.status!=='play')break;s=n;
   const tl=C.dangerTimeline(L,s,3);const pr=s.push.find(q=>q.k==='stroller');const cand=[tl.get(s.p.x+','+s.p.y),pr&&tl.get(pr.x+','+pr.y)].filter(Boolean);const want=cand.length?Math.min(...cand):0;
   let w=s,got=0;for(let k=1;k<=3;k++){w=C.step(L,w,null);if(w.status==='crash'){got=k;break;}if(w.status!=='play')break;}
   if(w.status!=='play'&&w.status!=='crash'){continue;}
   want===got?ok++:bad++;}}
 console.log(d.id,'ok',ok,'mismatch',bad);}
