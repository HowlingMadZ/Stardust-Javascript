#!/usr/bin/env node
/* Dependency-free tests for the pure engine parts (no DOM needed). Run: npm test  (builds first) */
'use strict';
const assert = require('assert'), zlib = require('zlib'), path = require('path'), { execFileSync } = require('child_process');
execFileSync(process.execPath, [path.join(__dirname, '../build/build.js')], { stdio: 'ignore' });
const S = require('../dist/stardust.js');

let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; } }
function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function withSeed(seed, fn) { const o = Math.random; Math.random = seeded(seed); try { return fn(); } finally { Math.random = o; } }
const rnd = (c, r) => ({ center: c, radius: r });

// ---- zip ------------------------------------------------------------------------------------
function zipOf(files, deflate) {
  const parts = [], central = []; let off = 0;
  for (const [name, data] of files) {
    const n = Buffer.from(name), raw = Buffer.from(data), comp = deflate ? zlib.deflateRawSync(raw) : raw, crc = zlib.crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(deflate ? 8 : 0, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(n.length, 26);
    parts.push(lh, n, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(deflate ? 8 : 0, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(n.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, n); off += 30 + n.length + comp.length;
  }
  const cs = central.reduce((a, b) => a + b.length, 0), eo = Buffer.alloc(22);
  eo.writeUInt32LE(0x06054b50, 0); eo.writeUInt16LE(files.length, 8); eo.writeUInt16LE(files.length, 10); eo.writeUInt32LE(cs, 12); eo.writeUInt32LE(off, 16);
  const all = Buffer.concat([...parts, ...central, eo]);
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.length);
}
const text = 'stardust '.repeat(500), noise = Array.from({ length: 3000 }, (_, i) => String.fromCharCode(33 + ((i * 7919) % 90))).join('');
for (const deflate of [false, true]) {
  test('unzip (' + (deflate ? 'deflate' : 'store') + ')', () => {
    const out = S.unzip(zipOf([['a.txt', text], ['b.bin', noise]], deflate));
    assert.strictEqual(S.io.utf8(out['a.txt']), text); assert.strictEqual(S.io.utf8(out['b.bin']), noise);
  });
}

// ---- easing ---------------------------------------------------------------------------------
test('easing endpoints', () => {
  for (const name of Object.keys(S.Easing)) {
    assert.ok(Math.abs(S.Easing[name](0, 0, 1, 1)) < 1e-9, name + ' at 0');
    assert.ok(Math.abs(S.Easing[name](1, 0, 1, 1) - 1) < 1e-9, name + ' at 1');
  }
});

// ---- emitters -------------------------------------------------------------------------------
function emitter(spec, id) { const B = new S.Builder({}, []); const em = new S.Emitter(id || '1', spec, B); em.frames = [{ x: 0, y: 0, w: 8, h: 8 }]; return em; }
const base = () => ({
  clock: { $type: 'SteadyClock', ticksPerCall: 60, initialDelay: rnd(0, 0) }, particleHandler: {}, fps: 60,
  initializers: [{ $type: 'Life', random: rnd(1, 0) }, { $type: 'PositionAnimated', zones: [{ $type: 'RectZone', x: 10, y: 20, width: 40, height: 30 }] }],
  actions: [{ $type: 'Age' }, { $type: 'DeathLife' }, { $type: 'Move' }]
});
test('steady clock emits ~ticksPerCall per second, life ends them', () => withSeed(1, () => {
  const em = emitter(base()); for (let i = 0; i < 60; i++) em.step(1 / 60);
  assert.ok(em.particles.length > 40 && em.particles.length < 80, 'count ' + em.particles.length);
  em.active = false; for (let i = 0; i < 90; i++) em.step(1 / 60); assert.strictEqual(em.particles.length, 0);
}));
test('rect zone spawns inside the rectangle', () => withSeed(2, () => {
  const em = emitter(base()); em.step(0.5);
  assert.ok(em.particles.length > 0);
  for (const p of em.particles) assert.ok(p.x >= 10 && p.x <= 50 && p.y >= 20 && p.y <= 50, p.x + ',' + p.y);
}));
test('velocity zone + move', () => withSeed(3, () => {
  const sp = base(); sp.initializers.push({ $type: 'Velocity', zones: [{ $type: 'SinglePoint', x: 100, y: 0 }] });
  const em = emitter(sp); const ps = em.createParticles(1); const x0 = ps[0].x; em.step(0.1); assert.ok(Math.abs(ps[0].x - (x0 + 10)) < 1, 'x moved ' + (ps[0].x - x0));
}));
test('physics do not depend on the frame rate (damping)', () => {
  const run = (dt) => withSeed(5, () => {
    const sp = base(); sp.clock.ticksPerCall = 0; sp.initializers.push({ $type: 'Velocity', zones: [{ $type: 'SinglePoint', x: 100, y: 0 }] });
    sp.initializers[0].random = rnd(5, 0); sp.actions.push({ $type: 'Damping', damping: 0.12 });
    const em = emitter(sp); const p = em.createParticles(1)[0]; const x0 = p.x;
    const player = new S.Player({ getContext: () => null, width: 10, height: 10 }, {}); player.emitters = [em];
    for (let t = 0; t < 1; t += dt) player.step(dt); return p.x - x0;
  });
  const a = run(1 / 60), b = run(1 / 30), c = run(0.1);
  assert.ok(Math.abs(a - b) / a < 0.02, '60 vs 30 fps: ' + a + ' ' + b);
  assert.ok(Math.abs(a - c) / a < 0.1, '60 fps vs 100ms frames: ' + a + ' ' + c);
});
test('Spawn action creates particles in another emitter at the death position', () => withSeed(7, () => {
  const a = base(); a.clock.ticksPerCall = 0; a.initializers[0].random = rnd(0.2, 0);
  a.actions.push({ $type: 'Spawn', spawnerEmitter: '2', trigger: { $type: 'DeathTrigger' }, inheritDirection: false });
  const b = base(); b.clock = { $type: 'SteadyClock', ticksPerCall: 3000, initialDelay: rnd(0, 0) }; b.initializers[1].zones = [{ $type: 'SinglePoint', x: 0, y: 0 }];
  const A = emitter(a, '1'), Bm = emitter(b, '2'); Bm.active = false; const map = { 1: A, 2: Bm }; A.link(map); Bm.link(map);
  A.createParticles(1); const px = A.particles[0].x; for (let i = 0; i < 20; i++) A.step(1 / 60);
  assert.ok(Bm.particles.length > 5, 'spawned ' + Bm.particles.length); assert.ok(Math.abs(Bm.particles[0].x - px) < 1.5);
}));
test('colour gradient sets colour and alpha', () => withSeed(9, () => {
  const sp = base(); sp.actions.push({ $type: 'ColorGradient', gradient: { colors: [0xff0000, 0x0000ff], ratios: [0, 255], alphas: [1, 0.5] }, numSteps: 100 });
  const em = emitter(sp); const p = em.createParticles(1)[0]; em.step(1 / 60);
  assert.ok(p.colorR > 0.9 && p.colorB < 0.1 && p.alpha > 0.95, [p.colorR, p.colorB, p.alpha].join());
}));

// ---- image mask -----------------------------------------------------------------------------
test('ImageMask spawns only on non-transparent pixels, honours placement and scale', () => withSeed(11, () => {
  const w = 20, h = 10, data = new Uint8ClampedArray(w * h * 4);
  for (let y = 2; y < 6; y++) for (let x = 5; x < 15; x++) data[(y * w + x) * 4 + 3] = 40;     // faint pixels still count
  S.Masks.set('shirt', { data, width: w, height: h }, { x: 100, y: 50, scale: 2 });
  const sp = base(); sp.clock.ticksPerCall = 0; sp.initializers[1].zones = [{ $type: 'ImageMask', maskName: 'shirt' }];
  const em = emitter(sp); const ps = em.createParticles(500);
  for (const p of ps) assert.ok(p.x >= 100 + 5 * 2 && p.x <= 100 + 15 * 2 && p.y >= 50 + 2 * 2 && p.y <= 50 + 6 * 2, p.x + ',' + p.y);
  S.Masks.place('shirt', { x: 0, y: 0, scale: 1 });
  for (const p of em.createParticles(200)) assert.ok(p.x >= 5 && p.x <= 15 && p.y >= 2 && p.y <= 6);
}));
test('ImageMask: min alpha threshold and colour sampling', () => withSeed(12, () => {
  const w = 4, h = 1, data = new Uint8ClampedArray(w * h * 4);
  data.set([255, 0, 0, 255, 0, 255, 0, 10, 0, 0, 255, 255, 0, 0, 0, 0]);
  S.Masks.set('c', { data, width: w, height: h });
  const sp = base(); sp.clock.ticksPerCall = 0; sp.initializers[1].zones = [{ $type: 'ImageMask', maskName: 'c', alphaThreshold: 0.1, sampleColor: true }];
  const ps = emitter(sp).createParticles(300);
  for (const p of ps) { assert.ok((p.x >= 0 && p.x < 1) || (p.x >= 2 && p.x < 3), 'x ' + p.x); assert.ok(p.x < 1 ? p.colorR === 1 : p.colorB === 1); }
}));

console.log(passed + ' tests passed' + (process.exitCode ? ', with failures' : ''));
