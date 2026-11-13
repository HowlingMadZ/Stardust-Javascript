// RectContour zone
function RectContour(spec, B) {
  Zone.call(this, spec, B);
  this._x = num(spec.x, 0); this._y = num(spec.y, 0);
  var w = num(spec.width, 200), h = num(spec.height, 100), vt = this.vt;
  var segs = [[0, 0, w, 0], [0, h, w, h], [0, 0, 0, h], [w, 0, w, h]];
  this.zc = new ZoneCollection(segs.map(function (c) {
    return new Line({ x1: c[0], y1: c[1], x2: c[2], y2: c[3], virtualThickness: vt }, B);
  }));
  this.area = 0; for (var i = 0; i < 4; i++) this.area += this.zc.zones[i].area;
}
RectContour.prototype = Object.create(Zone.prototype);
RectContour.prototype.calc = function (o) { this.zc.randomPoint(o); };
RectContour.prototype.getPoint = function (out) {
  Zone.prototype.getPoint.call(this, out);
  if (this.rotation !== 0) { var ox = out.x; out.x = ox * this.cos - out.y * this.sin; out.y = ox * this.sin + out.y * this.cos; }
  out.x += this._x; out.y += this._y; return out;
};
RectContour.prototype.contains = function (x, y) { return this.zc.contains(x, y); };
