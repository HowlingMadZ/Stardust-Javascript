// Built-in generated textures
// built-in textures (generated, so a new emitter shows something at once)
E.builtinTextures = {
  'Soft dot': function () { var c = cv(64); var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; },
  'Hard dot': function () { var c = cv(32); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(16, 16, 14, 0, 7); x.fill(); return c; },
  'Ring': function () { var c = cv(64); var x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(32, 32, 26, 0, 7); x.stroke(); return c; },
  'Star': function () { var c = cv(64); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 12 : 29; x.lineTo(32 + Math.cos(a) * r, 33 + Math.sin(a) * r); } x.closePath(); x.fill(); return c; },
  'Spark': function () { var c = cv(64); var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 8); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(32, 2); x.lineTo(35, 29); x.lineTo(62, 32); x.lineTo(35, 35); x.lineTo(32, 62); x.lineTo(29, 35); x.lineTo(2, 32); x.lineTo(29, 29); x.closePath(); x.fill(); return c; },
  'Square': function () { var c = cv(32); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(3, 3, 26, 26); return c; },
  'Smoke puff': function () {
    var c = cv(96), x = c.getContext('2d'), seed = 7; function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 26; i++) { var a = r() * 6.28, d = r() * 22, g = x.createRadialGradient(48 + Math.cos(a) * d, 48 + Math.sin(a) * d, 0, 48 + Math.cos(a) * d, 48 + Math.sin(a) * d, 20); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 96, 96); }
    return c;
  }
};
function cv(s) { var c = document.createElement('canvas'); c.width = c.height = s; return c; }
