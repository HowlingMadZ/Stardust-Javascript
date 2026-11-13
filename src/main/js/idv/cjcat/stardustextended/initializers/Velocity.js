// Velocity initializer
InitializerFactories.Velocity = function (spec, B) {
  var zc = new ZoneCollection(B.zones(spec.zones, [new SinglePoint({}, B)]));
  return {
    type: 'Velocity', active: bool(spec.active, true), priority: num(spec.priority, 0),
    init: function (p) { var m = zc.randomPoint(initTmp); if (m) { p.vx += m.x; p.vy += m.y; } }
  };
};
