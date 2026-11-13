// Easing Back
addEasing('Back', [
  function (t, b, c, d) { var s = 1.70158; t /= d; return c * t * t * ((s + 1) * t - s) + b; },
  function (t, b, c, d) { var s = 1.70158; t = t / d - 1; return c * (t * t * ((s + 1) * t + s) + 1) + b; },
  function (t, b, c, d) {
    var s = 1.70158 * 1.525;
    if ((t /= d / 2) < 1) return c / 2 * (t * t * ((s + 1) * t - s)) + b;
    t -= 2; return c / 2 * (t * t * ((s + 1) * t + s) + 2) + b;
  }]);
