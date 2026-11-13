// Left-hand emitter list, new / clone
// ------------------------------------------------------------------ emitter list
function renderList() {
  var host = $('elist'); host.innerHTML = '';
  project.emitters.forEach(function (pe, i) {
    var r = el('div', 'eitem' + (i === sel ? ' on' : ''));
    var th = document.createElement('canvas'); th.width = th.height = 28;
    if (pe.frames[0]) { var f = pe.frames[0].canvas, k = Math.min(26 / f.width, 26 / f.height, 1), x = th.getContext('2d'); x.fillStyle = '#333'; x.fillRect(0, 0, 28, 28); x.drawImage(f, 14 - f.width * k / 2, 14 - f.height * k / 2, f.width * k, f.height * k); }
    r.appendChild(th); r.appendChild(el('span', 'ename', 'Emitter ' + pe.id));
    var eye = el('button', 'mini', pe.spec.active === false ? '○' : '●'); eye.title = 'Toggle emitting';
    eye.onclick = function (ev) { ev.stopPropagation(); pushUndo(true); pe.spec.active = pe.spec.active === false; var lv = liveFor(pe); lv && lv.rebuild('emitter'); renderList(); if (i === sel) renderInspector(); };
    var del = el('button', 'mini', '✕'); del.title = 'Delete emitter';
    del.onclick = function (ev) { ev.stopPropagation(); if (project.emitters.length < 1) return; pushUndo(true); project.emitters.splice(i, 1); if (sel >= project.emitters.length) sel = project.emitters.length - 1; selCard = null; reinstantiate(); renderAll(); };
    r.appendChild(eye); r.appendChild(del);
    r.onclick = function () { sel = i; selCard = null; renderAll(); };
    host.appendChild(r);
  });
}
function nextId() { var m = 0; project.emitters.forEach(function (e) { var n = parseInt(e.id, 10); if (!isNaN(n) && n > m) m = n; }); return m + 1; }
function newEmitter() {
  pushUndo(true);
  var id = String(nextId()), spec = E.createEmitter(id);
  project.emitters.push({ id: id, spec: spec, frames: [{ name: 'Soft dot', canvas: E.builtinTextures['Soft dot']() }] });
  sel = project.emitters.length - 1; selCard = null; reinstantiate(); renderAll();
}
function cloneEmitter() {
  var pe = cur(); if (!pe) return; pushUndo(true);
  var id = String(nextId()), spec = E.clone(pe.spec); spec.id = id;
  project.emitters.push({ id: id, spec: spec, frames: pe.frames.slice() });
  sel = project.emitters.length - 1; selCard = null; reinstantiate(); renderAll();
}
function renderAll() { renderList(); renderInspector(); drawGizmos(); updateTitle(); }
function updateTitle() { $('pname').value = project.name; $('bgrow').style.display = project.background ? 'flex' : 'none'; $('inclbg').checked = project.includeBackground; $('showbg').checked = showBg; }
