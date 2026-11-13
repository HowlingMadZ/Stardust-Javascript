// Right-hand inspector panel
// ------------------------------------------------------------------ inspector
function section(title, open) {
  var d = el('details', 'sec'); d.open = open !== false; d.appendChild(el('summary', null, title)); return d;
}
function renderInspector() {
  var host = $('inspector'), pe = cur(), scroll = host.scrollTop; host.innerHTML = '';
  if (!pe) { host.appendChild(el('div', 'empty', 'No emitter. Add one on the left, or open a .sde file.')); return; }
  var sp = pe.spec;
  // emitter
  var s1 = section('Emitter ' + pe.id);
  s1.appendChild(numRow('Max FPS', sp, 'fps', { min: 5, max: 60, step: 1 }, function () { live('emitter'); }));
  s1.appendChild(boolRow('Active (emitting)', sp, 'active', function () { live('emitter'); }));
  host.appendChild(s1);
  // clock
  var s2 = section('Emission (clock)');
  s2.appendChild(singleSub('', sp, 'clock', 'clock', E.CLOCK_TYPES, function () { live('clock'); }));
  var fb = el('button', 'fire', '🔥 Fire a burst now'); fb.onclick = function () { var lv = liveFor(pe); if (lv && lv.clock.impulse) lv.clock.impulse(); else if (lv) lv.createParticles(Math.max(1, Math.round(sp.clock.ticksPerCall / 3))); };
  s2.appendChild(fb); host.appendChild(s2);
  // renderer
  var s3 = section('Rendering');
  paramControls(sp.particleHandler, E.handlerParams, function () { live('handler'); }, s3);
  host.appendChild(s3);
  // textures
  var s4 = section('Textures (' + pe.frames.length + ')');
  var strip = el('div', 'tex');
  pe.frames.forEach(function (f, i) {
    var t = el('div', 'texitem'), th = f.canvas.cloneNode ? document.createElement('canvas') : null;
    th.width = th.height = 48; var tc = th.getContext('2d'), k = Math.min(44 / f.canvas.width, 44 / f.canvas.height, 1);
    tc.drawImage(f.canvas, 24 - f.canvas.width * k / 2, 24 - f.canvas.height * k / 2, f.canvas.width * k, f.canvas.height * k);
    t.appendChild(th); t.appendChild(el('span', 'tiny', f.canvas.width + '×' + f.canvas.height));
    var x = el('button', 'mini', '✕'); x.onclick = function () { pushUndo(true); pe.frames = pe.frames.filter(function (_, j) { return j !== i; }); syncFrames(); renderInspector(); };
    t.appendChild(x); strip.appendChild(t);
  });
  s4.appendChild(strip);
  s4.appendChild(el('div', 'desc', 'Several textures become an animation (see "Animation speed"). Textures are white-ish and get tinted by the Colour gradient.'));
  var ts = el('select', 'addsel'); ts.appendChild(Object.assign(el('option', null, '＋ Add built-in texture…'), { value: '' }));
  Object.keys(E.builtinTextures).forEach(function (k) { ts.appendChild(Object.assign(el('option', null, k), { value: k })); });
  ts.onchange = function () { if (!ts.value) return; pushUndo(true); pe.frames = pe.frames.concat([{ name: ts.value, canvas: E.builtinTextures[ts.value]() }]); syncFrames(); renderInspector(); };
  s4.appendChild(ts);
  var up = el('button', 'add', '＋ Add image file…'); up.onclick = function () { $('imgfile').click(); };
  s4.appendChild(up); host.appendChild(s4);
  // initializers
  var s5 = section('Initializers (set up new particles)');
  sp.initializers.forEach(function (i, idx) { s5.appendChild(card('initializer', i, sp.initializers, idx, function () { live('initializers'); })); });
  s5.appendChild(addMenu('initializer', sp.initializers, 'initializers')); host.appendChild(s5);
  // actions
  var s6 = section('Actions (every frame)');
  sp.actions.forEach(function (a, idx) { s6.appendChild(card('action', a, sp.actions, idx, function () { live('actions'); })); });
  s6.appendChild(addMenu('action', sp.actions, 'actions')); host.appendChild(s6);
  host.scrollTop = scroll;
}
function syncFrames() { var pe = cur(), lv = pe && liveFor(pe); if (lv) lv.frames = frameRects(pe); lv && (lv.tintCache = {}); }
