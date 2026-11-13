// Spin action
ActionFactories.Spin = function (s, B, base, tmp) {
  var m = num(s.multiplier, 1), f = 0;
  return base(s, { priority: -4, pre: function (dt) { f = dt * m; }, update: function (p) { p.rotation += p.omega * f; } });
};
