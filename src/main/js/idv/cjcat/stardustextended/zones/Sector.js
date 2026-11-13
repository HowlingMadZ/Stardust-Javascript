// Sector zone
function Sector(spec, B) {
  Zone.call(this, spec, B);
  this._x = num(spec.x, 0); this._y = num(spec.y, 0);
  this.minR = num(spec.minRadius, 0); this.maxR = num(spec.maxRadius, 100);
  this.minA = num(spec.minAngle, 0) * DEG2RAD; this.maxA = num(spec.maxAngle, 360) * DEG2RAD;
  var a = (this.maxA - this.minA) * 0.5;
  this.area = a * (this.maxR * this.maxR - this.minR * this.minR);
}
Sector.prototype = Object.create(Zone.prototype);
Sector.prototype.calc = function (o) {
  if (this.maxR === 0) { o.x = this._x; o.y = this._y; return; }
  var t = this.minA + (this.maxA - this.minA) * Math.random();
  var r = this.minR + (this.maxR - this.minR) * Math.sqrt(Math.random());
  o.x = r * Math.cos(t); o.y = r * Math.sin(t);
};
