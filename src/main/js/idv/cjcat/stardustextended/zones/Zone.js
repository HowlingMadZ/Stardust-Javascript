// Zone base class
function Zone(spec, B) {
  this._x = 0; this._y = 0; this.area = 1;
  this.rotation = num(spec.rotation, 0);
  this.cos = Math.cos(this.rotation * DEG2RAD); this.sin = Math.sin(this.rotation * DEG2RAD);
  this.vt = num(spec.virtualThickness, 1);
}
Zone.prototype.getPoint = function (out) {
  this.calc(out);
  if (this.rotation !== 0) {
    var ox = out.x;
    out.x = ox * this.cos - out.y * this.sin;
    out.y = ox * this.sin + out.y * this.cos;
  }
  out.x += this._x; out.y += this._y;
  return out;
};
Zone.prototype.contains = function () { return false; };
