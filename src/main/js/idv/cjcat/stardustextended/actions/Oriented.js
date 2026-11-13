// Oriented action
ActionFactories.Oriented = function (s, B, base, tmp) {
  var factor = num(s.factor, 1), offset = num(s.offset, 0), f = 0, os = 0, k = 0;
  return base(s, {
    priority: -6,
    pre: function (dt) { f = Math.pow(factor, 0.1 / dt); os = offset + 90; k = (dt + TIME_STEP_CORRECTION) * 60; if (k > 1) k = 1; },
    update: function (p) {
      var disp = (Math.atan2(p.vy, p.vx) * RAD2DEG + os) - p.rotation;
      p.rotation += f * disp * k;
    }
  });
};
