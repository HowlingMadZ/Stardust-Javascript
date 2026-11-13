// Initializer base: registry + shared helper
var InitializerFactories = {};   // name -> function (spec, B) returning { type, active, priority, init(p) }
var initTmp = { x: 0, y: 0 };
function scalarInitializer(defRandom, assign) {
  return function (spec, B) {
    var rnd = B.random(spec.random, defRandom);
    return { type: spec.$type, active: bool(spec.active, true), priority: num(spec.priority, 0), init: function (p) { assign(p, rnd.random()); } };
  };
}
function makeInitializers(B) {
  var out = {};
  Object.keys(InitializerFactories).forEach(function (k) { out[k] = function (spec) { return InitializerFactories[k](spec, B); }; });
  return out;
}
