// Deflector base: registry, vector helpers, Builder.deflectors
var DeflectorFactories = {};     // name -> function (o, s): fills o.test(p, result) for that deflector type
var uidCounter = 1;
  function projOnto(ax, ay, nx, ny) {
    var d = Math.sqrt(nx * nx + ny * ny); if (!d) return [0, 0];
    nx /= d; ny /= d; var k = ax * nx + ay * ny; return [nx * k, ny * k];
  }
  function setLen(x, y, L) { var l = Math.sqrt(x * x + y * y); return l ? [x / l * L, y / l * L] : [0, 0]; }
Builder.prototype.deflectors = function (list) {
  var self = this, out = [];
  this.arr(list).forEach(function (d) {
    var s = self.resolve(d); if (!s) return;
    var make = DeflectorFactories[s.$type];
    if (!make) { self.warn('Deflector "' + s.$type + '" not supported'); return; }
    var o = { uid: uidCounter++, active: bool(s.active, true), bounce: num(s.bounce, 0.8), slip: num(s.slipperiness, 1) };
    make(o, s);
    out.push(o);
  });
  return out;
};
