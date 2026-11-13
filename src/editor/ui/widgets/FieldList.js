// List editor for fields
function fieldList(owner, p, onChange) {
  var host = el('div', 'group'); host.appendChild(el('div', 'glabel', p.l)); var list = el('div'); host.appendChild(list);
  function rebuild() {
    list.innerHTML = '';
    owner[p.k].forEach(function (f, i) {
      list.appendChild(subBox('field', f, null, onChange, true, function () { owner[p.k].splice(i, 1); rebuild(); onChange(); }, {
        types: E.FIELD_TYPES, change: function (t) { var n = E.retype('field', f, t); owner[p.k][i] = n; rebuild(); onChange(); drawGizmos(); }
      }));
    });
  }
  rebuild();
  host.appendChild(addButton('field', function () { pushUndo(true); owner[p.k].push(E.create('field', 'RadialField')); rebuild(); onChange(); drawGizmos(); }));
  return host;
}
