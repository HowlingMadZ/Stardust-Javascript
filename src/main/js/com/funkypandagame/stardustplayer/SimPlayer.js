// SimPlayer: animation loop around the emitters
function Player(canvas, options) {
  options = options || {};
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.originX = options.originX; // undefined -> centre of canvas
  this.originY = options.originY;
  this.timeScale = 1;
  this.zoom = 1;
  this.background = options.background === undefined ? null : options.background; // css colour or null = transparent
  this.forceSmoothing = options.forceSmoothing || false;
  this.reverseOrder = false;
  this.maxDt = 0.1;
  this.emitters = []; this.sim = null;
  this.running = false; this._raf = 0; this._last = 0;
  this.onframe = null;
  this.fpsSmooth = 60;
  var self = this;
  this._tick = function (now) { self._frame(now); };
}
Player.prototype.load = function (sim) {
  this.sim = sim;
  this.emitters = sim.instantiate();
  return this;
};
Player.prototype.reset = function () {
  if (!this.sim) return;
  this.emitters = this.sim.instantiate();
};
// Emit particles right now, e.g. for a game event: player.burst('1', 300). Without a count, one
// clock burst's worth of particles is used. Returns the new particles.
Player.prototype.burst = function (id, count) {
  var em = null;
  for (var i = 0; i < this.emitters.length; i++) if (String(this.emitters[i].id) === String(id)) em = this.emitters[i];
  if (!em) return [];
  if (count === undefined) { var c = em.clock; count = Math.max(1, Math.round(c.ticksPerCall * (c.length ? Math.max(c.length.center || 0.1, 0.05) : 0.1))); }
  return em.createParticles(count);
};
Player.prototype.start = function () {
  if (this.running) return; this.running = true; this._last = 0;
  var self = this;
  if (typeof document !== 'undefined' && !this._vis) {
    this._vis = function () { self._last = 0; };   // after returning to the tab, the first frame has dt 0 instead of "everything you missed"
    document.addEventListener('visibilitychange', this._vis);
  }
  this._raf = requestAnimationFrame(this._tick);
};
Player.prototype.stop = function () { this.running = false; cancelAnimationFrame(this._raf); };
Object.defineProperty(Player.prototype, 'numParticles', {
  get: function () { var n = 0; for (var i = 0; i < this.emitters.length; i++) n += this.emitters[i].particles.length; return n; }
});
Player.prototype._frame = function (now) {
  if (!this.running) return;
  var dt = this._last ? (now - this._last) / 1000 : 0;
  this._last = now;
  if (dt > this.maxDt) dt = this.maxDt;
  if (dt > 0) this.fpsSmooth += (1 / dt - this.fpsSmooth) * 0.05;
  this.step(dt * this.timeScale);
  this.render();
  if (this.onframe) this.onframe(dt);
  this._raf = requestAnimationFrame(this._tick);
};
