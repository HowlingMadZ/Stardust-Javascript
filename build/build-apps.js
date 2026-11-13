'use strict';
/* Builds the self-contained HTML pages in dist/ from src/apps/*.html templates. */
const fs = require('fs'), path = require('path');

module.exports = function (root, libText) {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  const dist = path.join(root, 'dist');
  const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const b64 = (p) => fs.readFileSync(path.join(root, p)).toString('base64');
  const indent = (t) => t.split('\n').map((l) => (l ? '  ' + l : l)).join('\n');
  const frag = (base, list) => list.map((f) => `/* ---- ${f} ---- */\n` + rd(base + f).trimEnd()).join('\n\n');
  const safe = (t, what) => { if (/<\/script/i.test(t)) throw new Error('"</script" inside ' + what); return t; };

  const flash = rd('src/helpers/sprite-flash.js');
  fs.writeFileSync(path.join(dist, 'sprite-flash.js'), flash);

  const core = "/*! stardust-editor-core.js - schema, normalisation and the .sde writer of the editor */\n(function (root) {\n  'use strict';\n\n" +
    indent(frag('src/editor/', manifest.editorCore)) + "\n})(typeof window !== 'undefined' ? window : this);\n";
  const ui = "/*! stardust-editor-ui.js - the editor application */\n(function () {\n  'use strict';\n\n" +
    indent(frag('src/editor/', manifest.editorUi)) + "\n})();\n";

  const list = (dir, nameFn) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.sde')).sort()
    .map((f, i) => ({ name: nameFn(f, i), b64: b64(dir + '/' + f) }));
  const fill = (tpl, map) => { let t = rd('src/apps/' + tpl); for (const k in map) t = t.split('/*__' + k + '__*/').join(safe(map[k], k)); return t; };
  const out = (name, text) => { fs.writeFileSync(path.join(dist, name), text); console.log('dist/' + name, text.length, 'bytes'); };

  out('stardust-player.html', fill('player.html', { STARDUST: libText, SIMS: JSON.stringify(list('examples/player', (f) => f.replace(/\.sde$/, ''))) }));
  out('stardust-editor.html', fill('editor.html', {
    STARDUST: libText, CORE: core, UI: ui,
    EXAMPLES: JSON.stringify(list('examples/editor', (f, i) => 'Original editor example ' + (i + 1)))
  }));
  const poof = JSON.stringify(b64('examples/effects/garment-poof.sde')), shirt = JSON.stringify(b64('examples/shirt.png'));
  out('outfit-poof-test.html', fill('outfit-poof-test.html', { STARDUST: libText, SDE: poof, SHIRT: shirt }));
  out('layered-outfit-poof-demo.html', fill('layered-outfit-poof-demo.html', { STARDUST: libText, FLASH: flash, SDE: poof, SHIRT: shirt }));
};
