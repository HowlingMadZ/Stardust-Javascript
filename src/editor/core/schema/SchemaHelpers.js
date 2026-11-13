// Helpers that describe parameters (n, b, en, rnd, zs, st) and shared option lists
function n(k, l, d, min, max, step, x) { return Object.assign({ k: k, t: 'num', l: l, d: d, min: min, max: max, step: step }, x || {}); }
function b(k, l, d) { return { k: k, t: 'bool', l: l, d: d }; }
function en(k, l, opts, d) { return { k: k, t: 'enum', l: l, opts: opts, d: d }; }
function rnd(k, l, c, r, min, max, step, x) { return Object.assign({ k: k, t: 'random', l: l, d: [c, r], min: min, max: max, step: step }, x || {}); }
function zs(k, l, types) { return { k: k, t: 'zones', l: l, d: types }; }
function st(k, l, d) { return { k: k, t: 'str', l: l, d: d }; }
function X(k, l, d) { return n(k, l, d, -1500, 1500, 1); }

var EASING = ['', 'Linear.easeNone', 'Quad.easeIn', 'Quad.easeOut', 'Quad.easeInOut', 'Cubic.easeIn', 'Cubic.easeOut', 'Cubic.easeInOut',
  'Quart.easeIn', 'Quart.easeOut', 'Quart.easeInOut', 'Quint.easeIn', 'Quint.easeOut', 'Quint.easeInOut', 'Sine.easeIn', 'Sine.easeOut', 'Sine.easeInOut',
  'Expo.easeIn', 'Expo.easeOut', 'Expo.easeInOut', 'Circ.easeIn', 'Circ.easeOut', 'Circ.easeInOut', 'Back.easeIn', 'Back.easeOut', 'Back.easeInOut',
  'Elastic.easeIn', 'Elastic.easeOut', 'Elastic.easeInOut'];
var BLEND = ['normal', 'add', 'screen', 'multiply', 'erase', 'below', 'none'];
var ZTYPES = ['ImageMask', 'SinglePoint', 'CircleZone', 'CircleContour', 'RectZone', 'RectContour', 'Line', 'Sector'];

var D = E.defs = { initializer: {}, action: {}, zone: {}, field: {}, deflector: {}, trigger: {}, clock: {} };
