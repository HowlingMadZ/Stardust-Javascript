// NormalDrift action
ActionFactories.NormalDrift = function (s, B, base, tmp) {
  var rnd = B.random(s.random, new UniformRandom(0, num(s.max, 1))), massless = bool(s.massless, false), k = 0;
  return base(s, {
    priority: 0,
    pre: function (dt) { k = dt * 60; },
    update: function (p) {
      // note: the original builds the vector as (vy, vx), i.e. a perpendicular-ish drift; kept as is
      var vx = p.vy, vy = p.vx, len = Math.sqrt(vx * vx + vy * vy);
      var L = rnd.random(); if (!massless) L /= p.mass;
      if (len > 0) { vx = vx / len * L; vy = vy / len * L; } else { vx = 0; vy = 0; }
      p.vx += vx * k; p.vy += vy * k;
    }
  });
};
