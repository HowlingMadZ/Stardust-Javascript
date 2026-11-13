// LifeTrigger
TriggerFactories.LifeTrigger = function (s, B) {
  var lo = num(s.lowerBound, 0), hi = num(s.upperBound, Number.MAX_VALUE), within = bool(s.triggerWithinBounds, true);
  return function (p) { return within ? (p.life >= lo && p.life <= hi) : (p.life < lo || p.life > hi); };
};
