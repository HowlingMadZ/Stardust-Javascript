// DeathLife action
ActionFactories.DeathLife = function (s, B, base, tmp) {
  return base(s, { update: function (p) { if (p.life <= 0) p.isDead = true; } });
};
