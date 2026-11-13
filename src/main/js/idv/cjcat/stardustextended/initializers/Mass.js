// Mass initializer
InitializerFactories.Mass = scalarInitializer(new UniformRandom(1, 0), function (p, v) { p.mass = v; });
