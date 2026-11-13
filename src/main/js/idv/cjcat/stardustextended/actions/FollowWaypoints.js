// FollowWaypoints action
ActionFactories.FollowWaypoints = function (s, B, base, tmp) {
  var wps = B.arr(s.waypoints).map(function (w) {
    return { x: num(w.x, 0), y: num(w.y, 0), radius: num(w.radius, 20), strength: num(w.strength, 1), att: num(w.attenuationPower, 0), eps: num(w.epsilon, 1) };
  });
  var loop = bool(s.loop, false), massless = bool(s.massless, true), k = 0;
  return base(s, {
    pre: function (dt) { k = dt * 60; },
    update: function (p) {
      var n = wps.length; if (!n) return;
      var idx = p.dict.wp | 0;
      if (idx >= n) { idx = n - 1; p.dict.wp = idx; }
      var w = wps[idx];
      var dx = p.x - w.x, dy = p.y - w.y;
      if (dx * dx + dy * dy <= w.radius * w.radius) {
        if (idx < n - 1) { p.dict.wp++; w = wps[idx + 1]; }
        else if (loop) { p.dict.wp = 0; w = wps[0]; }
        else return;
        dx = p.x - w.x; dy = p.y - w.y;
      }
      var len = Math.sqrt(dx * dx + dy * dy);
      var L = len < w.eps ? w.eps : len;
      var mag = -w.strength * Math.pow(L, -0.5 * w.att);
      if (!massless) mag /= p.mass;
      if (len > 0) { p.vx += dx / len * mag * k; p.vy += dy / len * mag * k; }
    }
  });
};
