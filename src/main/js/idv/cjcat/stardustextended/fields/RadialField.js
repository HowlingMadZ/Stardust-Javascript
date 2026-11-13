// RadialField
function RadialField(spec) {
  this.x = num(spec.x, 0); this.y = num(spec.y, 0);
  this.strength = num(spec.strength, 1); this.att = num(spec.attenuationPower, 0); this.eps = num(spec.epsilon, 1);
  this.active = bool(spec.active, true); this.massless = bool(spec.massless, true);
}
RadialField.prototype.get = function (p, out) {
  if (!this.active) { out.x = 0; out.y = 0; return out; }
  var dx = p.x - this.x, dy = p.y - this.y;
  var len = Math.sqrt(dx * dx + dy * dy);
  var L = len < this.eps ? this.eps : len;
  var mag = this.strength * Math.pow(L, -0.5 * this.att);
  if (len > 0) { out.x = dx / len * mag; out.y = dy / len * mag; } else { out.x = 0; out.y = 0; }
  if (!this.massless) { out.x /= p.mass; out.y /= p.mass; }
  return out;
};
