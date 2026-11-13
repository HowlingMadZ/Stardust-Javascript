// Parameter schema: actions
// ---------- actions ----------
var A = D.action;
A.Age = { group: 'Life', label: 'Age', desc: 'Counts the life of particles down.', params: [n('multiplier', 'Multiplier', 1, 0, 5, 0.01)] };
A.DeathLife = { group: 'Life', label: 'Death (life ends)', desc: 'Kills particles whose life reached 0.', params: [] };
A.Die = { group: 'Life', label: 'Die', desc: 'Kills every particle immediately.', params: [] };
A.DeathZone = { group: 'Life', label: 'Death zone', desc: 'Kills particles inside (or outside) the zones.', params: [zs('zones', 'Zones', ['RectZone']), b('inverted', 'Inverted (kill outside)', false)] };
A.Move = { group: 'Motion', label: 'Move', desc: 'Moves particles by their velocity.', params: [n('multiplier', 'Multiplier', 1, 0, 5, 0.01)] };
A.Spin = { group: 'Motion', label: 'Spin', desc: 'Rotates particles by omega.', params: [n('multiplier', 'Multiplier', 1, 0, 20, 0.1)] };
A.Oriented = { group: 'Motion', label: 'Oriented', desc: 'Rotates particles to face their velocity.', params: [n('factor', 'Factor', 1, 0, 1, 0.01), n('offset', 'Offset (deg)', 0, -360, 360, 1)] };
A.Damping = { group: 'Motion', label: 'Damping', desc: 'Slows particles down (friction).', params: [n('damping', 'Damping', 0.05, 0, 1, 0.001)] };
A.SpeedLimit = { group: 'Motion', label: 'Speed limit', desc: 'Caps the particle speed (px/s).', params: [n('limit', 'Limit', 100, 0, 3000, 1)] };
A.Accelerate = { group: 'Motion', label: 'Accelerate', desc: 'Speeds up / slows down along the current direction.', params: [n('acceleration', 'Acceleration', 1, -50, 50, 0.1)] };
A.AccelerationZone = { group: 'Motion', label: 'Acceleration zone', desc: 'Accelerates particles while they are inside the zones.',
  params: [zs('zones', 'Zones', ['RectZone']), b('inverted', 'Inverted', false), n('acceleration', 'Acceleration', 200, -2000, 2000, 1),
    b('useParticleDirection', 'Use particle direction', true), n('directionX', 'Direction X', 100, -100, 100, 1), n('directionY', 'Direction Y', 0, -100, 100, 1)] };
A.Gravity = { group: 'Forces', label: 'Gravity', desc: 'Accelerates particles by force fields (uniform = gravity / wind, radial = attract / repel).',
  params: [{ k: 'fields', t: 'fields', l: 'Fields', d: ['UniformField'] }] };
A.VelocityField = { group: 'Forces', label: 'Velocity field', desc: 'Sets (not adds to) the velocity from a field.', params: [{ k: 'field', t: 'field', l: 'Field', d: 'UniformField' }] };
A.Impulse = { group: 'Forces', label: 'Impulse', desc: 'One-shot push from a field, fired with the button.', fire: true, params: [{ k: 'field', t: 'field', l: 'Field', d: 'UniformField' }] };
A.Explode = { group: 'Forces', label: 'Explode', desc: 'Shockwave from a point, fired with the button.', fire: true,
  params: [X('x', 'X', 0), X('y', 'Y', 0), n('strength', 'Strength', 5, 0, 100, 0.1), n('growSpeed', 'Grow speed', 40, 1, 500, 1), n('maxDistance', 'Max distance', 200, 1, 2000, 1),
    n('attenuationPower', 'Attenuation', 0.1, 0, 3, 0.01), n('epsilon', 'Epsilon', 1, 0, 50, 0.1)] };
A.NormalDrift = { group: 'Forces', label: 'Normal drift', desc: 'Random sideways drift relative to the motion.',
  params: [b('massless', 'Massless', false), rnd('random', 'Drift', 0, 1, -10, 10, 0.01)],
  xmlExtra: function (s, a) { a.max = Math.abs(s.random.radius); } };
A.RandomDrift = { group: 'Forces', label: 'Random drift', desc: 'Random acceleration on both axes.',
  params: [b('massless', 'Massless', false), rnd('randomX', 'Drift X', 0, 10, -100, 100, 0.1), rnd('randomY', 'Drift Y', 0, 10, -100, 100, 0.1)],
  xmlExtra: function (s, a) { a.maxX = Math.abs(s.randomX.radius); a.maxY = Math.abs(s.randomY.radius); } };
A.FollowWaypoints = { group: 'Forces', label: 'Attraction points', desc: 'Particles are pulled through a chain of waypoints.',
  params: [b('loop', 'Loop', false), b('massless', 'Massless', true), { k: 'waypoints', t: 'waypoints', l: 'Waypoints', d: [] }] };
A.Deflect = { group: 'Collision', label: 'Deflect', desc: 'Bounces particles off lines / circles, or wraps them around a box.',
  params: [{ k: 'deflectors', t: 'deflectors', l: 'Deflectors', d: [] }] };
A.AlphaCurve = { group: 'Appearance', label: 'Alpha curve', desc: 'Fade in at birth / out before death.',
  params: [n('inAlpha', 'Alpha at birth', 0, 0, 1, 0.01), n('inLifespan', 'Fade-in time (s)', 0.2, 0, 10, 0.01), en('inFunction', 'Fade-in easing', EASING, ''),
    n('outAlpha', 'Alpha at death', 0, 0, 1, 0.01), n('outLifespan', 'Fade-out time (s)', 0.5, 0, 10, 0.01), en('outFunction', 'Fade-out easing', EASING, '')] };
A.ScaleCurve = { group: 'Appearance', label: 'Scale curve', desc: 'Grow in at birth / shrink before death.',
  params: [n('inScale', 'Scale at birth', 0, 0, 5, 0.01), n('inLifespan', 'Grow time (s)', 0.2, 0, 10, 0.01), en('inFunction', 'Grow easing', EASING, ''),
    n('outScale', 'Scale at death', 0, 0, 5, 0.01), n('outLifespan', 'Shrink time (s)', 0.5, 0, 10, 0.01), en('outFunction', 'Shrink easing', EASING, '')] };
A.ColorGradient = { group: 'Appearance', label: 'Colour gradient', desc: 'Tints (and sets the alpha of) particles over their life. Overrides Alpha curve.',
  params: [{ k: 'gradient', t: 'gradient', l: 'Gradient', d: { colors: [0x00FF00, 0xFF0000], ratios: [0, 255], alphas: [1, 1] } }, { k: 'numSteps', t: 'hidden', d: 500 }] };
A.Spawn = { group: 'Spawning', label: 'Spawn', desc: 'Spawns particles of another emitter when the trigger fires.',
  params: [{ k: 'spawnerEmitter', t: 'emitterRef', l: 'Spawn emitter', d: '' }, { k: 'trigger', t: 'trigger', l: 'Trigger', d: 'DeathTrigger' },
    b('inheritDirection', 'Inherit rotation', true), b('inheritVelocity', 'Inherit velocity', false)] };
