// Colour gradient editor
function hex(c) { return '#' + ('000000' + (c >>> 0).toString(16)).slice(-6); }
function gradientEditor(owner, p, onChange) {
  var g = owner[p.k], host = el('div', 'group'); host.appendChild(el('div', 'glabel', p.l + ' (birth → death)'));
  var bar = el('div', 'gradbar'); host.appendChild(bar);
  var list = el('div'); host.appendChild(list);
  function paintBar() {
    var stops = g.colors.map(function (c, i) { var r = parseInt(hex(c).slice(1, 3), 16), gg = parseInt(hex(c).slice(3, 5), 16), b = parseInt(hex(c).slice(5, 7), 16); return 'rgba(' + r + ',' + gg + ',' + b + ',' + g.alphas[i] + ') ' + (g.ratios[i] / 255 * 100).toFixed(1) + '%'; });
    bar.style.background = 'linear-gradient(90deg,' + stops.join(',') + '), repeating-conic-gradient(#555 0 25%, #333 0 50%) 0 0/10px 10px';
  }
  function rebuild() {
    list.innerHTML = ''; paintBar();
    g.colors.forEach(function (c, i) {
      var row = el('div', 'prow gstop'); var col = el('input'); col.type = 'color'; col.value = hex(c);
      col.oninput = function () { pushUndo(); g.colors[i] = parseInt(col.value.slice(1), 16); paintBar(); onChange(); };
      var pos = el('input'); pos.type = 'range'; pos.min = 0; pos.max = 255; pos.value = g.ratios[i]; pos.title = 'Position';
      pos.oninput = function () { pushUndo(); g.ratios[i] = parseInt(pos.value, 10); paintBar(); onChange(); };
      var al = el('input'); al.type = 'range'; al.min = 0; al.max = 1; al.step = 0.01; al.value = g.alphas[i]; al.title = 'Alpha';
      al.oninput = function () { pushUndo(); g.alphas[i] = parseFloat(al.value); paintBar(); onChange(); };
      var x = el('button', 'mini', '✕'); x.disabled = g.colors.length <= 2;
      x.onclick = function () { pushUndo(true); g.colors.splice(i, 1); g.ratios.splice(i, 1); g.alphas.splice(i, 1); rebuild(); onChange(); };
      row.appendChild(col); row.appendChild(el('span', 'tiny', 'pos')); row.appendChild(pos); row.appendChild(el('span', 'tiny', 'α')); row.appendChild(al); row.appendChild(x); list.appendChild(row);
    });
  }
  rebuild();
  host.appendChild(addButton('colour stop', function () {
    pushUndo(true); var n = g.colors.length; // insert a stop between the last two, then keep ratios sorted
    g.colors.splice(n - 1, 0, g.colors[n - 1]); g.alphas.splice(n - 1, 0, g.alphas[n - 1]);
    g.ratios.splice(n - 1, 0, Math.round((g.ratios[n - 2] + g.ratios[n - 1]) / 2));
    rebuild(); onChange();
  }));
  return host;
}
