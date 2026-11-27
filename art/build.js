// Inject art/scene.json into the 3D pages. Output: art/dist/keyart.html (animated sample) and art/dist/concept.html (concept renderer, ?s=candy|neon|clay|comic|dawn).
const fs = require('fs'), path = require('path');
const here = f => path.join(__dirname, f);
const scene = fs.readFileSync(here('scene.json'), 'utf8');
fs.mkdirSync(here('dist'), { recursive: true });
for (const f of ['keyart.html', 'concept.html']) {
  fs.writeFileSync(here('dist/' + f), fs.readFileSync(here(f), 'utf8').replace('/*__SCENE__*/', scene));
  console.log('wrote art/dist/' + f);
}
