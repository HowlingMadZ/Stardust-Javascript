// Parameter schema: clocks
// ---------- clocks ----------
D.clock.SteadyClock = { label: 'Steady (particles per second)', params: [n('ticksPerCall', 'Particles / second', 20, 0, 500, 0.5), rnd('initialDelay', 'Initial delay (s)', 0, 0, 0, 10, 0.01)] };
D.clock.ImpulseClock = { label: 'Impulse (bursts)', params: [n('ticksPerCall', 'Particles / second in burst', 60, 0, 1000, 1),
  rnd('impulseLength', 'Burst length (s)', 0.4, 0, 0, 10, 0.01), rnd('impulseInterval', 'Time between bursts (s)', 2, 0, 0, 30, 0.01), rnd('initialDelay', 'Initial delay (s)', 0, 0, 0, 10, 0.01)] };
