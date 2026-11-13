// Small shared helpers (value parsing, random rounding, priority ordering)
  function num(v, def) {
    if (v === undefined || v === null || v === '') return def;
    if (typeof v === 'number') return v;
    var n = parseFloat(v);
    return isNaN(n) ? def : n;
  }
  function bool(v, def) {
    if (v === undefined || v === null || v === '') return def;
    return v === true || v === 'true';
  }
  function randomFloor(n) { var f = n | 0; return f + ((n - f) > Math.random() ? 1 : 0); }
  function stableSortByPriority(list) {
    // priority descending, ties keep the listed order
    return list.map(function (o, i) { return [o, i]; })
      .sort(function (a, b) { return (b[0].priority - a[0].priority) || (a[1] - b[1]); })
      .map(function (x) { return x[0]; });
  }
function lerp(a, b, t) { return a + (b - a) * t; }
