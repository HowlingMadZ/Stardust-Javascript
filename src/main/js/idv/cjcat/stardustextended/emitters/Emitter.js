// Emitter
function Emitter(id, spec, B) {
  this.id = id; this.spec = spec;
  this.warnings = B ? B.warnings : [];
  this.B = B || new Builder({}, this.warnings);
  this.particles = []; this.pool = [];
  this.currentTime = 0; this.sinceLast = 0; this.animTimer = 0;
  this.frames = [];       // [{x,y,w,h,img?}]  img defaults to the sim atlas
  this.tintCache = {};
  this.rebuild('all');
}
// Rebuild parts of the runtime from this.spec without touching live particles.
// what: 'all' | 'emitter' | 'clock' | 'handler' | 'initializers' | 'actions'
Emitter.prototype.rebuild = function (what) {
  var spec = this.spec, B = this.B, all = !what || what === 'all';
  if (all || what === 'emitter') { this.active = bool(spec.active, true); this.setFps(num(spec.fps, 60)); }
  if (all || what === 'clock') this.clock = B.clock(spec.clock);
  if (all || what === 'handler') this.handler = B.handler(spec.particleHandler);
  if (all || what === 'initializers')
    this.initializers = stableSortByPriority(B.arr(spec.initializers).map(function (i) { return B.initializer(i); }).filter(Boolean));
  if (all || what === 'actions') {
    this.actions = stableSortByPriority(B.arr(spec.actions).map(function (a) { return B.action(a); }).filter(Boolean));
    if (this.siblings) this.link(this.siblings);
  }
};
// connect Spawn actions to their target emitters (map: id -> Emitter)
Emitter.prototype.link = function (map) {
  this.siblings = map;
  for (var i = 0; i < this.actions.length; i++) if (this.actions[i].link) this.actions[i].link(map);
};
Emitter.prototype.findAction = function (spec) {
  for (var i = 0; i < this.actions.length; i++) if (this.actions[i].spec === spec) return this.actions[i];
  return null;
};
Emitter.prototype.setFps = function (v) { if (v > 60) v = 60; this.fps = v; this.invFps = 1 / v - TIME_STEP_CORRECTION; };
Emitter.prototype.reset = function () {
  this.currentTime = 0; this.sinceLast = 0; this.animTimer = 0;
  for (var i = 0; i < this.particles.length; i++) this.pool.push(this.particles[i]);
  this.particles.length = 0; this.clock.reset();
};
Emitter.prototype.createParticles = function (count) {
  if (count <= 0) return [];
  var fresh = [], i;
  for (i = 0; i < count; i++) {
    var p = this.pool.pop() || new Particle();
    p.init();
    fresh.push(p);
  }
  for (i = 0; i < this.initializers.length; i++) {
    var ini = this.initializers[i];
    if (!ini.active) continue;
    for (var m = 0; m < fresh.length; m++) ini.init(fresh[m]);
  }
  var h = this.handler, total = this.frames.length;
  for (i = 0; i < fresh.length; i++) {
    var q = fresh[i];
    q.currentAnimationFrame = (total > 1 && h.randomStart) ? ((Math.random() * total) | 0) : 0;
    this.particles.push(q);
  }
  return fresh;
};
Emitter.prototype.step = function (time) {
  if (time <= 0) return;
  this.sinceLast += time; this.currentTime += time;
  if (this.sinceLast < this.invFps * (this.slow || 1)) return; // slow-motion: step more often so motion stays smooth
  var dt = this.sinceLast, i, m, len, acts = [];
  if (this.active) this.createParticles(this.clock.getTicks(dt));
  for (i = 0; i < this.actions.length; i++) if (this.actions[i].active) acts.push(this.actions[i]);
  len = acts.length;
  for (i = 0; i < len; i++) if (acts[i].pre) acts[i].pre(dt);
  var ps = this.particles;
  for (m = 0; m < ps.length; m++) {
    var p = ps[m];
    for (i = 0; i < len; i++) { if (acts[i].update) acts[i].update(p, dt, this.currentTime, this); }
    if (p.isDead) { this.pool.push(p); ps.splice(m, 1); m--; }
  }
  for (i = 0; i < len; i++) if (acts[i].post) acts[i].post(dt);
  // sprite sheet animation (StarlingHandler.stepEnd)
  var h = this.handler, total = this.frames.length;
  if (total > 1 && h.animSpeed > 0) {
    this.animTimer += dt;
    if (this.animTimer > 1 / h.animSpeed) {
      var stepSize = Math.floor(this.animTimer * h.animSpeed);
      for (i = 0; i < ps.length; i++) {
        var f = ps[i].currentAnimationFrame + stepSize;
        if (f >= total) f = 0;
        ps[i].currentAnimationFrame = f;
      }
      this.animTimer = 0;
    }
  }
  this.sinceLast = 0;
};
