// NEW (no AS3 counterpart): registry of sprites used by the ImageMask zone
// ---- Image masks: emit from the visible (non-transparent) pixels of a sprite ---------------
// Stardust.Masks.set('shirt', canvasOrImage, {x, y, scale, anchor})  registers a sprite under a name.
// An 'ImageMask' zone with maskName 'shirt' then spawns particles on its opaque pixels. The sprite is
// looked up at every emission, so a game can swap the image / move it before each burst.
var Masks = {
  _m: {},
  set: function (name, source, opts) {
    opts = opts || {};
    var w = source.naturalWidth || source.videoWidth || source.width, h = source.naturalHeight || source.videoHeight || source.height;
    var data;
    if (source.data && source.data.length === w * h * 4) data = source.data; // ImageData
    else {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var cx = c.getContext('2d'); cx.drawImage(source, 0, 0);
      data = cx.getImageData(0, 0, w, h).data; // throws SecurityError for cross-origin / tainted images
    }
    this._m[name] = { name: name, w: w, h: h, data: data, x: num(opts.x, 0), y: num(opts.y, 0), scale: num(opts.scale, 1), anchor: opts.anchor || 'topleft', cache: {} };
    return this._m[name];
  },
  // move / rescale a registered sprite without re-reading its pixels
  place: function (name, opts) {
    var m = this._m[name]; if (!m) return;
    if (opts.x !== undefined) m.x = opts.x; if (opts.y !== undefined) m.y = opts.y;
    if (opts.scale !== undefined) m.scale = opts.scale; if (opts.anchor !== undefined) m.anchor = opts.anchor;
  },
  get: function (name) { return this._m[name] || null; },
  remove: function (name) { delete this._m[name]; },
  // list of pixel indices with alpha > threshold (0..1)
  pixels: function (m, thr) {
    var key = thr.toFixed(4), c = m.cache[key];
    if (c) return c;
    var cut = thr * 255, d = m.data, n = m.w * m.h, k = 0, i;
    for (i = 0; i < n; i++) if (d[i * 4 + 3] > cut) k++;
    var idx = new Uint32Array(k); k = 0;
    for (i = 0; i < n; i++) if (d[i * 4 + 3] > cut) idx[k++] = i;
    return (m.cache[key] = idx);
  }
};
