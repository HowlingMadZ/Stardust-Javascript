// Easing Quad
addEasing('Quad', [
  function (t, b, c, d) { t /= d; return c * t * t + b; },
  function (t, b, c, d) { t /= d; return -c * t * (t - 2) + b; },
  function (t, b, c, d) { if ((t /= d / 2) < 1) return c / 2 * t * t + b; --t; return -c / 2 * (t * (t - 2) - 1) + b; }]);
