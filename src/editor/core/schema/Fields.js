// Parameter schema: fields
// ---------- fields ----------
var FACT = [b('active', 'Active', true), b('massless', 'Massless', true)];
D.field.UniformField = { label: 'Uniform (gravity / wind)', params: [n('x', 'X', 0, -50, 50, 0.1), n('y', 'Y', 6, -50, 50, 0.1)].concat(FACT) };
D.field.RadialField = { label: 'Radial (attract / repel)', params: [X('x', 'X', 0), X('y', 'Y', 0), n('strength', 'Strength', 1, -50, 50, 0.1),
  n('attenuationPower', 'Attenuation', 0, 0, 4, 0.01), n('epsilon', 'Epsilon', 1, 0, 100, 0.1)].concat(FACT) };
