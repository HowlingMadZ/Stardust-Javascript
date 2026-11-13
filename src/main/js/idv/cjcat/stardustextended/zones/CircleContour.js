// CircleContour zone
function CircleContour(spec, B) {
  Zone.call(this, spec, B);
  this._x = num(spec.x, 0); this._y = num(spec.y, 0);
  this.r = num(spec.radius, 100);
  var r1 = this.r + 0.5 * this.vt, r2 = this.r - 0.5 * this.vt;
  this.r1 = r1 * r1; this.r2 = r2 * r2;
  this.area = (this.r1 - this.r2) * Math.PI * this.vt;
}
CircleContour.prototype = Object.create(Zone.prototype);
CircleContour.prototype.calc = function (o) {
  var t = TWO_PI * Math.random(); o.x = this.r * Math.cos(t); o.y = this.r * Math.sin(t);
};
CircleContour.prototype.contains = function (x, y) {
  var dx = this._x - x, dy = this._y - y, d = dx * dx + dy * dy; return !(d > this.r1 || d < this.r2);
};
