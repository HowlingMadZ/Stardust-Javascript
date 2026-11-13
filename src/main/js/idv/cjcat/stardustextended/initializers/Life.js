// Life initializer
InitializerFactories.Life = scalarInitializer(new UniformRandom(0, 0), function (p, v) { p.initLife = p.life = v; });
