// Creating default elements and emitters
// ======================================================================================
// Creating defaults
// ======================================================================================
function clone(o) { return JSON.parse(JSON.stringify(o)); }
E.clone = clone;
function defaultFor(p) {
  switch (p.t) {
    case 'random': return { center: p.d[0], radius: p.d[1] };
    case 'zones': return p.d.map(function (t) { return E.create('zone', t); });
    case 'fields': return p.d.map(function (t) { return E.create('field', t); });
    case 'deflectors': return [];
    case 'field': return E.create('field', p.d);
    case 'trigger': return E.create('trigger', p.d);
    case 'waypoints': return [];
    case 'gradient': return clone(p.d);
    default: return p.d;
  }
}
E.create = function (cat, type) {
  var def = D[cat][type]; if (!def) throw new Error('Unknown ' + cat + ' ' + type);
  var s = { $type: type };
  def.params.forEach(function (p) { s[p.k] = defaultFor(p); });
  if (cat === 'action' || cat === 'initializer') s.active = true;
  return s;
};
E.newWaypoint = function () { return { x: 0, y: 0, radius: 20, strength: 1, attenuationPower: 0, epsilon: 1 }; };
E.createHandler = function () { var h = {}; E.handlerParams.forEach(function (p) { h[p.k] = p.d; }); return h; };
E.createEmitter = function (id) {
  var em = { $type: 'Emitter', id: String(id), active: true, fps: 60, clock: E.create('clock', 'SteadyClock'), particleHandler: E.createHandler(), initializers: [], actions: [] };
  em.clock.ticksPerCall = 20;
  ['PositionAnimated', 'Velocity', 'Life', 'Scale', 'Alpha', 'Rotation', 'Omega', 'Mass'].forEach(function (t) { em.initializers.push(E.create('initializer', t)); });
  em.initializers[1].zones = [Object.assign(E.create('zone', 'CircleZone'), { radius: 120 })];
  ['Age', 'DeathLife', 'Move', 'AlphaCurve'].forEach(function (t) { em.actions.push(E.create('action', t)); });
  return em;
};
// switch the type of an element, keeping parameters that exist in both
E.retype = function (cat, old, type) {
  var s = E.create(cat, type);
  Object.keys(s).forEach(function (k) { if (k !== '$type' && old[k] !== undefined && typeof old[k] === typeof s[k] && !(typeof s[k] === 'object')) s[k] = old[k]; });
  return s;
};
