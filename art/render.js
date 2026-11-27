// Render the five concept hero shots to art/concepts/*.jpg with headless Chromium.
// The page loads three.js from jsDelivr; here those requests are served from node_modules so it also works offline.
// Usage: node art/render.js [candy neon clay comic dawn]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const THREE_DIR = path.join(__dirname, '..', 'node_modules', 'three');
const built = path.join(__dirname, 'dist/concept.html');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const keys = process.argv.slice(2).length ? process.argv.slice(2) : ['candy', 'neon', 'clay', 'comic', 'dawn'];
  for (const k of keys) {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => r.fulfill({ path: path.join(THREE_DIR, r.request().url().split('three@0.160.0/')[1]), contentType: 'application/javascript' }));
    await p.route('https://render.local/**', r => r.fulfill({ body: fs.readFileSync(built, 'utf8'), contentType: 'text/html' }));
    await p.goto('https://render.local/c?s=' + k);
    await p.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    await p.waitForTimeout(500);
    await (await p.$('#stage')).screenshot({ path: path.join(__dirname, 'concepts', k + '.jpg'), type: 'jpeg', quality: 90 });
    console.log(k, errs.length ? errs.slice(0, 3) : 'ok'); await p.close();
  }
  await b.close();
})();
