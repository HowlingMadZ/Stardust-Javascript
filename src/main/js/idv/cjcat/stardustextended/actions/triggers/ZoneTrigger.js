// ZoneTrigger
TriggerFactories.ZoneTrigger = function (s, B) {
  var zc = new ZoneCollection(B.zones(s.zones, [new RectZone({}, B)]));
  return function (p) { return zc.contains(p.x, p.y); };
};
