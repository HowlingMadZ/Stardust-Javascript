// Collecting draggable handles and shapes of the selected emitter
// collect handles for current selection. Each: {x,y,kind,drag(wx,wy), color}
var handles = [];
var showAll = true;
function collect() {
  handles = []; var shapes = [];
  var pe = cur(); if (!pe) return { shapes: shapes };
  function add(el_, isSel) { if (!showAll && !isSel) return; el_.sel = isSel; shapes.push(el_); }
  function zoneShapes(z, color, isSel) {
    var r = (z.rotation || 0) * Math.PI / 180, rot = function (dx, dy) { return [z.x + dx * Math.cos(r) - dy * Math.sin(r), z.y + dx * Math.sin(r) + dy * Math.cos(r)]; };
    var sh = { type: z.$type, z: z, color: color };
    add(sh, isSel);
    if (!showAll && !isSel) return;
    function H_(x, y, drag) { handles.push({ x: x, y: y, drag: drag, color: color, sel: isSel }); }
    switch (z.$type) {
      case 'ImageMask': H_(z.x, z.y, function (wx, wy) { z.x = wx; z.y = wy; }); break;
      case 'SinglePoint': H_(z.x, z.y, function (wx, wy) { z.x = wx; z.y = wy; }); break;
      case 'CircleZone': case 'CircleContour':
        H_(z.x, z.y, function (wx, wy) { z.x = wx; z.y = wy; });
        H_(z.x + z.radius, z.y, function (wx, wy) { z.radius = Math.max(0, Math.hypot(wx - z.x, wy - z.y)); }); break;
      case 'RectZone': case 'RectContour': {
        H_(z.x, z.y, function (wx, wy) { z.x = wx; z.y = wy; });
        var c = rot(z.width, z.height);
        H_(c[0], c[1], function (wx, wy) { var dx = wx - z.x, dy = wy - z.y; z.width = dx * Math.cos(r) + dy * Math.sin(r); z.height = -dx * Math.sin(r) + dy * Math.cos(r); if (z.$type === 'RectContour') { z.width = Math.abs(z.width); z.height = Math.abs(z.height); } });
        break;
      }
      case 'Line':
        H_(z.x1, z.y1, function (wx, wy) { z.x1 = wx; z.y1 = wy; }); H_(z.x2, z.y2, function (wx, wy) { z.x2 = wx; z.y2 = wy; }); break;
      case 'Sector':
        H_(z.x, z.y, function (wx, wy) { z.x = wx; z.y = wy; });
        H_(z.x + z.maxRadius, z.y, function (wx, wy) { z.maxRadius = Math.max(z.minRadius, Math.hypot(wx - z.x, wy - z.y)); });
        if (z.minRadius > 0) H_(z.x + z.minRadius, z.y, function (wx, wy) { z.minRadius = Math.min(z.maxRadius, Math.hypot(wx - z.x, wy - z.y)); });
        break;
    }
  }
  function pointHandle(o, color, isSel, kx, ky) { if (!showAll && !isSel) return; handles.push({ x: o[kx || 'x'], y: o[ky || 'y'], color: color, sel: isSel, drag: function (wx, wy) { o[kx || 'x'] = wx; o[ky || 'y'] = wy; } }); }
  function fieldShape(f, isSel) {
    if (f.$type !== 'RadialField') return;
    add({ type: 'Radial', f: f, color: f.strength >= 0 ? '#5bd1ff' : '#ff7a7a' }, isSel); pointHandle(f, f.strength >= 0 ? '#5bd1ff' : '#ff7a7a', isSel);
  }
  pe.spec.initializers.forEach(function (i) {
    if (i.active === false) return;
    if (i.$type === 'PositionAnimated') i.zones.forEach(function (z) { zoneShapes(z, '#ffb547', selCard === i || selCard === z); });
  });
  pe.spec.actions.forEach(function (a) {
    var isSel = selCard === a;
    if (a.zones && (a.$type === 'DeathZone' || a.$type === 'AccelerationZone')) a.zones.forEach(function (z) { zoneShapes(z, a.$type === 'DeathZone' ? '#ff5d5d' : '#8be28b', isSel || selCard === z); });
    if (a.$type === 'Spawn' && a.trigger && a.trigger.$type === 'ZoneTrigger') a.trigger.zones.forEach(function (z) { zoneShapes(z, '#c79bff', isSel || selCard === z || selCard === a.trigger); });
    if (a.$type === 'Gravity') a.fields.forEach(function (f) { fieldShape(f, isSel || selCard === f); });
    if (a.$type === 'VelocityField' || a.$type === 'Impulse') fieldShape(a.field, isSel || selCard === a.field);
    if (a.$type === 'Explode') { add({ type: 'Explode', a: a, color: '#ffd24d' }, isSel); pointHandle(a, '#ffd24d', isSel); }
    if (a.$type === 'FollowWaypoints') {
      add({ type: 'Waypoints', a: a, color: '#6be3c0' }, isSel);
      a.waypoints.forEach(function (w) {
        var ws = isSel || selCard === w; if (!showAll && !ws) return;
        handles.push({ x: w.x, y: w.y, color: '#6be3c0', sel: ws, drag: function (wx, wy) { w.x = wx; w.y = wy; }, onselect: w });
      });
    }
    if (a.$type === 'Deflect') a.deflectors.forEach(function (d) {
      var ds = isSel || selCard === d; add({ type: 'Deflector', d: d, color: '#ff9f43' }, ds);
      if (!showAll && !ds) return;
      pointHandle(d, '#ff9f43', ds);
      if (d.$type === 'LineDeflector') handles.push({ x: d.x + d.normalX * 50, y: d.y + d.normalY * 50, color: '#ff9f43', sel: ds, drag: function (wx, wy) { var dx = wx - d.x, dy = wy - d.y, l = Math.hypot(dx, dy) || 1; d.normalX = dx / l; d.normalY = dy / l; } });
      if (d.$type === 'CircleDeflector') handles.push({ x: d.x + d.radius, y: d.y, color: '#ff9f43', sel: ds, drag: function (wx, wy) { d.radius = Math.max(1, Math.hypot(wx - d.x, wy - d.y)); } });
      if (d.$type === 'WrappingBox') handles.push({ x: d.x + d.width, y: d.y + d.height, color: '#ff9f43', sel: ds, drag: function (wx, wy) { d.width = Math.max(1, wx - d.x); d.height = Math.max(1, wy - d.y); } });
    });
  });
  return { shapes: shapes };
}
