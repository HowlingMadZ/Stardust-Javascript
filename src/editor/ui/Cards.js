// Initializer / action cards and the add menus
// ------------------------------------------------------------------ cards (initializers / actions)
function card(kind, spec, list, idx, live) {
  var def = D[kind][spec.$type];
  var c = el('div', 'card' + (selCard === spec ? ' selected' : '')); c.spec = spec;
  var head = el('div', 'cardhead');
  var arrow = el('span', 'arrow', openList.indexOf(spec) >= 0 ? '▾' : '▸');
  var act = el('input'); act.type = 'checkbox'; act.checked = spec.active !== false; act.title = 'Active';
  act.onclick = function (e) { e.stopPropagation(); };
  act.onchange = function () { pushUndo(true); spec.active = act.checked; live(); };
  head.appendChild(arrow); head.appendChild(act); head.appendChild(el('span', 'ctitle', def.label));
  if (def.fire) {
    var fb = el('button', 'fire', '🔥 Fire'); fb.title = def.desc;
    fb.onclick = function (e) { e.stopPropagation(); var lv = liveFor(cur()), a = lv && lv.findAction(spec); if (a && a.fire) a.fire(); };
    head.appendChild(fb);
  }
  var del = el('button', 'mini', '✕'); del.title = 'Remove';
  del.onclick = function (e) { e.stopPropagation(); pushUndo(true); list.splice(idx, 1); if (selCard === spec) selCard = null; live(); renderInspector(); drawGizmos(); };
  head.appendChild(del);
  c.appendChild(head);
  var body = el('div', 'cardbody'); body.style.display = openList.indexOf(spec) >= 0 ? 'block' : 'none';
  body.appendChild(el('div', 'desc', def.desc));
  paramControls(spec, def.params, live, body, kind);
  c.appendChild(body);
  head.onclick = function () {
    var o = openList.indexOf(spec);
    if (o >= 0) openList.splice(o, 1); else openList.push(spec);
    selCard = spec; body.style.display = o >= 0 ? 'none' : 'block'; arrow.textContent = o >= 0 ? '▸' : '▾';
    document.querySelectorAll('.card').forEach(function (n) { n.classList.toggle('selected', n.spec === spec); }); highlightSel(); drawGizmos();
  };
  return c;
}
function addMenu(kind, list, what) {
  var s = el('select', 'addsel'); var o0 = el('option', null, '＋ Add ' + (kind === 'action' ? 'action' : 'initializer') + '…'); o0.value = ''; s.appendChild(o0);
  var groups = {};
  Object.keys(D[kind]).forEach(function (t) { var g = D[kind][t].group; (groups[g] = groups[g] || []).push(t); });
  Object.keys(groups).forEach(function (g) {
    var og = el('optgroup'); og.label = g;
    groups[g].forEach(function (t) { var o = el('option', null, D[kind][t].label); o.value = t; og.appendChild(o); });
    s.appendChild(og);
  });
  s.onchange = function () {
    if (!s.value) return; pushUndo(true);
    var sp = E.create(kind, s.value);
    if (sp.$type === 'Spawn') { var other = project.emitters.filter(function (e) { return e !== cur(); })[0]; sp.spawnerEmitter = other ? other.id : ''; }
    list.push(sp); openList.push(sp); selCard = sp; live(what); renderInspector(); drawGizmos();
  };
  return s;
}
