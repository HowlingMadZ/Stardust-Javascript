// AlphaCurve action
ActionFactories.AlphaCurve = function (s, B, base, tmp) {
  var inA = num(s.inAlpha, 0), outA = num(s.outAlpha, 0), inL = num(s.inLifespan, 1), outL = num(s.outLifespan, 1);
  var inF = Easing[s.inFunction] || Easing['Linear.easeIn'], outF = Easing[s.outFunction] || Easing['Linear.easeOut'];
  return base(s, {
    update: function (p) {
      var age = p.initLife - p.life;
      if (age < inL) p.alpha = inF(age, inA, p.initAlpha - inA, inL);
      else if (p.life < outL) p.alpha = outF(outL - p.life, p.initAlpha, outA - p.initAlpha, outL);
      else p.alpha = p.initAlpha;
    }
  });
};
