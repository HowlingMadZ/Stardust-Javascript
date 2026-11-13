// Rotation initializer
InitializerFactories.Rotation = scalarInitializer(new UniformRandom(0, 0), function (p, v) { p.rotation = v; });
