// Undo / redo with snapshots
// ------------------------------------------------------------------ undo
function snapshot() {
  return JSON.stringify({ sel: sel, e: project.emitters.map(function (pe) { return { id: pe.id, spec: pe.spec }; }) });
}
var frameStore = {};
function pushUndo(force) {
  var now = Date.now();
  if (!force && now - lastChange < 700) { lastChange = now; return; }
  lastChange = now;
  undoStack.push({ snap: snapshot(), frames: project.emitters.map(function (pe) { return pe.frames; }) });
  if (undoStack.length > 80) undoStack.shift();
  redoStack = [];
  updateUndoBtns();
}
function restore(st) {
  var o = JSON.parse(st.snap);
  project.emitters = o.e.map(function (e, i) { return { id: e.id, spec: e.spec, frames: st.frames[i] }; });
  sel = Math.min(o.sel, project.emitters.length - 1); selCard = null;
  reinstantiate(); renderAll();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push({ snap: snapshot(), frames: project.emitters.map(function (pe) { return pe.frames; }) });
  restore(undoStack.pop()); lastChange = 0; updateUndoBtns();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push({ snap: snapshot(), frames: project.emitters.map(function (pe) { return pe.frames; }) });
  restore(redoStack.pop()); lastChange = 0; updateUndoBtns();
}
function updateUndoBtns() { $('undo').disabled = !undoStack.length; $('redo').disabled = !redoStack.length; }
