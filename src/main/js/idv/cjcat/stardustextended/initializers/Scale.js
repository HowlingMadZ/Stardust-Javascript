// Scale initializer
InitializerFactories.Scale = scalarInitializer(new UniformRandom(1, 0), function (p, v) { p.initScale = p.scale = v; });
