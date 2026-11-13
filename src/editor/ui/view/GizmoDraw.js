// Drawing the gizmo overlay
function path(ctx, sh) {
  var z = sh.z;
  ctx.beginPath();
  function rotAt(x, y, deg, fn) { var s = w2s(x, y); ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(deg * Math.PI / 180); fn(player.viewZoom); ctx.restore(); }
  switch (sh.type) {
    case 'ImageMask': {
      var m = S.Masks.get(z.maskName), k = player.viewZoom;
      if (!m) { var o0 = w2s(z.x, z.y); ctx.moveTo(o0[0] - 8, o0[1] - 8); ctx.lineTo(o0[0] + 8, o0[1] + 8); ctx.moveTo(o0[0] + 8, o0[1] - 8); ctx.lineTo(o0[0] - 8, o0[1] + 8); break; }
      var an = z.anchor === 'inherit' ? m.anchor : z.anchor, sc = z.scale * m.scale, ax = an === 'center' ? m.w / 2 : 0, ay = an === 'center' ? m.h / 2 : 0;
      var tl = w2s(m.x + z.x - ax * sc, m.y + z.y - ay * sc); ctx.rect(tl[0], tl[1], m.w * sc * k, m.h * sc * k); break;
    }
    case 'SinglePoint': var p = w2s(z.x, z.y); ctx.moveTo(p[0] - 6, p[1]); ctx.lineTo(p[0] + 6, p[1]); ctx.moveTo(p[0], p[1] - 6); ctx.lineTo(p[0], p[1] + 6); break;
    case 'CircleZone': case 'CircleContour': var c = w2s(z.x, z.y); ctx.arc(c[0], c[1], Math.max(0, z.radius * player.viewZoom), 0, 7); break;
    case 'RectZone': case 'RectContour': rotAt(z.x, z.y, z.rotation || 0, function (k) { ctx.rect(0, 0, z.width * k, z.height * k); }); break;
    case 'Line': var a = w2s(z.x1, z.y1), b = w2s(z.x2, z.y2); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); break;
    case 'Sector': var o = w2s(z.x, z.y), k = player.viewZoom, r0 = z.minAngle * Math.PI / 180, r1 = z.maxAngle * Math.PI / 180;
      if (Math.abs(r1 - r0) >= Math.PI * 2 - 1e-3) { ctx.arc(o[0], o[1], z.maxRadius * k, 0, 7); ctx.moveTo(o[0] + z.minRadius * k, o[1]); ctx.arc(o[0], o[1], z.minRadius * k, 0, 7); }
      else { ctx.arc(o[0], o[1], z.maxRadius * k, r0, r1); ctx.arc(o[0], o[1], z.minRadius * k, r1, r0, true); ctx.closePath(); } break;
  }
}
function drawGizmos() {
  var ctx = gctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  // origin cross + grid
  var o = w2s(0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(0, o[1] + .5); ctx.lineTo(W, o[1] + .5); ctx.moveTo(o[0] + .5, 0); ctx.lineTo(o[0] + .5, H); ctx.stroke();
  var info = collect();
  if (!$('gizmos').checked) return;
  info.shapes.forEach(function (sh) {
    ctx.save(); ctx.strokeStyle = sh.color; ctx.fillStyle = sh.color; ctx.lineWidth = sh.sel ? 2 : 1; ctx.globalAlpha = sh.sel ? 1 : 0.55;
    if (sh.type === 'Radial') { var c = w2s(sh.f.x, sh.f.y); ctx.beginPath(); ctx.arc(c[0], c[1], 14 + Math.min(Math.abs(sh.f.strength) * 3, 40), 0, 7); ctx.setLineDash([4, 4]); ctx.stroke(); }
    else if (sh.type === 'Explode') { var e = w2s(sh.a.x, sh.a.y); ctx.beginPath(); ctx.arc(e[0], e[1], sh.a.maxDistance * player.viewZoom, 0, 7); ctx.setLineDash([2, 6]); ctx.stroke(); ctx.beginPath(); ctx.arc(e[0], e[1], 5, 0, 7); ctx.fill(); }
    else if (sh.type === 'Waypoints') {
      var pts = sh.a.waypoints; ctx.beginPath();
      pts.forEach(function (w, i) { var s = w2s(w.x, w.y); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
      if (sh.a.loop && pts.length > 2) ctx.closePath(); ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
      pts.forEach(function (w, i) { var s = w2s(w.x, w.y); ctx.beginPath(); ctx.arc(s[0], s[1], Math.max(3, w.radius * player.viewZoom), 0, 7); ctx.globalAlpha = .35; ctx.stroke(); ctx.globalAlpha = 1; ctx.font = '11px sans-serif'; ctx.fillText(String(i + 1), s[0] + 8, s[1] - 8); });
    } else if (sh.type === 'Deflector') {
      var d = sh.d; ctx.beginPath();
      if (d.$type === 'LineDeflector') { var a = w2s(d.x, d.y), tx = -d.normalY, ty = d.normalX; ctx.moveTo(a[0] - tx * 4000, a[1] - ty * 4000); ctx.lineTo(a[0] + tx * 4000, a[1] + ty * 4000); ctx.stroke(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + d.normalX * 50, a[1] + d.normalY * 50); ctx.stroke(); }
      else if (d.$type === 'CircleDeflector') { var c2 = w2s(d.x, d.y); ctx.arc(c2[0], c2[1], d.radius * player.viewZoom, 0, 7); ctx.stroke(); }
      else { var b2 = w2s(d.x, d.y); ctx.rect(b2[0], b2[1], d.width * player.viewZoom, d.height * player.viewZoom); ctx.setLineDash([8, 4]); ctx.stroke(); }
    } else {
      path(ctx, sh); if (sh.type !== 'RectContour' && sh.type !== 'CircleContour' && sh.type !== 'Line' && sh.type !== 'SinglePoint' && sh.type !== 'ImageMask') { ctx.globalAlpha = sh.sel ? .14 : .07; ctx.fill('evenodd'); ctx.globalAlpha = sh.sel ? 1 : .55; }
      ctx.stroke();
    }
    ctx.restore();
  });
  handles.forEach(function (h) {
    var s = w2s(h.x, h.y); ctx.beginPath(); ctx.rect(s[0] - 4.5, s[1] - 4.5, 9, 9); ctx.fillStyle = '#14161b'; ctx.fill(); ctx.strokeStyle = h.color; ctx.lineWidth = h.sel ? 2 : 1.2; ctx.stroke();
  });
}
