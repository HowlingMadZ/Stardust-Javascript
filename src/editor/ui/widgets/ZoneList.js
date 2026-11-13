// List editor for zones
function zoneList(owner, p, onChange) {
  var host = el('div', 'group'); host.appendChild(el('div', 'glabel', p.l));
  var list = el('div'); host.appendChild(list);
  function rebuild() {
    list.innerHTML = '';
    owner[p.k].forEach(function (z, i) {
      list.appendChild(subBox('zone', z, null, onChange, owner[p.k].length > 1, function () { owner[p.k].splice(i, 1); rebuild(); onChange(); }, {
        types: E.ZONE_TYPES, change: function (t) { var n = E.retype('zone', z, t); owner[p.k][i] = n; if (selCard === z) selCard = n; rebuild(); onChange(); drawGizmos(); }
      }));
    });
  }
  rebuild();
  host.appendChild(addButton('zone', function () { pushUndo(true); owner[p.k].push(E.create('zone', 'CircleZone')); rebuild(); onChange(); drawGizmos(); }));
  return host;
}
