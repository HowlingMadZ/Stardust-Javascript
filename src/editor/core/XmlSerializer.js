// Serialising an emitter to the .sde XML
// ======================================================================================
// Serialising to the .sde XML (same layout the Stardust editor / sim-loader use)
// ======================================================================================
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(v) { return String(Math.round(v * 1e6) / 1e6); }
var GROUP = { initializer: 'initializers', action: 'actions', zone: 'zones', field: 'fields', deflector: 'deflectors', trigger: 'triggers', clock: 'clocks', handler: 'handlers', random: 'randoms', emitter: 'emitters' };
var GROUP_ORDER = ['actions', 'initializers', 'zones', 'emitters', 'clocks', 'handlers', 'fields', 'deflectors', 'triggers', 'randoms'];

function Ser() { this.groups = {}; this.counter = 0; }
Ser.prototype.add = function (cat, tag, attrs, kids) {
  var name = tag + '_' + (++this.counter), g = GROUP[cat];
  (this.groups[g] = this.groups[g] || []).push({ name: name, tag: tag, attrs: attrs, kids: kids || [] });
  return name;
};
Ser.prototype.random = function (r) { return this.add('random', 'UniformRandom', { center: fmt(r.center), radius: fmt(r.radius) }); };
Ser.prototype.element = function (cat, spec) {
  var self = this, def = D[cat][spec.$type], attrs = {}, kids = [];
  if (cat === 'action' || cat === 'initializer') attrs.active = String(spec.active !== false);
  def.params.forEach(function (p) {
    var v = spec[p.k];
    switch (p.t) {
      case 'num': case 'hidden': attrs[p.k] = fmt(v); break;
      case 'bool': attrs[p.k] = String(!!v); break;
      case 'enum': if (v) attrs[p.k] = v; break;
      case 'emitterRef': if (v !== '' && v !== undefined) attrs[p.k] = v; break;
      case 'str': attrs[p.k] = v; break;
      case 'random': attrs[p.k] = self.random(v); break;
      case 'zones': kids.push({ tag: 'zones', items: v.map(function (z) { return { ref: self.element('zone', z) }; }) }); break;
      case 'fields': kids.push({ tag: 'fields', items: v.map(function (f) { return { ref: self.element('field', f) }; }) }); break;
      case 'deflectors': kids.push({ tag: 'deflectors', items: v.map(function (f) { return { ref: self.element('deflector', f) }; }) }); break;
      case 'field': attrs[p.k] = self.element('field', v); break;
      case 'trigger': attrs[p.k] = self.element('trigger', v); break;
      case 'waypoints':
        kids.push({ tag: 'waypoints', items: v.map(function (w) { return { inline: { tag: 'Waypoint', attrs: { x: fmt(w.x), y: fmt(w.y), radius: fmt(w.radius), strength: fmt(w.strength), attenuationPower: fmt(w.attenuationPower), epsilon: fmt(w.epsilon) } } }; }) });
        break;
      case 'gradient': attrs.colors = v.colors.join(','); attrs.ratios = v.ratios.join(','); attrs.alphas = v.alphas.map(fmt).join(','); break;
    }
  });
  if (def.xmlExtra) def.xmlExtra(spec, attrs);
  return this.add(cat, spec.$type, attrs, kids);
};

function attrString(attrs) { return Object.keys(attrs).map(function (k) { return ' ' + k + '="' + esc(attrs[k]) + '"'; }).join(''); }

// returns the XML text of one emitter (a complete StardustParticleSystem document)
E.emitterToXML = function (spec) {
  var S = new Ser();
  var actions = spec.actions.map(function (a) { return S.element('action', a); });
  var inits = spec.initializers.map(function (i) { return S.element('initializer', i); });
  var clock = S.element('clock', spec.clock);
  var h = spec.particleHandler, hattrs = {};
  E.handlerParams.forEach(function (p) { hattrs[p.k] = p.t === 'num' ? fmt(h[p.k]) : String(h[p.k]); });
  var handler = S.add('handler', 'StarlingHandler', hattrs);
  var kids = [];
  if (actions.length) kids.push({ tag: 'actions', items: actions.map(function (r) { return { ref: r }; }) });
  if (inits.length) kids.push({ tag: 'initializers', items: inits.map(function (r) { return { ref: r }; }) });
  S.add('emitter', 'Emitter2D', { active: String(spec.active !== false), clock: clock, particleHandler: handler, fps: fmt(spec.fps) }, kids);
  // names of emitter 'Emitter2D' must be the emitter id
  S.groups.emitters[0].name = String(spec.id);
  // children refs need the element tags; build a name -> tag map
  var tags = {};
  Object.keys(S.groups).forEach(function (g) { S.groups[g].forEach(function (e) { tags[e.name] = e.tag; }); });
  function render(e, ind) {
    var pad = ind, s = pad + '<' + e.tag + ' name="' + esc(e.name) + '"' + attrString(e.attrs);
    if (!e.kids.length) return s + '/>';
    s += '>\n';
    e.kids.forEach(function (k) {
      s += pad + '  <' + k.tag + '>\n';
      k.items.forEach(function (it) {
        if (it.ref) s += pad + '    <' + tags[it.ref] + ' name="' + esc(it.ref) + '"/>\n';
        else s += pad + '    <' + it.inline.tag + attrString(it.inline.attrs) + '/>\n';
      });
      s += pad + '  </' + k.tag + '>\n';
    });
    return s + pad + '</' + e.tag + '>';
  }
  var out = '<StardustParticleSystem version="2.1">\n';
  GROUP_ORDER.forEach(function (g) {
    if (!S.groups[g]) return;
    out += '  <' + g + '>\n';
    S.groups[g].forEach(function (e) { out += render(e, '    ') + '\n'; });
    out += '  </' + g + '>\n';
  });
  return out + '</StardustParticleSystem>';
};
