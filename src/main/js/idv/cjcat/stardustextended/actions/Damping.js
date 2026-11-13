// Damping action
ActionFactories.Damping = function (s, B, base, tmp) {
  var d = num(s.damping, 0.05), damp = 1;
  return base(s, {
    priority: -1,
    pre: function (dt) { damp = 1; if (d) damp = Math.pow(1 - d, dt * 60); },
    update: function (p) { p.vx *= damp; p.vy *= damp; }
  });
};
