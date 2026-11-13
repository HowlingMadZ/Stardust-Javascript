// ProjectValueObject (named "Sim" here): a parsed .sde
function Sim() {
  this.emitterSpecs = []; // {id, spec, named}
  this.atlas = null;      // {image, textures:{name:{x,y,w,h}}}
  this.descriptor = {};
  this.warnings = [];
  this.name = '';
}
