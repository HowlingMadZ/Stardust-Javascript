// Built-in example effects
// ------------------------------------------------------------------ examples
function example(name) {
  if (name.indexOf('sde:') === 0) {
    var it = (window.__EXAMPLES__ || [])[+name.slice(4)]; if (!it) return;
    var bin = atob(it.b64), u8 = new Uint8Array(bin.length); for (var q = 0; q < bin.length; q++) u8[q] = bin.charCodeAt(q);
    return loadBuffer(u8.buffer, it.name);
  }
  pushUndo(true); openList = []; selCard = null;
  var mk = function (id) { return E.createEmitter(String(id)); };
  var tex = function (n) { return { name: n, canvas: E.builtinTextures[n]() }; };
  var em, em2, sp, A = function (t, o) { return Object.assign(E.create('action', t), o || {}); };
  function setInit(spec, type, patch) { var i = spec.initializers.filter(function (x) { return x.$type === type; })[0]; Object.assign(i, patch); return i; }
  function gradient(c, r, a) { return { $type: 'ColorGradient', active: true, gradient: { colors: c, ratios: r, alphas: a }, numSteps: 500 }; }
  function swap(spec, type, repl) { spec.actions = spec.actions.filter(function (a) { return a.$type !== type; }); if (repl) spec.actions.push(repl); }
  if (name === 'fountain') {
    sp = mk(1); sp.clock.ticksPerCall = 120;
    setInit(sp, 'Velocity', { zones: [Object.assign(E.create('zone', 'Sector'), { minRadius: 250, maxRadius: 420, minAngle: 245, maxAngle: 295 })] });
    setInit(sp, 'Life', { random: { center: 2.2, radius: 0.3 } }); setInit(sp, 'Scale', { random: { center: 0.4, radius: 0.1 } });
    sp.actions.push(A('Gravity', { fields: [Object.assign(E.create('field', 'UniformField'), { y: 8 })] }));
    swap(sp, 'AlphaCurve', A('AlphaCurve', { inLifespan: 0.1, outLifespan: 0.6 }));
    sp.particleHandler.blendMode = 'add';
    sp.actions.push(gradient([0xaee6ff, 0x2a7bff], [0, 255], [1, 1]));
    swap(sp, 'AlphaCurve', null);
    var dz = A('DeathZone', { zones: [Object.assign(E.create('zone', 'RectZone'), { x: -600, y: 200, width: 1200, height: 400 })] }); sp.actions.push(dz);
    project.emitters = [{ id: '1', spec: sp, frames: [tex('Soft dot')] }];
  } else if (name === 'fire') {
    sp = mk(1); sp.clock.ticksPerCall = 70; sp.particleHandler.blendMode = 'add';
    setInit(sp, 'PositionAnimated', { zones: [Object.assign(E.create('zone', 'RectZone'), { x: -40, y: 0, width: 80, height: 6 })] });
    setInit(sp, 'Velocity', { zones: [Object.assign(E.create('zone', 'Sector'), { minRadius: 40, maxRadius: 110, minAngle: 255, maxAngle: 285 })] });
    setInit(sp, 'Life', { random: { center: 1.2, radius: 0.4 } }); setInit(sp, 'Scale', { random: { center: 0.9, radius: 0.3 } });
    swap(sp, 'AlphaCurve', null);
    sp.actions.push(A('ScaleCurve', { inScale: 0.3, inLifespan: 0.2, outScale: 0, outLifespan: 0.9 }));
    sp.actions.push(A('RandomDrift', { randomX: { center: 0, radius: 12 }, randomY: { center: 0, radius: 1 } }));
    sp.actions.push(gradient([0xffffff, 0xffc83d, 0xff4a0f, 0x300800], [0, 60, 150, 255], [1, 1, 0.8, 0]));
    project.emitters = [{ id: '1', spec: sp, frames: [tex('Soft dot')] }];
  } else if (name === 'attract') {
    sp = mk(1); sp.clock.ticksPerCall = 40; sp.particleHandler.blendMode = 'add';
    setInit(sp, 'PositionAnimated', { zones: [Object.assign(E.create('zone', 'CircleContour'), { x: -250, y: 120, radius: 20 })] });
    setInit(sp, 'Velocity', { zones: [Object.assign(E.create('zone', 'CircleZone'), { radius: 60 })] });
    setInit(sp, 'Life', { random: { center: 5, radius: 0.5 } }); setInit(sp, 'Scale', { random: { center: 0.3, radius: 0.05 } });
    var fw = E.create('action', 'FollowWaypoints'); fw.loop = false; fw.massless = true;
    fw.waypoints = [{ x: -100, y: -150, radius: 40, strength: 2.2, attenuationPower: 0, epsilon: 1 }, { x: 120, y: -50, radius: 40, strength: 2.2, attenuationPower: 0, epsilon: 1 }, { x: 260, y: 140, radius: 40, strength: 2.2, attenuationPower: 0, epsilon: 1 }];
    sp.actions.push(fw, A('Damping', { damping: 0.04 }), gradient([0x66ffe0, 0xff66cc], [0, 255], [1, 0.2]));
    swap(sp, 'AlphaCurve', null);
    project.emitters = [{ id: '1', spec: sp, frames: [tex('Spark')] }];
  } else if (name === 'firework') {
    sp = mk(1); sp.clock.ticksPerCall = 0.9;
    sp.particleHandler.blendMode = 'add'; setInit(sp, 'Life', { random: { center: 1, radius: 0.1 } }); setInit(sp, 'Scale', { random: { center: 0.5, radius: 0.1 } });
    setInit(sp, 'PositionAnimated', { zones: [Object.assign(E.create('zone', 'RectZone'), { x: -200, y: 150, width: 400, height: 10 })] });
    setInit(sp, 'Velocity', { zones: [Object.assign(E.create('zone', 'Sector'), { minRadius: 380, maxRadius: 480, minAngle: 255, maxAngle: 285 })] });
    sp.actions.push(A('Gravity', { fields: [Object.assign(E.create('field', 'UniformField'), { y: 4 })] }), gradient([0xffffff, 0xffd060], [0, 255], [1, 1]));
    swap(sp, 'AlphaCurve', null);
    var spn = A('Spawn', { spawnerEmitter: '2', trigger: E.create('trigger', 'DeathTrigger') }); sp.actions.push(spn);
    em2 = mk(2); em2.active = false; em2.clock.ticksPerCall = 3000; // only emits when spawned em2.particleHandler.blendMode = 'add';
    setInit(em2, 'Velocity', { zones: [Object.assign(E.create('zone', 'CircleZone'), { radius: 140 })] });
    setInit(em2, 'Life', { random: { center: 1.4, radius: 0.3 } }); setInit(em2, 'Scale', { random: { center: 0.35, radius: 0.1 } });
    em2.actions.push(A('Damping', { damping: 0.03 }), A('Gravity', { fields: [Object.assign(E.create('field', 'UniformField'), { y: 1.5 })] }), gradient([0xff5599, 0x5599ff], [0, 255], [1, 0]));
    swap(em2, 'AlphaCurve', null);
    spn.spawnerEmitter = '2'; spn.inheritVelocity = false; spn.inheritDirection = false;
    project.emitters = [{ id: '1', spec: sp, frames: [tex('Spark')] }, { id: '2', spec: em2, frames: [tex('Soft dot')] }];
  } else {
    project.emitters = []; newEmitter(); project.name = 'untitled'; project.background = null; fakeSim.backgroundImage = null; fakeSim.hasBackground = false; return;
  }
  project.name = name; project.background = null; fakeSim.backgroundImage = null; fakeSim.hasBackground = false;
  sel = 0; player.viewX = W / 2; player.viewY = H / 2; player.viewZoom = 1;
  warnings = []; reinstantiate(); renderAll();
}
