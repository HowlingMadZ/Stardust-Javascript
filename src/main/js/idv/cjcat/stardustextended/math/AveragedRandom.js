// AveragedRandom
function AveragedRandom(obj, count) { this.obj = obj; this.count = count; }
AveragedRandom.prototype.random = function () {
  if (!this.obj) return 0;
  var s = 0; for (var i = 0; i < this.count; i++) s += this.obj.random();
  return s / this.count;
};
AveragedRandom.prototype.setRange = function () { };
