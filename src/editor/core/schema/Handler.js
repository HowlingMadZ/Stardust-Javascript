// Parameter schema: particle handler (renderer) + type lists
// ---------- handler (renderer) ----------
E.handlerParams = [en('blendMode', 'Blend mode', BLEND, 'normal'), b('smoothing', 'Smoothing', true), b('premultiplyAlpha', 'Premultiplied alpha', true),
  n('spriteSheetAnimationSpeed', 'Animation speed (fps)', 1, 0, 60, 1), b('spriteSheetStartAtRandomFrame', 'Start at random frame', false)];

E.categories = { initializer: 'initializers', action: 'actions' };
E.ZONE_TYPES = ZTYPES; E.FIELD_TYPES = ['UniformField', 'RadialField']; E.DEFLECTOR_TYPES = ['LineDeflector', 'CircleDeflector', 'WrappingBox'];
E.TRIGGER_TYPES = ['DeathTrigger', 'LifeTrigger', 'ZoneTrigger']; E.CLOCK_TYPES = ['SteadyClock', 'ImpulseClock']; E.EASING = EASING; E.BLEND = BLEND;
