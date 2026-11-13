// WrappingBox
DeflectorFactories.WrappingBox = function (o, s) {
  var x = num(s.x, 0), y = num(s.y, 0);
  var w = num(s.width, 640), h = num(s.height, 480);
  var mod = function (a, b) { var m = a % b; return m < 0 ? m + b : m; };
  o.test = function (p, r) {
    if (!o.active) return false;
    if (!(p.x < x || p.x > x + w || p.y < y || p.y > y + h)) return false;
    r.x = x + mod(p.x - x, w); r.y = y + mod(p.y - y, h); r.vx = p.vx; r.vy = p.vy; return true;
  };
};
