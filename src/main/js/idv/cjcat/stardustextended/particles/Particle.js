// Particle
function Particle() { this.dict = {}; this.init(); }
Particle.prototype.init = function () {
  this.initLife = this.life = 0; this.currentAnimationFrame = 0;
  this.initScale = this.scale = 1; this.initAlpha = this.alpha = 1;
  this.mass = 1; this.isDead = false;
  this.colorR = this.colorG = this.colorB = 1;
  this.x = this.y = this.vx = this.vy = 0; this.rotation = 0; this.omega = 0;
  this.dict.wp = 0;
};
