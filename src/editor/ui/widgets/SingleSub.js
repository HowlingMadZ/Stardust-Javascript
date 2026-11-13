// Single sub-element editor (clock, trigger, field)
function singleSub(label, owner, key, cat, types, onChange) {
  var host = el('div', 'group'); host.appendChild(el('div', 'glabel', label));
  function rebuild() {
    host.querySelectorAll('.sub').forEach(function (n) { n.remove(); });
    host.appendChild(subBox(cat, owner[key], null, onChange, false, null, { types: types, change: function (t) { owner[key] = E.retype(cat, owner[key], t); rebuild(); onChange(); drawGizmos(); } }));
  }
  rebuild(); return host;
}
