// Loading a .sde into the editor model
// ======================================================================================
// Loading a .sde into the editor model
// ======================================================================================
function frameCanvas(img, r) {
  var c = document.createElement('canvas'); c.width = Math.max(1, r.w); c.height = Math.max(1, r.h);
  c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
  return c;
}
// -> Promise<{emitters:[{id,spec,frames:[{canvas,name}]}], background, hasBackground, warnings}>
E.loadSde = function (buffer) {
  return Stardust.Sim.fromSde(buffer).then(function (sim) {
    var warnings = sim.warnings.filter(function (w) { return /snapshot|background|texture/i.test(w); });
    function warn(m) { if (warnings.indexOf(m) < 0) warnings.push(m); }
    var emitters = sim.emitterSpecs.map(function (es) {
      var B = new Stardust.Builder(es.named, []);
      var spec = E.normalizeEmitter(es.spec, B, es.id, warn);
      var prefix = 'emitter_' + es.id + '_image_';
      var frames = Object.keys(sim.atlasTextures).filter(function (k) { return k.indexOf(prefix) === 0; }).sort()
        .map(function (k) { return { name: k, canvas: frameCanvas(sim.atlasImage, sim.atlasTextures[k]) }; });
      return { id: String(es.id), spec: spec, frames: frames };
    });
    return {
      emitters: emitters, warnings: warnings, hasBackground: sim.hasBackground,
      background: sim.backgroundBytes ? { bytes: sim.backgroundBytes, img: sim.backgroundImage } : null,
      stageMode: sim.stageMode, stageW: sim.stageW, stageH: sim.stageH
    };
  });
};

// decode user image bytes/file to a canvas
E.imageToCanvas = function (bytes, mime) {
  return Stardust.io.loadImage(bytes, mime).then(function (img) {
    var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0); return c;
  });
};
