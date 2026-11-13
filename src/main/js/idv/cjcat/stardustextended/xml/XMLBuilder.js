// XMLBuilder: turns parsed specs (XML or JSON) into engine objects (named "Builder" here)
function Builder(named, warnings) {
  this.named = named || {}; this.warnings = warnings || [];
  this.cache = {};
  this.initFactories = makeInitializers(this);
  this.actionFactories = makeActions(this);
  this.warned = {};
}
Builder.prototype.warn = function (msg) {
  if (!this.warned[msg]) { this.warned[msg] = 1; this.warnings.push(msg); }
};
Builder.prototype.arr = function (v) {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v;
  if (v.$values) return v.$values;
  return [v];
};
// resolve a reference (name string, {$ref}, or inline spec) to a spec object
Builder.prototype.resolve = function (v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'string') return this.named[v] || null;
  if (v.$ref !== undefined) return this.named[v.$ref] || null;
  return v;
};
Builder.prototype.random = function (v, def) {
  var spec = this.resolve(v);
  if (!spec) return def || new UniformRandom(0, 0);
  var r;
  if (spec.$type === 'AveragedRandom') r = new AveragedRandom(this.random(spec.randomObj, new UniformRandom(0, 0)), num(spec.sampleCount, 3) | 0);
  else r = new UniformRandom(num(spec.center, 0.5), num(spec.radius, 0));
  if (spec.$type && spec.$type !== 'UniformRandom' && spec.$type !== 'AveragedRandom') this.warn('Random "' + spec.$type + '" not supported, using uniform');
  return r;
};
var ZONES = { ImageMask: ImageMask, RectContour: RectContour, SinglePoint: SinglePoint, CircleZone: CircleZone, CircleContour: CircleContour, RectZone: RectZone, Line: Line, Sector: Sector };
Builder.prototype.zones = function (list, def) {
  var self = this, out = [];
  this.arr(list).forEach(function (z) {
    var spec = self.resolve(z); if (!spec) return;
    var C = ZONES[spec.$type];
    if (!C) { self.warn('Zone "' + spec.$type + '" not supported'); return; }
    out.push(new C(spec, self));
  });
  return out.length ? out : (def || []);
};
Builder.prototype.fields = function (list) {
  var self = this, out = [];
  this.arr(list).forEach(function (f) {
    var spec = self.resolve(f); if (!spec) return;
    if (spec.$type === 'UniformField') out.push(new UniformField(spec));
    else if (spec.$type === 'RadialField') out.push(new RadialField(spec));
    else self.warn('Field "' + spec.$type + '" not supported');
  });
  return out;
};
Builder.prototype.field = function (v, def) {
  var f = this.fields([v]);
  return f.length ? f[0] : (def || new UniformField({ x: 0, y: 0 }));
};
Builder.prototype.clock = function (v) {
  var spec = this.resolve(v);
  if (!spec) return new SteadyClock({ ticksPerCall: 0 }, this);
  if (spec.$type === 'ImpulseClock') return new ImpulseClock(spec, this);
  if (spec.$type === 'SteadyClock') return new SteadyClock(spec, this);
  this.warn('Clock "' + spec.$type + '" not supported'); return new SteadyClock({ ticksPerCall: 0 }, this);
};
Builder.prototype.handler = function (v) {
  var s = this.resolve(v) || {};
  return {
    blendMode: String(s.blendMode || 'normal'),
    smoothing: bool(s.smoothing, false),
    premultiplyAlpha: bool(s.premultiplyAlpha, true),
    animSpeed: num(s.spriteSheetAnimationSpeed, 1),
    randomStart: bool(s.spriteSheetStartAtRandomFrame, false)
  };
};
Builder.prototype.initializer = function (v) {
  var spec = this.resolve(v); if (!spec) return null;
  var f = this.initFactories[spec.$type];
  if (!f) { this.warn('Initializer "' + spec.$type + '" not supported'); return null; }
  var o = f(spec); o.spec = spec; return o;
};
Builder.prototype.action = function (v) {
  var spec = this.resolve(v); if (!spec) return null;
  var f = this.actionFactories[spec.$type];
  if (!f) { this.warn('Action "' + spec.$type + '" not supported (ignored)'); return null; }
  var o = f(spec); o.spec = spec; return o;
};
