// CircleZone zone
function CircleZone(spec, B) {
  Zone.call(this, spec, B);
  this._x = num(spec.x, 0); this._y = num(spec.y, 0);
  this.r = num(spec.radius, 100);
  this.area = this.r * this.r * Math.PI;
}
CircleZone.prototype = Object.create(Zone.prototype);
CircleZone.prototype.calc = function (o) {
  var t = TWO_PI * Math.random(), r = this.r * Math.sqrt(Math.random());
  o.x = r * Math.cos(t); o.y = r * Math.sin(t);
};
CircleZone.prototype.contains = function (x, y) {
  var dx = this._x - x, dy = this._y - y; return dx * dx + dy * dy <= this.r * this.r;
};
