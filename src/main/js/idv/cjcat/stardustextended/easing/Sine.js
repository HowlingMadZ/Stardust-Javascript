// Easing Sine
addEasing('Sine', [
  function (t, b, c, d) { return -c * Math.cos(t / d * HP) + c + b; },
  function (t, b, c, d) { return c * Math.sin(t / d * HP) + b; },
  function (t, b, c, d) { return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b; }]);
