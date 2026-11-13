// ColorGradient action
ActionFactories.ColorGradient = function (s, B, base, tmp) {
    var steps = num(s.numSteps, 500) | 0;
    var g = s.gradient || s; // editor specs nest the gradient
    var colors = splitList(g.colorsStr !== undefined ? g.colorsStr : g.colors);
    var ratios = splitList(g.ratiosStr !== undefined ? g.ratiosStr : g.ratios);
    var alphas = splitList(g.alphasStr !== undefined ? g.alphasStr : g.alphas);
    var lut = buildGradient(colors, ratios, alphas, steps);
    return base(s, {
      update: function (p) {
        var i = ((steps - 1) * p.life / p.initLife) | 0;
        if (!(i >= 0)) i = 0; if (i > steps - 1) i = steps - 1;
        var o = i * 4;
        p.colorR = lut[o]; p.colorG = lut[o + 1]; p.colorB = lut[o + 2]; p.alpha = lut[o + 3];
      }
    });
  };

function splitList(v) {
  if (Array.isArray(v)) return v.map(Number);
  return String(v === undefined ? '' : v).split(',').map(function (x) { return parseFloat(x); });
}
// Linear RGBA gradient lookup table. Like the original (ColorGradient.setGradient fills its
// vectors from the last pixel to the first), the table is REVERSED: index steps-1 is the gradient
// start (ratio 0) and is used at birth (life == initLife), index 0 is the end of the gradient.
function buildGradient(colors, ratios, alphas, steps) {
  var lut = new Float32Array(steps * 4);
  var n = Math.min(colors.length, ratios.length, alphas.length);
  if (!n) { for (var z = 0; z < steps; z++) { lut[z * 4] = lut[z * 4 + 1] = lut[z * 4 + 2] = lut[z * 4 + 3] = 1; } return lut; }
  for (var pix = 0; pix < steps; pix++) {
    var i = pix, slot = steps - 1 - pix;
    var r = steps > 1 ? i / (steps - 1) * 255 : 0;
    var a = 0;
    while (a < n - 1 && r > ratios[a + 1]) a++;
    var b = Math.min(a + 1, n - 1);
    var span = ratios[b] - ratios[a];
    var t = span > 0 ? (r - ratios[a]) / span : 0;
    if (t < 0) t = 0; if (t > 1) t = 1;
    var c0 = colors[a], c1 = colors[b];
    var R = lerp(((c0 >> 16) & 255), ((c1 >> 16) & 255), t) / 255;
    var G = lerp(((c0 >> 8) & 255), ((c1 >> 8) & 255), t) / 255;
    var Bc = lerp((c0 & 255), (c1 & 255), t) / 255;
    lut[slot * 4] = R; lut[slot * 4 + 1] = G; lut[slot * 4 + 2] = Bc; lut[slot * 4 + 3] = lerp(alphas[a], alphas[b], t);
  }
  return lut;
}
