// SimPlayer.step with sub-stepping
Player.prototype.step = function (dt) {
  var slow = this.timeScale > 0 && this.timeScale < 1 ? this.timeScale : 1;
  // The physics (Euler steps with damping) depends on the step size: one big step after a lag spike or an
  // alt-tab makes particles travel ~30% farther than the same time in small steps. So long frames are split
  // into steps of at most 1/60 s, which is the rate the effects are authored at.
  var n = dt > MAX_SUBSTEP ? Math.ceil(dt / MAX_SUBSTEP - 1e-9) : 1, h = dt / n;
  for (var k = 0; k < n; k++)
    for (var i = 0; i < this.emitters.length; i++) { this.emitters[i].slow = slow; this.emitters[i].step(h); }
};

var MAX_SUBSTEP = 1 / 45;
