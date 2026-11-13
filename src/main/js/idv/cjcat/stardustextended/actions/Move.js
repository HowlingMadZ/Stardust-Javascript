// Move action
ActionFactories.Move = function (s, B, base, tmp) {
  var m = num(s.multiplier, 1), f = 0;
  return base(s, { priority: -4, pre: function (dt) { f = dt * m; }, update: function (p) { p.x += p.vx * f; p.y += p.vy * f; } });
};
