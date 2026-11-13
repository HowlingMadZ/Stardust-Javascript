// Parameter schema: initializers
// ---------- initializers ----------
D.initializer.PositionAnimated = { group: 'Position & velocity', label: 'Position', desc: 'Where particles are born (random point in the zones).',
  params: [zs('zones', 'Spawn zones', ['SinglePoint']), b('inheritVelocity', 'Inherit velocity', false)] };
D.initializer.Velocity = { group: 'Position & velocity', label: 'Velocity', desc: 'Initial velocity: a random point in the zones, in px/s.',
  params: [zs('zones', 'Velocity zones', ['CircleZone'])] };
D.initializer.Life = { group: 'Properties', label: 'Life', desc: 'Lifespan in seconds.', params: [rnd('random', 'Life (s)', 1, 0.2, 0, 10, 0.01)] };
D.initializer.Scale = { group: 'Properties', label: 'Scale', desc: 'Initial scale.', params: [rnd('random', 'Scale', 1, 0, 0, 5, 0.01)] };
D.initializer.Alpha = { group: 'Properties', label: 'Alpha', desc: 'Initial alpha (0-1).', params: [rnd('random', 'Alpha', 1, 0, 0, 1, 0.01)] };
D.initializer.Rotation = { group: 'Properties', label: 'Rotation', desc: 'Initial rotation in degrees.', params: [rnd('random', 'Rotation (deg)', 0, 0, -360, 360, 1)] };
D.initializer.Omega = { group: 'Properties', label: 'Omega', desc: 'Angular velocity in deg/s (used by Spin).', params: [rnd('random', 'Omega (deg/s)', 0, 0, -720, 720, 1)] };
D.initializer.Mass = { group: 'Properties', label: 'Mass', desc: 'Particle mass (for non-massless forces).', params: [rnd('random', 'Mass', 1, 0, 0.01, 10, 0.01)] };
