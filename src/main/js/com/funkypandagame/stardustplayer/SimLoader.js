// SimLoader: .sde bytes -> ProjectValueObject
Sim.fromSde = function (buffer, name) {
    return new Promise(function (resolve) { resolve(Sim._fromSde(buffer, name)); });
  };
  // Load a .sde over http(s) (localhost or a server). Does not work from file:// - use a file input there.
  Sim.fromUrl = function (url) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('GET', url); x.responseType = 'arraybuffer';
      x.onload = function () { (x.status === 200 || x.status === 0) && x.response ? resolve(Sim.fromSde(x.response, url.split('/').pop().replace(/\.sde$/i, ''))) : reject(new Error('HTTP ' + x.status + ' for ' + url)); };
      x.onerror = function () { reject(new Error('Could not fetch ' + url)); };
      x.send();
    });
  };
  Sim._fromSde = function (buffer, name) {
    var files = unzip(buffer);
    var sim = new Sim();
    sim.name = name || '';
    if (files['descriptor.json']) {
      try { sim.descriptor = JSON.parse(utf8(files['descriptor.json'])); } catch (e) { sim.warnings.push('descriptor.json unreadable'); }
    }
    var names = Object.keys(files);
    var atlasXmlName = names.filter(function (n) { return /^atlas_0\.xml$/i.test(n); })[0];
    var atlasPngName = names.filter(function (n) { return /^atlas_0\.png$/i.test(n); })[0];
    if (!atlasPngName || !atlasXmlName) throw new Error('This .sde has no atlas_0.png / atlas_0.xml');
    var emitterFiles = names.filter(function (n) { return /^stardustEmitter_.+\.(xml|json)$/i.test(n); });
    if (!emitterFiles.length) throw new Error('This .sde contains no emitters');
    emitterFiles.sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
    names.forEach(function (n) { if (/^emitterSnapshot_/.test(n)) sim.warnings.push('Particle snapshot "' + n + '" ignored (simulation starts empty)'); });

    emitterFiles.forEach(function (fn) {
      var id = fn.replace(/^stardustEmitter_/i, '').replace(/\.(xml|json)$/i, '');
      var text = utf8(files[fn]);
      var parsed = /\.json$/i.test(fn) ? jsonToSpecs(text) : xmlToSpecs(text);
      if (!parsed.emitters.length) { sim.warnings.push('No emitter found in ' + fn); return; }
      sim.emitterSpecs.push({ id: id, spec: parsed.emitters[0], named: parsed.named });
    });
    sim.atlasTextures = parseAtlasXml(utf8(files[atlasXmlName]));
    var bgName = names.filter(function (n) { return /^background\.png$/i.test(n); })[0];
    var bgPromise = bgName ? loadImage(files[bgName]).catch(function () { sim.warnings.push('background.png could not be decoded'); return null; }) : Promise.resolve(null);
    sim.hasBackground = !!bgName && String(sim.descriptor.hasBackground) !== 'false';
    sim.backgroundBytes = bgName ? files[bgName] : null;
    return Promise.all([loadImage(files[atlasPngName]), bgPromise]).then(function (r) {
      var img = r[0];
      sim.backgroundImage = r[1];
      sim.atlasImage = img;
      // dry run to collect warnings about unsupported elements
      sim.instantiate();
      return sim;
    });
};
