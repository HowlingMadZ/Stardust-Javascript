// Spawn action
ActionFactories.Spawn = function (s, B, base, tmp) {
  var trig = B.trigger(s.trigger), inhDir = bool(s.inheritDirection, true), inhVel = bool(s.inheritVelocity, false);
  var a = base(s, {
    priority: -10, target: null,
    update: function (p, dt, t, em) {
      if (!a.target || a.target === em) return;
      if (trig(p, dt)) {
        var np = a.target.createParticles(a.target.clock.getTicks(dt));
        for (var i = 0; i < np.length; i++) {
          var q = np[i]; q.x += p.x; q.y += p.y;
          if (inhVel) { q.vx += p.vx; q.vy += p.vy; }
          if (inhDir) q.rotation += p.rotation;
        }
      }
    }
  });
  a.link = function (map) { a.target = (s.spawnerEmitter !== undefined && s.spawnerEmitter !== null && s.spawnerEmitter !== '') ? (map[s.spawnerEmitter] || null) : null; };
  return a;
};
