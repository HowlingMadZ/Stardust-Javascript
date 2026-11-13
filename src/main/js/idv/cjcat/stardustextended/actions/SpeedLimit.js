// SpeedLimit action
ActionFactories.SpeedLimit = function (s, B, base, tmp) {
  var lim = num(s.limit, 100), lsq = lim * lim;
  return base(s, {
    update: function (p) {
      var sq = p.vx * p.vx + p.vy * p.vy;
      if (sq > lsq) { var f = lim / Math.sqrt(sq); p.vx *= f; p.vy *= f; }
    }
  });
};
