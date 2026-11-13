// Alpha initializer
InitializerFactories.Alpha = scalarInitializer(new UniformRandom(1, 0), function (p, v) { p.initAlpha = p.alpha = v; });
