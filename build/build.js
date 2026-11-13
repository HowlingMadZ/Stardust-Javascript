#!/usr/bin/env node
/* Concatenates the fragments listed in build/manifest.json into dist/stardust.js (+ .min.js). */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const indent = (t) => t.split('\n').map((l) => (l ? '  ' + l : l)).join('\n');

const banner = `/*!
 * stardust.js v${pkg.version} - a canvas 2D port of the Stardust particle engine
 * https://github.com/ (your repository)
 *
 * Engine maths follow Stardust (c) 2010 Allen Chou (CJ Cat), (c) 2014 Plumbee Ltd., (c) 2015 FunkyPanda Ltd., MIT licence.
 * This port: no dependencies, plain <script> (no modules / fetch) so it also runs from file://.
 * Reads .sde simulation files made by the Stardust editor. See LICENSE.
 */
`;

function buildLibrary() {
  const parts = manifest.library.map((f) => `/* ---- ${f} ---- */\n` + read('src/main/js/' + f).trimEnd());
  const body = parts.join('\n\n');
  // the version in Exports.js follows package.json
  return banner + "(function (root) {\n  'use strict';\n\n" + indent(body.replace("Stardust.version = '1.0.0';", `Stardust.version = '${pkg.version}';`)) +
    "\n})(typeof window !== 'undefined' ? window : this);\n";
}

async function main() {
  const dist = path.join(root, 'dist'); fs.mkdirSync(dist, { recursive: true });
  const lib = buildLibrary();
  fs.writeFileSync(path.join(dist, 'stardust.js'), lib);
  console.log('dist/stardust.js', lib.length, 'bytes');
  try {
    const terser = require('terser');
    const r = await terser.minify(lib, { compress: { passes: 2 }, mangle: true, format: { comments: /^!/ } });
    fs.writeFileSync(path.join(dist, 'stardust.min.js'), r.code);
    console.log('dist/stardust.min.js', r.code.length, 'bytes');
  } catch (e) {
    console.log('terser not installed (npm install) - skipping stardust.min.js');
  }
  require('./build-apps.js')(root, lib);
}
main().catch((e) => { console.error(e); process.exit(1); });
