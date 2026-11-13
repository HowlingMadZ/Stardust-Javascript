// Deflect action
ActionFactories.Deflect = function (s, B, base, tmp) {
  var ds = B.deflectors(s.deflectors), out = { x: 0, y: 0, vx: 0, vy: 0 };
  return base(s, {
    priority: -5,
    update: function (p) {
      for (var i = 0; i < ds.length; i++) if (ds[i].test(p, out)) { p.x = out.x; p.y = out.y; p.vx = out.vx; p.vy = out.vy; }
    }
  });
};
