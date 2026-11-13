// Pushing spec changes into the running emitters
// ------------------------------------------------------------------ live updating
function reinstantiate() { player.emitters = fakeSim.instantiate(); showWarnings(); }
function live(what) { // push spec changes into the running emitter
  var pe = cur(); if (!pe) return;
  var lv = liveFor(pe);
  if (!lv) { reinstantiate(); return; }
  lv.rebuild(what || 'all'); if (lv.siblings) lv.link(lv.siblings);
  showWarnings();
}
function liveAll() { player.emitters.forEach(function (em) { em.rebuild('actions'); }); }
function showWarnings() {
  var w = $('warn'); var ws = warnings.slice(-4);
  w.style.display = ws.length ? 'block' : 'none'; w.textContent = ws.join('\n');
}
