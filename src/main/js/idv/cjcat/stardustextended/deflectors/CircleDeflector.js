// CircleDeflector
DeflectorFactories.CircleDeflector = function (o, s) {
  var x = num(s.x, 0), y = num(s.y, 0);
  var radius = num(s.radius, 100);
  o.test = function (p, r) {
    if (!o.active) return false;
    var dx = p.x - x, dy = p.y - y;
    if (Math.sqrt(dx * dx + dy * dy) > radius) return false;
    var rv = setLen(dx, dy, radius), v = projOnto(p.vx, p.vy, rv[0], rv[1]), f = 1 + o.bounce;
    r.x = x + rv[0]; r.y = y + rv[1];
    r.vx = (p.vx - v[0] * f) * o.slip; r.vy = (p.vy - v[1] * f) * o.slip; return true;
  };
};
