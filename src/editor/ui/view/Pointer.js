// Pointer interaction: drag handles, pan, zoom, click to fire
// pointer interaction: drag handles, pan with middle / space / empty drag, wheel zoom, click = fire action under mouse
var drag = null;
function pos(ev) { var r = gz.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
gz.addEventListener('pointerdown', function (ev) {
  var p = pos(ev), hit = null;
  if ($('gizmos').checked) for (var i = handles.length - 1; i >= 0; i--) { var s = w2s(handles[i].x, handles[i].y); if (Math.abs(s[0] - p[0]) < 8 && Math.abs(s[1] - p[1]) < 8) { hit = handles[i]; break; } }
  gz.setPointerCapture(ev.pointerId);
  if (hit && ev.button === 0) {
    pushUndo(true); drag = { kind: 'handle', h: hit }; if (hit.onselect) { selCard = hit.onselect; highlightSel(); }
  } else drag = { kind: 'pan', x: p[0], y: p[1], vx: player.viewX, vy: player.viewY, moved: false, button: ev.button };
});
gz.addEventListener('pointermove', function (ev) {
  var p = pos(ev), w = s2w(p[0], p[1]); $('coords').textContent = 'x ' + w[0].toFixed(0) + '  y ' + w[1].toFixed(0);
  if (!drag) {
    var over = false;
    for (var i = 0; i < handles.length; i++) { var s = w2s(handles[i].x, handles[i].y); if (Math.abs(s[0] - p[0]) < 8 && Math.abs(s[1] - p[1]) < 8) over = true; }
    gz.style.cursor = over ? 'move' : 'grab'; return;
  }
  if (drag.kind === 'handle') {
    var sn = ev.shiftKey ? 10 : 1; drag.h.drag(Math.round(w[0] / sn) * sn, Math.round(w[1] / sn) * sn);
    var what = 'all'; live('initializers'); live('actions'); refreshValues(); drawGizmos();
  } else {
    var dx = p[0] - drag.x, dy = p[1] - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    player.viewX = drag.vx + dx; player.viewY = drag.vy + dy; drawGizmos(); gz.style.cursor = 'grabbing';
  }
});
gz.addEventListener('pointerup', function (ev) {
  if (drag && drag.kind === 'pan' && !drag.moved && drag.button === 0) {
    // click: fire all "fire" actions of the selected emitter at their usual place and trigger a burst
    var lv = cur() && liveFor(cur());
    if (lv) { var fired = false; lv.actions.forEach(function (a) { if (a.fire) { a.fire(); fired = true; } }); if (lv.clock.impulse) lv.clock.impulse(); else if (!fired) lv.createParticles(Math.max(1, Math.round(cur().spec.clock.ticksPerCall / 4))); }
  }
  if (drag && drag.kind === 'handle') renderInspector();
  drag = null; gz.style.cursor = 'grab';
});
gz.addEventListener('wheel', function (ev) {
  ev.preventDefault(); var p = pos(ev), w = s2w(p[0], p[1]), k = Math.exp(-ev.deltaY * 0.0015);
  player.viewZoom = Math.min(8, Math.max(0.1, player.viewZoom * k));
  player.viewX = p[0] - w[0] * player.viewZoom; player.viewY = p[1] - w[1] * player.viewZoom; $('zoomv').textContent = Math.round(player.viewZoom * 100) + '%'; drawGizmos();
}, { passive: false });
function refreshValues() { // update visible inputs while dragging handles without rebuilding the DOM
  document.querySelectorAll('#inspector .prow input.num').forEach(function (n) { /* values refreshed lazily on mouseup via renderInspector */ });
}
