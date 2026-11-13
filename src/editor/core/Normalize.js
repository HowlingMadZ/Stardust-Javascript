// Normalising loaded specs (XML named-reference form or inline JSON form) into the typed model
// ======================================================================================
// Normalising loaded specs (XML named-reference form or inline JSON form) into the typed model
// ======================================================================================
function fnum(v, d) { if (v === undefined || v === null || v === '') return d; var x = typeof v === 'number' ? v : parseFloat(v); return isNaN(x) ? d : x; }
function fbool(v, d) { if (v === undefined || v === null || v === '') return d; return v === true || v === 'true'; }
function list(str) { return Array.isArray(str) ? str.map(Number) : String(str === undefined ? '' : str).split(',').map(function (x) { return parseFloat(x); }).filter(function (x) { return !isNaN(x); }); }

function pick(raw, p) {
  if (raw[p.k] !== undefined) return raw[p.k];
  var al = p.alias || (D.zone[raw.$type] && D.zone[raw.$type].alias && D.zone[raw.$type].alias[p.k]);
  if (al) for (var i = 0; i < al.length; i++) if (raw[al[i]] !== undefined) return raw[al[i]];
  return undefined;
}
function normElement(cat, raw, B, warn) {
  if (!raw) return null;
  var def = D[cat][raw.$type];
  if (!def) { warn(cat + ' "' + raw.$type + '" is not supported by this editor (dropped)'); return null; }
  var out = { $type: raw.$type };
  def.params.forEach(function (p) {
    var v = pick(raw, p);
    switch (p.t) {
      case 'num': out[p.k] = fnum(v, p.d); break;
      case 'bool': out[p.k] = fbool(v, p.d); break;
      case 'enum': out[p.k] = (typeof v === 'string' && p.opts.indexOf(v) >= 0) ? v : p.d; break;
      case 'hidden': out[p.k] = fnum(v, p.d); break;
      case 'str': out[p.k] = v === undefined || v === null ? p.d : String(v); break;
      case 'emitterRef': out[p.k] = v === undefined || v === null ? '' : String(v); break;
      case 'random': {
        var r = B.resolve(v), c = p.d[0], rad = p.d[1];
        if (r) { c = fnum(r.center, c); rad = fnum(r.radius, rad); }
        else if (raw.$type === 'NormalDrift' && raw.max !== undefined) rad = fnum(raw.max, rad);
        else if (raw.$type === 'RandomDrift') rad = fnum(p.k === 'randomX' ? raw.maxX : raw.maxY, rad);
        out[p.k] = { center: c, radius: rad }; break;
      }
      case 'zones': {
        var zl = v !== undefined ? B.arr(v) : (raw.zone ? [raw.zone] : null);
        out[p.k] = zl ? zl.map(function (z) { return normElement('zone', B.resolve(z), B, warn); }).filter(Boolean) : defaultFor(p);
        break;
      }
      case 'fields': out[p.k] = B.arr(v).map(function (f) { return normElement('field', B.resolve(f), B, warn); }).filter(Boolean); break;
      case 'deflectors': out[p.k] = B.arr(v).map(function (f) { return normElement('deflector', B.resolve(f), B, warn); }).filter(Boolean); break;
      case 'field': {
        var fr = B.resolve(v !== undefined ? v : (raw.fields ? B.arr(raw.fields)[0] : undefined));
        out[p.k] = normElement('field', fr, B, warn) || defaultFor(p); break;
      }
      case 'trigger': out[p.k] = normElement('trigger', B.resolve(v), B, warn) || defaultFor(p); break;
      case 'waypoints': out[p.k] = B.arr(v).map(function (w) { return { x: fnum(w.x, 0), y: fnum(w.y, 0), radius: fnum(w.radius, 20), strength: fnum(w.strength, 1), attenuationPower: fnum(w.attenuationPower, 0), epsilon: fnum(w.epsilon, 1) }; }); break;
      case 'gradient': {
        var cs = list(raw.colorsStr !== undefined ? raw.colorsStr : raw.colors), rs = list(raw.ratiosStr !== undefined ? raw.ratiosStr : raw.ratios), as = list(raw.alphasStr !== undefined ? raw.alphasStr : raw.alphas);
        var m = Math.min(cs.length, rs.length, as.length);
        out[p.k] = m >= 2 ? { colors: cs.slice(0, m), ratios: rs.slice(0, m), alphas: as.slice(0, m) } : clone(p.d); break;
      }
      default: out[p.k] = v;
    }
  });
  if (cat === 'action' || cat === 'initializer') out.active = fbool(raw.active, true);
  return out;
}

E.normalizeEmitter = function (raw, B, id, warn) {
  var hand = B.resolve(raw.particleHandler) || {};
  var em = { $type: 'Emitter', id: String(id), active: fbool(raw.active, true), fps: fnum(raw.fps, 60) };
  var clk = B.resolve(raw.clock);
  em.clock = (clk && normElement('clock', clk, B, warn)) || E.create('clock', 'SteadyClock');
  em.particleHandler = {};
  E.handlerParams.forEach(function (p) {
    var v = hand[p.k];
    em.particleHandler[p.k] = p.t === 'num' ? fnum(v, p.d) : p.t === 'bool' ? fbool(v, p.d) : (BLEND.indexOf(v) >= 0 ? v : p.d);
  });
  em.initializers = B.arr(raw.initializers).map(function (i) { return normElement('initializer', B.resolve(i), B, warn); }).filter(Boolean);
  em.actions = B.arr(raw.actions).map(function (a) { return normElement('action', B.resolve(a), B, warn); }).filter(Boolean);
  return em;
};
