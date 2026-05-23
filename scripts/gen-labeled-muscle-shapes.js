/**
 * Regenerates `data/labeledMuscleSvgShapes.js` from:
 *   assets/images/musclessvglabeledfront.svg
 *   assets/images/musclessvglabeledback.svg
 *
 * Usage: node scripts/gen-labeled-muscle-shapes.js
 */
const fs = require('fs');
const path = require('path');

const scriptDir = path.dirname(fs.realpathSync(process.argv[1]));
const root = path.join(scriptDir, '..');

function extractPaths(fileRel) {
  const file = path.join(root, fileRel);
  const s = fs.readFileSync(file, 'utf8');
  const vb = (s.match(/viewBox="([^"]+)"/) || [])[1];
  const tr = (s.match(/<g[^>]*transform="([^"]+)"/) || [])[1];
  const out = [];
  const re = /<path\b([\s\S]*?)(?:\/\s*>|><\/path>)/g;
  let m;
  while ((m = re.exec(s))) {
    const block = m[1];
    const id = (block.match(/\bid="([^"]+)"/) || [])[1];
    const dm = block.match(/\bd="([\s\S]*?)"/);
    const d = dm ? dm[1].replace(/\s+/g, ' ').trim() : '';
    if (id && d) out.push({ id, d });
  }
  return { vb, tr, paths: out };
}

const front = extractPaths('assets/images/musclessvglabeledfront.svg');
const back = extractPaths('assets/images/musclessvglabeledback.svg');
const esc = (d) => d.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

let js = `/**\n * Auto-generated from musclessvglabeledfront.svg / musclessvglabeledback.svg\n * Run: node scripts/gen-labeled-muscle-shapes.js\n */\n\n`;
js += `export const LABELED_FRONT_VIEW_BOX = '${front.vb}';\n`;
js += `export const LABELED_FRONT_LAYER_TRANSFORM = '${front.tr}';\n`;
js += `export const LABELED_BACK_VIEW_BOX = '${back.vb}';\n`;
js += `export const LABELED_BACK_LAYER_TRANSFORM = '${back.tr}';\n\n`;
js += `export const LABELED_FRONT_PATH_SHAPES = [\n`;
for (const p of front.paths) {
  js += `  { id: '${p.id}', type: 'path', d: '${esc(p.d)}' },\n`;
}
js += `];\n\nexport const LABELED_BACK_PATH_SHAPES = [\n`;
for (const p of back.paths) {
  js += `  { id: '${p.id}', type: 'path', d: '${esc(p.d)}' },\n`;
}
js += `];\n`;

const outPath = path.join(root, 'data/labeledMuscleSvgShapes.js');
fs.writeFileSync(outPath, js);
console.log(`Wrote ${outPath} (${front.paths.length} front paths, ${back.paths.length} back paths)`);
