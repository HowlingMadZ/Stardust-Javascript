// UniformRandom
function UniformRandom(center, radius) { this.center = center; this.radius = radius; }
UniformRandom.prototype.random = function () {
  return this.radius ? this.radius * 2 * (Math.random() - 0.5) + this.center : this.center;
};
UniformRandom.prototype.setRange = function (lo, hi) {
  var diameter = hi - lo; this.radius = 0.5 * diameter; this.center = lo + this.radius;
};
