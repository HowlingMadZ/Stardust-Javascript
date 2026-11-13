// Action base: registry + shared helper
var ActionFactories = {};        // name -> function (spec, B, base, tmp) returning { type, active, priority, pre, update, post, fire }
function actionBase(spec, extra) {
  var a = { type: spec.$type, active: bool(spec.active, true), priority: 0, pre: null, update: null };
  for (var k in extra) a[k] = extra[k];
  if (spec.priority !== undefined && spec.priority !== null && spec.priority !== '') a.priority = num(spec.priority, a.priority);
  return a;
}
function makeActions(B) {
  var tmp = { x: 0, y: 0 }, A = {};
  Object.keys(ActionFactories).forEach(function (k) { A[k] = function (s) { return ActionFactories[k](s, B, actionBase, tmp); }; });
  return A;
}
