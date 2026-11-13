// Easing Circ
addEasing('Circ', [
  function (t, b, c, d) { t /= d; return -c * (Math.sqrt(1 - t * t) - 1) + b; },
  function (t, b, c, d) { t = t / d - 1; return c * Math.sqrt(1 - t * t) + b; },
  function (t, b, c, d) {
    if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    t -= 2; return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
  }]);
