// Emitter reference dropdown (Spawn action)
function emitterRefRow(label, owner, key, onChange) {
  var row = el('div', 'prow'); row.appendChild(el('label', null, label));
  var s = el('select'); var ids = project.emitters.map(function (e) { return e.id; });
  if (ids.indexOf(owner[key]) < 0) ids.push(owner[key]);
  ['' ].concat(ids).forEach(function (id) { var o = el('option', null, id === '' ? '(none)' : id); o.value = id; s.appendChild(o); });
  s.value = owner[key]; s.onchange = function () { pushUndo(true); owner[key] = s.value; onChange(); };
  row.appendChild(s); return row;
}
