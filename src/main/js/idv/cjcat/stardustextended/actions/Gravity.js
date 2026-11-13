// Gravity action
ActionFactories.Gravity = function (s, B, base, tmp) {
  var fields = B.fields(s.fields);
  return base(s, {
    priority: -3,
    update: function (p, dt) {
      var t = dt * 100; // acceleration is in m/(s*s), scaled like the original
      for (var i = 0; i < fields.length; i++) {
        var m = fields[i].get(p, tmp); p.vx += m.x * t; p.vy += m.y * t;
      }
    }
  });
};
