const {chromium}=require('playwright');const C=require('../core.js');const {LEVELS}=require('../levels.js');
(async()=>{const b=await chromium.launch();
const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+require('fs').readFileSync(require('path').join(__dirname,'../index.html'),'utf8')+'</body></html>';
const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.setContent(html);await p.waitForTimeout(600);
for(const d of LEVELS){const L=C.parseLevel(d);L.period=840;const path=C.solve(L,100,4000000).path;
 await p.click('#lv-'+d.id);await p.click('#go');await p.waitForTimeout(250);
 if([1,3,5].includes(d.id))await p.screenshot({path:require('path').join(require('os').tmpdir(),'n'+d.id+'.png'),clip:{x:56,y:100,width:780,height:d.id===5?720:470}});
 for(const c of path){await p.keyboard.press({U:'ArrowUp',D:'ArrowDown',L:'ArrowLeft',R:'ArrowRight','.':' '}[c]);await p.waitForTimeout(25);}
 await p.waitForTimeout(800);console.log(d.id,(await p.textContent('#card')).replace(/\s+/g,' ').slice(0,26));}
console.log('errors',errs);await b.close();})();
