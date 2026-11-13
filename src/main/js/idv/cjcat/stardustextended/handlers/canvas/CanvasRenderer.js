// NEW (replaces handlers/starling/*): draws the particles with the canvas 2D API
var BLEND = { normal: 'source-over', add: 'lighter', screen: 'screen', multiply: 'multiply', erase: 'destination-out', none: 'copy', below: 'destination-over' };

// tinted copy of a sprite frame (multiply by colour, keep alpha shape)
function tintedFrame(em, img, fi, fr, r, g, b) {
  var qr = (r * 31 + 0.5) | 0, qg = (g * 31 + 0.5) | 0, qb = (b * 31 + 0.5) | 0;
  var key = fi * 32768 + qr * 1024 + qg * 32 + qb;
  var c = em.tintCache[key];
  if (c) return c;
  c = document.createElement('canvas'); c.width = Math.max(1, fr.w); c.height = Math.max(1, fr.h);
  var x = c.getContext('2d');
  x.drawImage(img, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
  x.globalCompositeOperation = 'multiply';
  x.fillStyle = 'rgb(' + ((qr * 255 / 31) | 0) + ',' + ((qg * 255 / 31) | 0) + ',' + ((qb * 255 / 31) | 0) + ')';
  x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(img, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
  em.tintCache[key] = c;
  em.tintCount = (em.tintCount || 0) + 1;
  if (em.tintCount > 4000) { em.tintCache = {}; em.tintCount = 0; }
  return c;
}

Player.prototype.render = function (ctxOverride) {
  var ctx = ctxOverride || this.ctx, canvas = this.canvas;
  var W = canvas.width, H = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (this.background) { ctx.fillStyle = this.background; ctx.fillRect(0, 0, W, H); }
  else ctx.clearRect(0, 0, W, H);
  if (!this.sim) this.sim = {};
  var dpr = this.dpr || 1;
  var mode = this.originMode === 'manual' || this.originMode === 'center' || this.originMode === 'stage' ? this.originMode : (this.sim.stageMode ? 'stage' : 'center');
  var ox, oy, z, bg = this.sim.backgroundImage;
  if (mode === 'manual') {
    // free pan/zoom (used by the editor); the optional background sits at the stage origin (0,0)
    ox = this.viewX * dpr; oy = this.viewY * dpr; z = this.viewZoom * dpr;
    if (bg && this.sim.hasBackground && this.showBackground === true) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bg, ox, oy, bg.width * z, bg.height * z);
    }
  } else if (mode === 'stage') {
    // whole stage fitted into the canvas (letterboxed), origin at its top-left corner
    var sw = this.sim.stageW, sh = this.sim.stageH, k = Math.min(W / sw, H / sh);
    ox = (W - sw * k) / 2; oy = (H - sh * k) / 2; z = k * this.zoom;
    if (bg && this.sim.hasBackground && this.showBackground === true) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bg, ox, oy, sw * k, sh * k);
    }
  } else {
    ox = (this.originX === undefined ? W / 2 : this.originX * dpr);
    oy = (this.originY === undefined ? H / 2 : this.originY * dpr);
    z = this.zoom * dpr;
  }
  var img = this.sim.atlasImage;
  var list = this.reverseOrder ? this.emitters.slice().reverse() : this.emitters;
  for (var e = 0; e < list.length; e++) {
    var em = list[e], h = em.handler, frames = em.frames, ps = em.particles;
    if (!frames.length || !ps.length) continue;
    ctx.globalCompositeOperation = BLEND[h.blendMode] || 'source-over';
    ctx.imageSmoothingEnabled = this.forceSmoothing || h.smoothing;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      var a = p.alpha, s = p.scale;
      if (!(a > 0) || !(s > 0)) continue;
      if (a > 1) a = 1;
      var fi = p.currentAnimationFrame; if (fi >= frames.length) fi = 0;
      var fr = frames[fi];
      var rot = p.rotation * DEG2RAD, c = 1, sn = 0;
      if (rot) { c = Math.cos(rot); sn = Math.sin(rot); }
      ctx.setTransform(c * s * z, sn * s * z, -sn * s * z, c * s * z, ox + p.x * z, oy + p.y * z);
      ctx.globalAlpha = a;
      var src = fr.img || img;
      if (p.colorR < 0.999 || p.colorG < 0.999 || p.colorB < 0.999) {
        var t = tintedFrame(em, src, fi, fr, p.colorR, p.colorG, p.colorB);
        ctx.drawImage(t, -fr.w * 0.5, -fr.h * 0.5, fr.w, fr.h);
      } else {
        ctx.drawImage(src, fr.x, fr.y, fr.w, fr.h, -fr.w * 0.5, -fr.h * 0.5, fr.w, fr.h);
      }
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
};
