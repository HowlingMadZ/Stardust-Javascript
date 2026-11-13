// NEW: .sde emitter XML / JSON -> spec trees (the AS3 library builds directly from XML)
// --- XML -> spec ---------------------------------------------------------------------
function xmlToSpecs(text) {
  var doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('XML parse error');
  var rootEl = doc.documentElement;
  var named = {}, top = [];
  function kids(el) { var a = []; for (var c = el.firstElementChild; c; c = c.nextElementSibling) a.push(c); return a; }
  function attrs(el, spec) {
    for (var i = 0; i < el.attributes.length; i++) spec[el.attributes[i].name] = el.attributes[i].value;
    return spec;
  }
  // pass 1: top-level definitions
  kids(rootEl).forEach(function (group) {
    kids(group).forEach(function (el) {
      var spec = attrs(el, { $type: el.tagName });
      named[spec.name] = spec; top.push({ el: el, spec: spec });
    });
  });
  // pass 2: nested children lists
  function fill(el, spec) {
    kids(el).forEach(function (group) {
      var list = kids(group).map(function (c) {
        if (c.hasAttribute('name') && named[c.getAttribute('name')]) return { $ref: c.getAttribute('name') };
        var inline = attrs(c, { $type: c.tagName }); fill(c, inline); return inline;
      });
      spec[group.tagName] = list;
    });
  }
  top.forEach(function (t) { fill(t.el, t.spec); });
  var emitters = top.filter(function (t) { return t.spec.$type === 'Emitter2D' || t.spec.$type === 'Emitter'; }).map(function (t) { return t.spec; });
  return { named: named, emitters: emitters };
}

// --- JSON -> spec (inline objects) ---------------------------------------------------
function jsonToSpecs(text) {
  var obj = JSON.parse(text);
  return { named: {}, emitters: [obj] };
}
