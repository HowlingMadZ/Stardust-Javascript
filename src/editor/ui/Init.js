// Start-up
function init() {
  bind(); resize(); updateUndoBtns();
  var qs = location.search.match(/[?&]sde=([^&]+)/);
  example('fire');
  undoStack = []; redoStack = []; updateUndoBtns();
  player.start();
  if (qs && /^https?:|^[\w./-]+\.sde$/i.test(decodeURIComponent(qs[1]))) {
    var x = new XMLHttpRequest(); x.open('GET', decodeURIComponent(qs[1])); x.responseType = 'arraybuffer';
    x.onload = function () { if (x.response) loadBuffer(x.response, qs[1].split('/').pop()); }; x.send();
  }
  window.__editor = { project: project, player: player, E: E, load: loadBuffer, save: function () { return E.buildSde({ emitters: project.emitters, background: project.background, includeBackground: project.includeBackground }); }, example: example, undo: undo, redo: redo, select: function (i) { sel = i; renderAll(); } };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
