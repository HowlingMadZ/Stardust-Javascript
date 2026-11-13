// Robert Penner easing, fn(t, b, c, d): time, begin, change, duration. Same names as EasingFunctionType.as
var HP = Math.PI / 2;
var Easing = {};
function linearEase(t, b, c, d) { return c * t / d + b; }
function addEasing(name, a) { Easing[name + '.easeIn'] = a[0]; Easing[name + '.easeOut'] = a[1]; Easing[name + '.easeInOut'] = a[2]; }
Easing['Linear.easeNone'] = Easing['Linear.easeIn'] = Easing['Linear.easeOut'] = Easing['Linear.easeInOut'] = linearEase;
