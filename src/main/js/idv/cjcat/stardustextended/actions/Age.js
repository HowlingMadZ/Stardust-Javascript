// Age action
ActionFactories.Age = function (s, B, base, tmp) {
  var m = num(s.multiplier, 1);
  return base(s, { update: function (p, dt) { p.life -= dt * m; if (p.life < 0) p.life = 0; } });
};
