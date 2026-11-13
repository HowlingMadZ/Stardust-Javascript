// RandomDrift action
ActionFactories.RandomDrift = function (s, B, base, tmp) {
  var maxX = num(s.maxX, 10), maxY = num(s.maxY, 10), massless = bool(s.massless, false), k = 0;
  var rx = B.random(s.randomX, new UniformRandom(0, maxX)), ry = B.random(s.randomY, new UniformRandom(0, maxY));
  return base(s, {
    priority: -3,
    pre: function (dt) { k = dt * 60; },
    update: function (p) {
      var x = rx.random(), y = ry.random();
      if (!massless) { x /= p.mass; y /= p.mass; }
      p.vx += x * k; p.vy += y * k;
    }
  });
};
