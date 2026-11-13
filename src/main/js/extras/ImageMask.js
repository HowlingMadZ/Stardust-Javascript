// NEW (no AS3 counterpart): spawn zone covering the non-transparent pixels of a sprite
function ImageMask(spec, B) {
  Zone.call(this, spec, B);
  this.B = B;
  this.name = String(spec.maskName === undefined || spec.maskName === '' ? 'mask' : spec.maskName);
  this._x = num(spec.x, 0); this._y = num(spec.y, 0);
  this.sc = num(spec.scale, 1);
  this.thr = Math.min(1, Math.max(0, num(spec.alphaThreshold, 0)));
  this.anchor = spec.anchor === 'center' ? 'center' : (spec.anchor === 'inherit' || spec.anchor === undefined ? 'inherit' : 'topleft');
  this.sample = bool(spec.sampleColor, false);
  this.warned = false;
}
ImageMask.prototype = Object.create(Zone.prototype);
Object.defineProperty(ImageMask.prototype, 'area', {
  get: function () { var m = Masks.get(this.name); return m ? Masks.pixels(m, this.thr).length * this.sc * this.sc * m.scale * m.scale + 1e-6 : 1; },
  set: function () {}
});
ImageMask.prototype.calc = function (o) {
  var m = Masks.get(this.name);
  o.hasColor = false;
  if (!m) {
    if (!this.warned) { this.warned = true; this.B.warn('Image mask "' + this.name + '" is not registered (Stardust.Masks.set); spawning at the zone origin'); }
    o.x = 0; o.y = 0; return;
  }
  var idx = Masks.pixels(m, this.thr);
  if (!idx.length) { o.x = 0; o.y = 0; return; }
  var i = idx[(Math.random() * idx.length) | 0], px = i % m.w, py = (i / m.w) | 0;
  var anchor = this.anchor === 'inherit' ? m.anchor : this.anchor;
  var ax = anchor === 'center' ? m.w / 2 : 0, ay = anchor === 'center' ? m.h / 2 : 0;
  var k = this.sc * m.scale;
  // ox/oy and the sprite position are added here; Zone.getPoint then rotates (about the zone origin) and adds _x/_y
  o.x = (px + Math.random() - ax) * k + m.x; o.y = (py + Math.random() - ay) * k + m.y;
  if (this.sample) { var d = m.data, q = i * 4; o.hasColor = true; o.cr = d[q] / 255; o.cg = d[q + 1] / 255; o.cb = d[q + 2] / 255; }
};
ImageMask.prototype.contains = function () { return false; };
