// ImpulseClock
function ImpulseClock(spec, B) {
  this.ticksPerCall = num(spec.ticksPerCall, 1);
  this.interval = B.random(spec.impulseInterval, new UniformRandom(20, 10));
  this.length = B.random(spec.impulseLength, new UniformRandom(5, 0));
  this.initialDelay = B.random(spec.initialDelay, new UniformRandom(0, 0));
  this.reset();
}
ImpulseClock.prototype._len = function () { var v = this.length.random(); this.curLen = v > 0 ? v : 0; };
ImpulseClock.prototype._int = function () { var v = this.interval.random(); this.curInt = v > 0 ? v : 0; };
ImpulseClock.prototype.reset = function () {
  var v = this.initialDelay.random(); this.curDelay = v > 0 ? v : 0;
  this._len(); this._int(); this.t = 0;
};
ImpulseClock.prototype.impulse = function () { this.curDelay = -1; this.t = 0; };
ImpulseClock.prototype.getTicks = function (time) {
  var ticks = 0;
  this.curDelay -= time;
  if (this.curDelay < 0) {
    this.t += time;
    if (this.t <= this.curLen) ticks = randomFloor(this.ticksPerCall * time);
    else if (this.t - time <= this.curLen) ticks = randomFloor(this.ticksPerCall * (this.curLen - this.t + time));
    if (this.t >= this.curInt) { this._len(); this._int(); this.t = 0; }
  }
  return ticks;
};
