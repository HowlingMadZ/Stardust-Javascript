// EmitterBuilder: instantiate the emitters of a loaded sim
Sim.prototype.instantiate = function () {
  var self = this, emitters = [];
  this.emitterSpecs.forEach(function (es) {
    var B = new Builder(es.named, self.warnings);
    var em = new Emitter(es.id, es.spec, B);
    var prefix = 'emitter_' + es.id + '_image_';
    var names = Object.keys(self.atlasTextures).filter(function (n) { return n.indexOf(prefix) === 0; }).sort();
    em.frames = names.map(function (n) { return self.atlasTextures[n]; });
    if (!em.frames.length) self.warn('Emitter ' + es.id + ' has no textures in the atlas');
    emitters.push(em);
  });
  var byId = {}; emitters.forEach(function (e) { byId[e.id] = e; });
  emitters.forEach(function (e) { e.link(byId); });
  emitters.sort(function (a, b) { return a.id.localeCompare(b.id, undefined, { numeric: true }); });
  // Stage mode: sims authored on a fixed stage use top-left (0,0) as the origin. Guess it from a
  // background image or from spawn positions far from (0,0), which only make sense on such a stage.
  var far = 0;
  emitters.forEach(function (em) { em.initializers.forEach(function (i) { if (i.maxPos > far) far = i.maxPos; }); });
  this.stageMode = !!(this.hasBackground || far >= 400);
  this.stageW = this.backgroundImage ? this.backgroundImage.width : 1920;
  this.stageH = this.backgroundImage ? this.backgroundImage.height : 1080;
  return emitters;
};
Sim.prototype.warn = function (m) { if (this.warnings.indexOf(m) < 0) this.warnings.push(m); };
Stardust.Sim = Sim;
