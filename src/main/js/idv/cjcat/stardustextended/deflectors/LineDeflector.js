// LineDeflector
DeflectorFactories.LineDeflector = function (o, s) {
  var x = num(s.x, 0), y = num(s.y, 0);
  var nx = num(s.normalX, 0), ny = num(s.normalY, -1);
  o.test = function (p, r) {
    if (!o.active) return false;
    var rv = projOnto(p.x - x, p.y - y, nx, ny);
    var dot = rv[0] * nx + rv[1] * ny, dist = Math.sqrt(rv[0] * rv[0] + rv[1] * rv[1]), rad = 0, adj;
    if (dot > 0) { if (dist > rad) return false; adj = setLen(rv[0], rv[1], rad - dist); }
    else adj = setLen(rv[0], rv[1], -(dist + rad));
    var v = projOnto(p.vx, p.vy, nx, ny), f = 1 + o.bounce;
    r.x = p.x + adj[0]; r.y = p.y + adj[1];
    r.vx = (p.vx - v[0] * f) * o.slip; r.vy = (p.vy - v[1] * f) * o.slip; return true;
  };
};
