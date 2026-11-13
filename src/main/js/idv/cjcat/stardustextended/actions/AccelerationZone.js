// AccelerationZone action
ActionFactories.AccelerationZone = function (s, B, base, tmp) {
  var zc = new ZoneCollection(B.zones(s.zones, [new RectZone({}, B)])), inv = bool(s.inverted, false);
  var acc = num(s.acceleration, 200), useDir = bool(s.useParticleDirection, true);
  var dx = num(s.directionX, 100), dy = num(s.directionY, 0), dl = Math.sqrt(dx * dx + dy * dy) || 1; dx /= dl; dy /= dl;
  return base(s, {
    priority: -6,
    update: function (p, dt) {
      var aff = zc.contains(p.x, p.y); if (inv) aff = !aff; if (!aff) return;
      if (useDir) {
        var len = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (len > 0) { var f = len + acc * dt; if (f < 0) f = 0; p.vx = p.vx / len * f; p.vy = p.vy / len * f; }
      } else { p.vx += acc * dx * dt; p.vy += acc * dy * dt; }
    }
  });
};
