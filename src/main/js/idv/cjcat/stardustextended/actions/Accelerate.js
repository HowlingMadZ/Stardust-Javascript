// Accelerate action
ActionFactories.Accelerate = function (s, B, base, tmp) {
  var acc = num(s.acceleration, 0), k = 0;
  return base(s, {
    pre: function (dt) { k = dt * 60; },
    update: function (p) {
      var len = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (len > 0) { var f = len + acc * k; if (f < 0) f = 0; p.vx = p.vx / len * f; p.vy = p.vy / len * f; }
    }
  });
};
