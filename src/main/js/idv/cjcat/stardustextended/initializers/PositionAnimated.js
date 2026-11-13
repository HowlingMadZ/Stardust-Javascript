// PositionAnimated initializer
InitializerFactories.PositionAnimated = function (spec, B) {
  var zc = new ZoneCollection(B.zones(spec.zones, [new RectZone({}, B)]));
  var far = 0;
  zc.zones.forEach(function (z) { far = Math.max(far, Math.abs(z._x), Math.abs(z._y)); });
  return {
    type: 'PositionAnimated', active: bool(spec.active, true), priority: num(spec.priority, 0), maxPos: far,
    init: function (p) {
      initTmp.hasColor = false;
      var m = zc.randomPoint(initTmp);
      if (m) { p.x = m.x; p.y = m.y; if (m.hasColor) { p.colorR = m.cr; p.colorG = m.cg; p.colorB = m.cb; } }
    }
  };
};
