// VelocityField action
ActionFactories.VelocityField = function (s, B, base, tmp) { // sets the velocity to the field value (does not add)
    var field = B.field(s.field || (s.fields && B.arr(s.fields)[0]), new UniformField({ x: 100, y: 100 }));
    return base(s, {
      priority: -2,
      update: function (p) { var m = field.get(p, tmp); p.vx = m.x; p.vy = m.y; }
    });
  };
