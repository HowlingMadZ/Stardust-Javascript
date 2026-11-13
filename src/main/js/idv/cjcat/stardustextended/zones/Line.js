// Line zone
function Line(spec, B) {
  Zone.call(this, spec, B);
  this._x = num(spec.x1 !== undefined ? spec.x1 : spec.x, 0);
  this._y = num(spec.y1 !== undefined ? spec.y1 : spec.y, 0);
  this.x2 = num(spec.x2, 0); this.y2 = num(spec.y2, 0);
  this.rnd = B.random(spec.random, new UniformRandom(0.5, 0));
  var dx = this._x - this.x2, dy = this._y - this.y2;
  this.area = Math.sqrt(dx * dx + dy * dy) * this.vt;
}
Line.prototype = Object.create(Zone.prototype);
Line.prototype.calc = function (o) {
  this.rnd.setRange(0, 1);
  var r = this.rnd.random();
  o.x = (this.x2 - this._x) * r; o.y = (this.y2 - this._y) * r;
};

// RectContour is a Composite of 4 Lines. Note: the original applies rotation + offset twice
// (Composite/Zone.getPoint, then RectContour.getPoint); kept to match the runtime.
