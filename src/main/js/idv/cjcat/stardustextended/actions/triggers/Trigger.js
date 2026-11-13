// Trigger base: registry + Builder.trigger
var TriggerFactories = {};       // name -> function (s, B) returning function (particle, dt) -> boolean
Builder.prototype.trigger = function (v) {
  var s = this.resolve(v);
  if (!s) return TriggerFactories.DeathTrigger(s, this);
  var make = TriggerFactories[s.$type];
  if (!make) { this.warn('Trigger "' + s.$type + '" not supported, using death trigger'); return TriggerFactories.DeathTrigger(s, this); }
  return make(s, this);
};
