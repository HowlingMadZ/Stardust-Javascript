// Generic controls: number / bool / enum rows, parameter forms, sub boxes
// ------------------------------------------------------------------ widgets
function fmtn(v, step) { if (v === undefined || isNaN(v)) return '0'; var d = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3; return (+v).toFixed(d); }

// generic number control. get/set operate on obj[key]
function numRow(label, obj, key, p, onChange, sub) {
  var row = el('div', 'prow'); row.appendChild(el('label', null, label));
  var rng = el('input'); rng.type = 'range';
  var min = p.min, max = p.max, step = p.step || 0.01;
  function syncRange() { var v = sub ? obj[key][sub] : obj[key]; rng.min = Math.min(min, v); rng.max = Math.max(max, v); }
  rng.step = step;
  var num = el('input', 'num'); num.type = 'number'; num.step = step;
  function read() { return sub ? obj[key][sub] : obj[key]; }
  function write(v) { if (sub) obj[key][sub] = v; else obj[key] = v; }
  function refresh() { syncRange(); rng.value = read(); num.value = fmtn(read(), step); }
  refresh();
  rng.oninput = function () { pushUndo(); write(parseFloat(rng.value)); num.value = fmtn(read(), step); onChange(); };
  num.onchange = function () { var v = parseFloat(num.value); if (isNaN(v)) v = read(); pushUndo(); write(v); refresh(); onChange(); };
  row.appendChild(rng); row.appendChild(num);
  row.refresh = refresh; return row;
}
function boolRow(label, obj, key, onChange) {
  var row = el('div', 'prow chkrow'), lab = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!obj[key];
  cb.onchange = function () { pushUndo(true); obj[key] = cb.checked; onChange(); };
  lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + label)); row.appendChild(lab); return row;
}
function enumRow(label, obj, key, opts, onChange, nameFn) {
  var row = el('div', 'prow'); row.appendChild(el('label', null, label));
  var s = el('select');
  opts.forEach(function (o) { var op = el('option', null, nameFn ? nameFn(o) : (o === '' ? '(none)' : o)); op.value = o; s.appendChild(op); });
  s.value = obj[key]; s.onchange = function () { pushUndo(true); obj[key] = s.value; onChange(); };
  row.appendChild(s); return row;
}

// build the controls for a list of param descriptors of a spec
function paramControls(spec, params, onChange, host, cat) {
  params.forEach(function (p) {
    var row;
    switch (p.t) {
      case 'num': row = numRow(p.l, spec, p.k, p, onChange); break;
      case 'bool': row = boolRow(p.l, spec, p.k, onChange); break;
      case 'enum': row = enumRow(p.l, spec, p.k, p.opts, onChange); break;
      case 'random':
        row = el('div', 'group'); row.appendChild(el('div', 'glabel', p.l));
        row.appendChild(numRow('average', spec[p.k], 'center', p, onChange));
        row.appendChild(numRow('± range', spec[p.k], 'radius', { min: 0, max: Math.max(p.max - p.min, 1), step: p.step }, onChange)); break;
      case 'zones': row = zoneList(spec, p, onChange); break;
      case 'fields': row = fieldList(spec, p, onChange); break;
      case 'field': row = singleSub(p.l, spec, p.k, 'field', E.FIELD_TYPES, onChange); break;
      case 'trigger': row = singleSub(p.l, spec, p.k, 'trigger', E.TRIGGER_TYPES, onChange); break;
      case 'deflectors': row = deflectorList(spec, p, onChange); break;
      case 'waypoints': row = waypointList(spec, p, onChange); break;
      case 'gradient': row = gradientEditor(spec, p, onChange); break;
      case 'str': row = el('div', 'prow'); row.appendChild(el('label', null, p.l));
        (function (inp) { inp.type = 'text'; inp.className = 'num txt'; inp.value = spec[p.k]; inp.onchange = function () { pushUndo(true); spec[p.k] = inp.value; onChange(); drawGizmos(); }; row.appendChild(inp); })(el('input')); break;
      case 'emitterRef': row = emitterRefRow(p.l, spec, p.k, onChange); break;
    }
    if (row) host.appendChild(row);
  });
}
function subBox(cat, spec, title, onChange, removable, onRemove, typeSel) {
  var box = el('div', 'sub' + (selCard === spec ? ' selected' : '')), head = el('div', 'subhead');
  var def = D[cat][spec.$type];
  if (typeSel) {
    var s = el('select');
    typeSel.types.forEach(function (t) { var o = el('option', null, D[cat][t].label); o.value = t; s.appendChild(o); });
    s.value = spec.$type; s.onchange = function () { pushUndo(true); typeSel.change(s.value); };
    head.appendChild(s);
  } else head.appendChild(el('span', null, title || def.label));
  if (removable) { var x = el('button', 'mini', '✕'); x.title = 'Remove'; x.onclick = function (ev) { ev.stopPropagation(); pushUndo(true); onRemove(); }; head.appendChild(x); }
  head.onclick = function () { selCard = spec; drawGizmos(); highlightSel(); };
  box.appendChild(head);
  var body = el('div', 'subbody'); paramControls(spec, def.params, onChange, body, cat); box.appendChild(body);
  box.spec = spec; return box;
}
function highlightSel() { document.querySelectorAll('.sub').forEach(function (b) { b.classList.toggle('selected', b.spec === selCard); }); }
function addButton(label, onClick) { var b = el('button', 'add', '＋ ' + label); b.onclick = onClick; return b; }
