// Easing Elastic
function elastic(mode) {
  return function (t, b, c, d) {
    var a = 0, p = 0, s;
    if (t === 0) return b;
    if (mode === 2) { if ((t /= d / 2) === 2) return b + c; } else if ((t /= d) === 1) return b + c;
    p = mode === 2 ? d * (0.3 * 1.5) : d * 0.3;
    if (!a || a < Math.abs(c)) { a = c; s = p / 4; } else s = p / (2 * Math.PI) * Math.asin(c / a);
    if (mode === 0) return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * 2 * Math.PI / p)) + b;
    if (mode === 1) return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * 2 * Math.PI / p) + c + b;
    if (t < 1) return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * 2 * Math.PI / p)) + b;
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * 2 * Math.PI / p) * 0.5 + c + b;
  };
}
addEasing('Elastic', [elastic(0), elastic(1), elastic(2)]);
