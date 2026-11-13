// Parameter schema: deflectors
// ---------- deflectors ----------
var BOUNCE = [n('bounce', 'Bounce', 0.8, 0, 2, 0.01), n('slipperiness', 'Slipperiness', 1, 0, 1, 0.01), b('active', 'Active', true)];
D.deflector.LineDeflector = { label: 'Line', params: [X('x', 'X', 0), X('y', 'Y', 0), n('normalX', 'Normal X', 0, -1, 1, 0.01), n('normalY', 'Normal Y', -1, -1, 1, 0.01)].concat(BOUNCE) };
D.deflector.CircleDeflector = { label: 'Circle', params: [X('x', 'X', 0), X('y', 'Y', 0), n('radius', 'Radius', 100, 1, 1500, 1)].concat(BOUNCE) };
D.deflector.WrappingBox = { label: 'Wrapping box', params: [X('x', 'X', 0), X('y', 'Y', 0), n('width', 'Width', 640, 1, 3000, 1), n('height', 'Height', 480, 1, 3000, 1), b('active', 'Active', true)] };
