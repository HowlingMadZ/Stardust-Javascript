// RectZone zone
function RectZone(spec, B) {
  Zone.call(this, spec, B);
  this._x = num(spec.x, 0); this._y = num(spec.y, 0);
  this.w = num(spec.width, 150); this.h = num(spec.height, 50);
  this.rx = B.random(spec.randomX, new UniformRandom(0.5, 0.5));
  this.ry = B.random(spec.randomY, new UniformRandom(0.5, 0.5));
  this.area = this.w * this.h;
}
RectZone.prototype = Object.create(Zone.prototype);
RectZone.prototype.calc = function (o) {
  this.rx.setRange(0, this.w); this.ry.setRange(0, this.h);
  o.x = this.rx.random(); o.y = this.ry.random();
};
RectZone.prototype.contains = function (x, y) {
  if (this.rotation !== 0) {
    var c = Math.cos(-this.rotation * DEG2RAD), s = Math.sin(-this.rotation * DEG2RAD);
    var nx = x * c - y * s; y = x * s + y * c; x = nx;
  }
  return !(x < this._x || x > this._x + this.w || y < this._y || y > this._y + this.h);
};
