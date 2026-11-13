// DeathZone action
ActionFactories.DeathZone = function (s, B, base, tmp) {
  var zc = new ZoneCollection(B.zones(s.zones || (s.zone ? [s.zone] : null), [])), inv = bool(s.inverted, false);
  return base(s, {
    priority: -6,
    update: function (p) { var d = zc.contains(p.x, p.y); if (inv) d = !d; if (d) p.isDead = true; }
  });
};
