// Canvas view: resize, world <-> screen
// ------------------------------------------------------------------ view + gizmos
var dpr = window.devicePixelRatio || 1, W = 0, H = 0;
function resize() {
  var r = $('stage').getBoundingClientRect(); W = r.width; H = r.height;
  [canvas, gz].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
  player.dpr = dpr;
  if (!resize.done) { player.viewX = W / 2; player.viewY = H / 2; resize.done = true; }
  drawGizmos();
}
function w2s(x, y) { return [player.viewX + x * player.viewZoom, player.viewY + y * player.viewZoom]; }
function s2w(x, y) { return [(x - player.viewX) / player.viewZoom, (y - player.viewY) / player.viewZoom]; }
