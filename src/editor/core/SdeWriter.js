// Atlas packing + building the .sde file
// ======================================================================================
// Atlas packing + .sde building
// ======================================================================================
function pack(items, W) { // shelf packer, 2px padding; returns {w,h,ok}
  var x = 2, y = 2, rowH = 0, maxX = 0;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (it.w + 4 > W) return { ok: false };
    if (x + it.w + 2 > W) { x = 2; y += rowH + 2; rowH = 0; }
    it.px = x; it.py = y; x += it.w + 2; rowH = Math.max(rowH, it.h); maxX = Math.max(maxX, x);
  }
  return { ok: true, w: maxX, h: y + rowH + 2 };
}
function pad(i, count) { var d = String(count).length, s = String(i); while (s.length < d) s = '0' + s; return s; }

function canvasToBytes(c) {
  return new Promise(function (resolve, reject) {
    c.toBlob(function (blob) {
      if (!blob) return reject(new Error('Could not encode the atlas PNG'));
      var fr = new FileReader();
      fr.onload = function () { resolve(new Uint8Array(fr.result)); };
      fr.onerror = function () { reject(new Error('Could not read the atlas PNG')); };
      fr.readAsArrayBuffer(blob);
    }, 'image/png');
  });
}

// project: { emitters:[{id, spec, frames:[{canvas}]}], background: {bytes}|null, includeBackground:bool }
E.buildSde = function (project) {
  var items = [], enc = new TextEncoder();
  for (var ei = 0; ei < project.emitters.length; ei++) {
    var em = project.emitters[ei];
    if (!em.frames.length) return Promise.reject(new Error('Emitter ' + em.id + ' has no texture. Add at least one image before saving.'));
    em.frames.forEach(function (f, i) { items.push({ name: 'emitter_' + em.id + '_image_' + pad(i, em.frames.length), canvas: f.canvas, w: f.canvas.width, h: f.canvas.height }); });
  }
  var order = items.slice().sort(function (a, b) { return b.h - a.h || b.w - a.w; });
  var best = null;
  for (var W = 64; W <= 8192; W *= 2) {
    var r = pack(order, W);
    if (r.ok && (!best || r.w * r.h < best.w * best.h)) { best = { W: W, w: r.w, h: r.h }; }
    if (r.ok && r.h <= r.w * 1.2) break;
  }
  if (!best) return Promise.reject(new Error('Textures do not fit into a 8192px atlas'));
  pack(order, best.W);
  var cv = document.createElement('canvas'); cv.width = best.w; cv.height = best.h;
  var cx = cv.getContext('2d');
  order.forEach(function (it) { cx.drawImage(it.canvas, it.px, it.py); });
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<TextureAtlas imagePath="atlas_0.png">\n';
  order.forEach(function (it) { xml += '  <SubTexture name="' + it.name + '" x="' + it.px + '" y="' + it.py + '" width="' + it.w + '" height="' + it.h + '"/>\n'; });
  xml += '</TextureAtlas>';
  return canvasToBytes(cv).then(function (png) {
    var hasBg = !!(project.includeBackground && project.background && project.background.bytes);
    var files = [{ name: 'atlas_0.png', data: png }, { name: 'atlas_0.xml', data: enc.encode(xml) }];
    project.emitters.forEach(function (em) { files.push({ name: 'stardustEmitter_' + em.id + '.xml', data: enc.encode(E.emitterToXML(em.spec)) }); });
    if (hasBg) files.push({ name: 'background.png', data: project.background.bytes });
    files.push({ name: 'descriptor.json', data: enc.encode(JSON.stringify({ version: '2.1', hasBackground: String(hasBg), backgroundColor: 0 })) });
    return E.zip(files);
  });
};
