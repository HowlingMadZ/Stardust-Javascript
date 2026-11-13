// Open / save .sde, images and the test background
// ------------------------------------------------------------------ file IO
function download(name, bytes, mime) {
  var blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
  var a = document.createElement('a'); a.download = name; a.href = URL.createObjectURL(blob); document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function msg(text, isErr) { var m = $('msg'); m.textContent = text; m.className = isErr ? 'err' : 'ok'; m.style.display = 'block'; clearTimeout(msg.t); msg.t = setTimeout(function () { m.style.display = 'none'; }, isErr ? 7000 : 2500); }
function saveSde() {
  var o = { emitters: project.emitters.map(function (pe) { return { id: pe.id, spec: pe.spec, frames: pe.frames }; }), background: project.background, includeBackground: project.includeBackground };
  if (!o.emitters.length) return msg('Nothing to save: add an emitter first', true);
  E.buildSde(o).then(function (bytes) {
    var name = (project.name || 'effect').replace(/[^\w\-. ]+/g, '_');
    download(name + '.sde', bytes); msg('Saved ' + name + '.sde (' + Math.round(bytes.length / 1024) + ' KB)');
  }, function (e) { msg(e.message, true); });
}
function loadBuffer(buf, name) {
  return E.loadSde(buf).then(function (r) {
    pushUndo(true);
    project.emitters = r.emitters; project.name = (name || 'effect').replace(/^[0-9a-f]{8}-/, '').replace(/\.sde$/i, '');
    project.background = r.background; project.includeBackground = false; sel = 0; selCard = null; openList = [];
    fakeSim.backgroundImage = r.background ? r.background.img : null; fakeSim.hasBackground = !!r.background;
    if (r.stageMode) { /* background top-left sits at the stage origin */ fitStage(r.stageW, r.stageH); }
    else { player.viewX = W / 2; player.viewY = H / 2; player.viewZoom = 1; $('zoomv').textContent = '100%'; }
    warnings = r.warnings.slice(); reinstantiate(); renderAll();
    msg('Loaded ' + project.emitters.length + ' emitter(s)');
  }).catch(function (e) { msg('Could not open file: ' + (e && e.message || e), true); });
}
function fitStage(sw, sh) { var k = Math.min(W / sw, H / sh) * 0.95; player.viewZoom = k; player.viewX = (W - sw * k) / 2; player.viewY = (H - sh * k) / 2; $('zoomv').textContent = Math.round(k * 100) + '%'; }
function readFile(f, cb) { var r = new FileReader(); r.onload = function () { cb(r.result); }; r.readAsArrayBuffer(f); }
function openFiles(files) {
  Array.prototype.forEach.call(files, function (f) {
    if (/\.sde$|\.zip$/i.test(f.name)) readFile(f, function (b) { loadBuffer(b, f.name); });
    else if (/^image\//.test(f.type)) readFile(f, function (b) {
      var bytes = new Uint8Array(b);
      if (/background/i.test(f.name) && !cur()) return;
      E.imageToCanvas(bytes, f.type).then(function (c) {
        var pe = cur(); if (!pe) return msg('Add an emitter first', true);
        pushUndo(true); pe.frames = pe.frames.concat([{ name: f.name, canvas: c }]); syncFrames(); renderInspector(); renderList();
      }, function () { msg('Could not decode ' + f.name, true); });
    });
  });
}
// the background image doubles as the test sprite for ImageMask zones (mask name 'mask' and 'background'),
// placed with its top-left corner at the world origin, exactly where it is drawn
function registerMask(img) {
  try { S.Masks.set('mask', img, { x: 0, y: 0, anchor: 'topleft' }); S.Masks.set('background', img, { x: 0, y: 0, anchor: 'topleft' }); reinstantiate(); }
  catch (e) { msg('Could not read the image pixels (' + e.message + '). Use a file chosen with the button, not a cross-origin image.', true); }
}
function setBackground(f) {
  readFile(f, function (b) {
    var bytes = new Uint8Array(b);
    S.io.loadImage(bytes, f.type || 'image/png').then(function (img) {
      project.background = { bytes: bytes, img: img }; registerMask(img); fitStage(img.width, img.height); fakeSim.backgroundImage = img; fakeSim.hasBackground = true; showBg = true; player.showBackground = true; renderAll();
      msg('Test background set (only for previewing; it is not exported unless you tick the box)');
    }, function () { msg('Could not decode that image', true); });
  });
}
