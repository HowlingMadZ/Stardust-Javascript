// Binding the toolbar, keyboard and drag-and-drop
// ------------------------------------------------------------------ wiring
function bind() {
  $('undo').onclick = undo; $('redo').onclick = redo;
  $('open').onclick = function () { $('sdefile').click(); };
  $('sdefile').onchange = function (e) { openFiles(e.target.files); e.target.value = ''; };
  $('imgfile').onchange = function (e) { openFiles(e.target.files); e.target.value = ''; };
  $('bgfile').onchange = function (e) { if (e.target.files[0]) setBackground(e.target.files[0]); e.target.value = ''; };
  $('setbg').onclick = function () { $('bgfile').click(); };
  $('save').onclick = saveSde;
  $('newem').onclick = newEmitter; $('cloneem').onclick = cloneEmitter;
  var ex = $('examples'); (window.__EXAMPLES__ || []).forEach(function (it, i) { var o = document.createElement('option'); o.value = 'sde:' + i; o.textContent = it.name; ex.appendChild(o); });
  $('pname').onchange = function () { project.name = this.value; };
  $('examples').onchange = function () { if (this.value) example(this.value); this.value = ''; };
  $('pause').onclick = function () { player.timeScale = player.timeScale ? 0 : parseFloat($('speed').value); this.textContent = player.timeScale ? 'Pause' : 'Play'; };
  $('restart').onclick = function () { reinstantiate(); };
  $('speed').oninput = function () { if (player.timeScale) player.timeScale = parseFloat(this.value); $('speedv').textContent = parseFloat(this.value).toFixed(2) + '×'; };
  $('gizmos').onchange = drawGizmos;
  $('showall').onchange = function () { showAll = this.checked; drawGizmos(); };
  $('showbg').onchange = function () { showBg = this.checked; player.showBackground = showBg; };
  $('inclbg').onchange = function () { project.includeBackground = this.checked; };
  $('rmbg').onclick = function () { project.background = null; project.includeBackground = false; fakeSim.backgroundImage = null; fakeSim.hasBackground = false; updateTitle(); };
  $('resetview').onclick = function () { player.viewX = W / 2; player.viewY = H / 2; player.viewZoom = 1; $('zoomv').textContent = '100%'; drawGizmos(); };
  $('bgstyle').onchange = function () { $('stage').className = this.value; };
  $('smooth').onchange = function () { player.forceSmoothing = this.checked; };
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveSde(); }
    else if (tag !== 'input' && tag !== 'select' && e.code === 'Space') { e.preventDefault(); $('pause').click(); }
  });
  var dropEl = $('drop'), depth = 0;
  window.addEventListener('dragenter', function (e) { e.preventDefault(); depth++; dropEl.classList.add('on'); });
  window.addEventListener('dragleave', function () { if (--depth <= 0) { depth = 0; dropEl.classList.remove('on'); } });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); depth = 0; dropEl.classList.remove('on'); if (e.dataTransfer.files.length) openFiles(e.dataTransfer.files); });
  window.addEventListener('resize', resize);
  window.addEventListener('beforeunload', function (e) { if (undoStack.length > 3) { e.preventDefault(); e.returnValue = ''; } });
  player.onframe = function () {
    $('stats').textContent = player.numParticles + ' particles · ' + Math.round(player.fpsSmooth) + ' fps';
  };
}
