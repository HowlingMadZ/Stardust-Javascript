// Explode action
ActionFactories.Explode = function (s, B, base, tmp) {
  var x = num(s.x, 0), y = num(s.y, 0), strength = num(s.strength, 5), grow = num(s.growSpeed, 40);
  var maxD = num(s.maxDistance, 200), att = num(s.attenuationPower, 0.1), eps = num(s.epsilon, 1);
  var done = true, inner = 0, outer = 0;
  return base(s, {
    update: function (p, dt) {
      if (done) return;
      var dx = p.x - x, dy = p.y - y, len = Math.sqrt(dx * dx + dy * dy), L = len < eps ? eps : len;
      if (L >= inner && L < outer && len > 0) {
        var mag = strength * Math.pow(L, -att);
        p.vx += dx / len * mag * dt; p.vy += dy / len * mag * dt;
      }
    },
    post: function () { if (done) return; inner += grow; outer += grow; if (inner > maxD) done = true; },
    fire: function () { done = false; inner = 0; outer = grow; }
  });
};
