// Impulse action
ActionFactories.Impulse = function (s, B, base, tmp) {
  var field = B.field(s.field, new UniformField({ x: 0, y: 0 })), done = true;
  return base(s, {
    update: function (p, dt) { if (done) return; var m = field.get(p, tmp); p.vx += m.x * dt; p.vy += m.y * dt; },
    post: function () { done = true; },
    fire: function () { done = false; }
  });
};
