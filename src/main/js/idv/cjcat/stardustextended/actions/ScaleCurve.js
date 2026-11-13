// ScaleCurve action
ActionFactories.ScaleCurve = function (s, B, base, tmp) {
  var inS = num(s.inScale, 0), outS = num(s.outScale, 0), inL = num(s.inLifespan, 0), outL = num(s.outLifespan, 0);
  var inF = Easing[s.inFunction] || Easing['Linear.easeIn'], outF = Easing[s.outFunction] || Easing['Linear.easeOut'];
  return base(s, {
    update: function (p) {
      var age = p.initLife - p.life;
      if (age < inL) p.scale = inF(age, inS, p.initScale - inS, inL);
      else if (p.life < outL) p.scale = outF(outL - p.life, p.initScale, outS - p.initScale, outL);
      else p.scale = p.initScale;
    }
  });
};
