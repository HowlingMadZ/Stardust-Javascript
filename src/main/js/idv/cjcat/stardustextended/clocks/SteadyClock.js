// SteadyClock
function SteadyClock(spec, B) {
  this.ticksPerCall = num(spec.ticksPerCall, 1);
  this.initialDelay = B.random(spec.initialDelay, new UniformRandom(0, 0));
  this.reset();
}
SteadyClock.prototype.reset = function () {
  this.t = 0; var v = this.initialDelay.random(); this.delay = v > 0 ? v : 0;
};
SteadyClock.prototype.getTicks = function (time) {
  this.t += time;
  return this.t > this.delay ? randomFloor(this.ticksPerCall * time) : 0;
};
