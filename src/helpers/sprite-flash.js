/*!
 * sprite-flash.js - white "swap-in" flash that lives on ONE sprite (no full-screen overlay).
 *
 *   var flash = SpriteFlash.create();               // one per sprite you want to flash
 *   flash.start(1000);                              // 1 s fade, white -> normal
 *   // in your draw loop, in the sprite's own layer, instead of ctx.drawImage(sprite, x, y, w, h):
 *   flash.draw(ctx, sprite, x, y, w, h, performance.now());
 *
 * The white is painted only where the sprite has pixels (canvas 'source-atop' on a scratch canvas), so
 * transparent areas stay transparent and anything layered above the sprite (a jacket) still covers it.
 * Colour can be anything: flash.draw(..., '#fff'). Works with canvas / image / ImageBitmap sprites.
 */
(function (root) {
  'use strict';
  var scratch = document.createElement('canvas'), sx = scratch.getContext('2d');
  function ease(t) { return t * t * (3 - 2 * t); } // smoothstep
  function paint(ctx, sprite, x, y, w, h, amount, color) {
    if (!(amount > 0.002)) { ctx.drawImage(sprite, x, y, w, h); return; }
    var t = ctx.getTransform ? ctx.getTransform() : null, k = t ? Math.sqrt(t.a * t.a + t.b * t.b) : 1;
    var pw = Math.max(1, Math.ceil(Math.abs(w) * k)), ph = Math.max(1, Math.ceil(Math.abs(h) * k));
    if (scratch.width !== pw || scratch.height !== ph) { scratch.width = pw; scratch.height = ph; }
    sx.globalCompositeOperation = 'source-over'; sx.globalAlpha = 1; sx.clearRect(0, 0, pw, ph);
    sx.drawImage(sprite, 0, 0, pw, ph);
    sx.globalCompositeOperation = 'source-atop'; sx.globalAlpha = Math.min(1, amount); sx.fillStyle = color || '#fff'; sx.fillRect(0, 0, pw, ph);
    sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
    ctx.drawImage(scratch, 0, 0, pw, ph, x, y, w, h);
  }
  root.SpriteFlash = {
    paint: paint, // paint(ctx, sprite, x, y, w, h, amount 0..1, color) - stateless
    create: function () {
      var start = -1, dur = 1000;
      return {
        start: function (ms) { dur = ms || 1000; start = performance.now(); },
        get active() { return start >= 0; },
        amount: function (now) { if (start < 0) return 0; var t = ((now === undefined ? performance.now() : now) - start) / dur; if (t >= 1) { start = -1; return 0; } return 1 - ease(t); },
        draw: function (ctx, sprite, x, y, w, h, now, color) { paint(ctx, sprite, x, y, w, h, this.amount(now), color); }
      };
    }
  };
})(typeof window !== 'undefined' ? window : this);
