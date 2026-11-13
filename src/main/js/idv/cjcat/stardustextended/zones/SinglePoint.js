// SinglePoint zone
function SinglePoint(spec, B) {
  Zone.call(this, spec, B);
  this._x = num(spec.x, 0); this._y = num(spec.y, 0);
  this.area = this.vt * this.vt * Math.PI;
}
SinglePoint.prototype = Object.create(Zone.prototype);
SinglePoint.prototype.calc = function (o) { o.x = 0; o.y = 0; };
SinglePoint.prototype.contains = function (x, y) { return this._x === x && this._y === y; };
