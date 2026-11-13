// List editor for attraction points (waypoints)
function waypointList(owner, p, onChange) {
  var host = el('div', 'group'); host.appendChild(el('div', 'glabel', p.l + ' (drag them in the view)'));
  var list = el('div'); host.appendChild(list);
  var wpDefs = [{ k: 'x', l: 'X', t: 'num', min: -1000, max: 1000, step: 1 }, { k: 'y', l: 'Y', t: 'num', min: -1000, max: 1000, step: 1 },
    { k: 'radius', l: 'Reach radius', t: 'num', min: 1, max: 500, step: 1 }, { k: 'strength', l: 'Strength', t: 'num', min: -20, max: 20, step: 0.1 },
    { k: 'attenuationPower', l: 'Attenuation', t: 'num', min: 0, max: 4, step: 0.01 }, { k: 'epsilon', l: 'Epsilon', t: 'num', min: 0, max: 100, step: 0.1 }];
  function rebuild() {
    list.innerHTML = '';
    owner[p.k].forEach(function (w, i) {
      var box = el('div', 'sub' + (selCard === w ? ' selected' : '')), head = el('div', 'subhead');
      head.appendChild(el('span', null, 'Point ' + (i + 1)));
      var x = el('button', 'mini', '✕'); x.onclick = function (ev) { ev.stopPropagation(); pushUndo(true); owner[p.k].splice(i, 1); rebuild(); onChange(); drawGizmos(); }; head.appendChild(x);
      head.onclick = function () { selCard = w; drawGizmos(); highlightSel(); };
      box.appendChild(head); box.spec = w;
      var body = el('div', 'subbody'); paramControls(w, wpDefs, onChange, body); box.appendChild(body); list.appendChild(box);
    });
  }
  rebuild();
  host.appendChild(addButton('attraction point', function () {
    pushUndo(true); var w = E.newWaypoint(), n = owner[p.k].length; w.x = (n % 5) * 120 - 240; w.y = -80 - Math.floor(n / 5) * 80; owner[p.k].push(w); selCard = w; rebuild(); onChange(); drawGizmos();
  }));
  return host;
}
