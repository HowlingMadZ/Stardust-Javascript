// List editor for deflectors
function deflectorList(owner, p, onChange) {
  var host = el('div', 'group'); host.appendChild(el('div', 'glabel', p.l)); var list = el('div'); host.appendChild(list);
  function rebuild() {
    list.innerHTML = '';
    owner[p.k].forEach(function (f, i) {
      list.appendChild(subBox('deflector', f, null, onChange, true, function () { owner[p.k].splice(i, 1); rebuild(); onChange(); drawGizmos(); }, {
        types: E.DEFLECTOR_TYPES, change: function (t) { var n = E.retype('deflector', f, t); owner[p.k][i] = n; rebuild(); onChange(); drawGizmos(); }
      }));
    });
  }
  rebuild();
  var sel2 = el('select', 'addsel'); ['＋ add deflector…'].concat(E.DEFLECTOR_TYPES).forEach(function (t, i) { var o = el('option', null, i ? D.deflector[t].label : t); o.value = i ? t : ''; sel2.appendChild(o); });
  sel2.onchange = function () { if (!sel2.value) return; pushUndo(true); var d = E.create('deflector', sel2.value); owner[p.k].push(d); sel2.value = ''; selCard = d; rebuild(); onChange(); drawGizmos(); };
  host.appendChild(sel2); return host;
}
