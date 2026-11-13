// UniformField
function UniformField(spec) {
  this.x = num(spec.x, 0); this.y = num(spec.y, 0);
  this.active = bool(spec.active, true); this.massless = bool(spec.massless, true);
}
UniformField.prototype.get = function (p, out) {
  if (!this.active) { out.x = 0; out.y = 0; return out; }
  out.x = this.x; out.y = this.y;
  if (!this.massless) { out.x /= p.mass; out.y /= p.mass; }
  return out;
};
