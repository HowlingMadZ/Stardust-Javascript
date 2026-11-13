// Easing Quint
addEasing('Quint', [
  function (t, b, c, d) { t /= d; return c * t * t * t * t * t + b; },
  function (t, b, c, d) { t = t / d - 1; return c * (t * t * t * t * t + 1) + b; },
  function (t, b, c, d) { if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b; t -= 2; return c / 2 * (t * t * t * t * t + 2) + b; }]);
