// Die action
ActionFactories.Die = function (s, B, base, tmp) { return base(s, { update: function (p) { p.isDead = true; } }); };
