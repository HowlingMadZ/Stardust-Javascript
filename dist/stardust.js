/*!
 * stardust.js v1.1.0 - a canvas 2D port of the Stardust particle engine
 * https://github.com/HowlingMadZ/Stardust-Javascript
 *
 * Engine maths follow Stardust (c) 2010 Allen Chou (CJ Cat), (c) 2014 Plumbee Ltd., (c) 2015 FunkyPanda Ltd., MIT licence.
 * This port: no dependencies, plain <script> (no modules / fetch) so it also runs from file://.
 * Reads .sde simulation files made by the Stardust editor. See LICENSE.
 */
(function (root) {
  'use strict';

  /* ---- idv/cjcat/stardustextended/Stardust.js ---- */
  // idv.cjcat.stardustextended.Stardust - namespace and shared constants
  var Stardust = {};
  var TWO_PI = Math.PI * 2;
  var DEG2RAD = Math.PI / 180;
  var RAD2DEG = 180 / Math.PI;
  var TIME_STEP_CORRECTION = 0.004; // Emitter.timeStepCorrectionOffset

  /* ---- org/as3commons/zip/Inflate.js ---- */
  // Inflate (RFC 1951): small dependency-free decoder. Replaces the flash.utils.ByteArray.inflate() the AS3 zip library relies on.
  var Inflate = (function () {
    function Tree() { this.table = new Uint16Array(16); this.trans = new Uint16Array(288); }
    function Data(source, dest) {
      this.source = source; this.sourceIndex = 0; this.tag = 0; this.bitcount = 0;
      this.dest = dest; this.destLen = 0;
      this.ltree = new Tree(); this.dtree = new Tree();
    }
    var sltree = new Tree(), sdtree = new Tree();
    var lengthBits = new Uint8Array(30), lengthBase = new Uint16Array(30);
    var distBits = new Uint8Array(30), distBase = new Uint16Array(30);
    var clcidx = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    var codeTree = new Tree();
    var lengths = new Uint8Array(288 + 32);
    var offs = new Uint16Array(16);

    function buildBitsBase(bits, base, delta, first) {
      var i, sum;
      for (i = 0; i < delta; ++i) bits[i] = 0;
      for (i = 0; i < 30 - delta; ++i) bits[i + delta] = (i / delta) | 0;
      for (sum = first, i = 0; i < 30; ++i) { base[i] = sum; sum += 1 << bits[i]; }
    }
    function buildFixedTrees(lt, dt) {
      var i;
      for (i = 0; i < 7; ++i) lt.table[i] = 0;
      lt.table[7] = 24; lt.table[8] = 152; lt.table[9] = 112;
      for (i = 0; i < 24; ++i) lt.trans[i] = 256 + i;
      for (i = 0; i < 144; ++i) lt.trans[24 + i] = i;
      for (i = 0; i < 8; ++i) lt.trans[24 + 144 + i] = 280 + i;
      for (i = 0; i < 112; ++i) lt.trans[24 + 144 + 8 + i] = 144 + i;
      for (i = 0; i < 5; ++i) dt.table[i] = 0;
      dt.table[5] = 32;
      for (i = 0; i < 32; ++i) dt.trans[i] = i;
    }
    function buildTree(t, lens, off, num) {
      var i, sum;
      for (i = 0; i < 16; ++i) t.table[i] = 0;
      for (i = 0; i < num; ++i) t.table[lens[off + i]]++;
      t.table[0] = 0;
      for (sum = 0, i = 0; i < 16; ++i) { offs[i] = sum; sum += t.table[i]; }
      for (i = 0; i < num; ++i) if (lens[off + i]) t.trans[offs[lens[off + i]]++] = i;
    }
    function getBit(d) {
      if (!d.bitcount--) { d.tag = d.source[d.sourceIndex++]; d.bitcount = 7; }
      var bit = d.tag & 1; d.tag >>>= 1; return bit;
    }
    function readBits(d, num, base) {
      if (!num) return base;
      while (d.bitcount < 24) { d.tag |= d.source[d.sourceIndex++] << d.bitcount; d.bitcount += 8; }
      var val = d.tag & (0xffff >>> (16 - num));
      d.tag >>>= num; d.bitcount -= num;
      return val + base;
    }
    function decodeSymbol(d, t) {
      while (d.bitcount < 24) { d.tag |= d.source[d.sourceIndex++] << d.bitcount; d.bitcount += 8; }
      var sum = 0, cur = 0, len = 0, tag = d.tag;
      do {
        cur = 2 * cur + (tag & 1); tag >>>= 1; ++len;
        sum += t.table[len]; cur -= t.table[len];
      } while (cur >= 0);
      d.tag = tag; d.bitcount -= len;
      return t.trans[sum + cur];
    }
    function decodeTrees(d, lt, dt) {
      var hlit = readBits(d, 5, 257), hdist = readBits(d, 5, 1), hclen = readBits(d, 4, 4);
      var i, num, length, sym, prev;
      for (i = 0; i < 19; ++i) lengths[i] = 0;
      for (i = 0; i < hclen; ++i) lengths[clcidx[i]] = readBits(d, 3, 0);
      buildTree(codeTree, lengths, 0, 19);
      for (num = 0; num < hlit + hdist;) {
        sym = decodeSymbol(d, codeTree);
        switch (sym) {
          case 16: prev = lengths[num - 1]; for (length = readBits(d, 2, 3); length; --length) lengths[num++] = prev; break;
          case 17: for (length = readBits(d, 3, 3); length; --length) lengths[num++] = 0; break;
          case 18: for (length = readBits(d, 7, 11); length; --length) lengths[num++] = 0; break;
          default: lengths[num++] = sym;
        }
      }
      buildTree(lt, lengths, 0, hlit);
      buildTree(dt, lengths, hlit, hdist);
    }
    function inflateBlockData(d, lt, dt) {
      for (;;) {
        var sym = decodeSymbol(d, lt);
        if (sym === 256) return;
        if (sym < 256) { d.dest[d.destLen++] = sym; }
        else {
          sym -= 257;
          var length = readBits(d, lengthBits[sym], lengthBase[sym]);
          var dist = decodeSymbol(d, dt);
          var off = d.destLen - readBits(d, distBits[dist], distBase[dist]);
          for (var i = off; i < off + length; ++i) d.dest[d.destLen++] = d.dest[i];
        }
      }
    }
    function inflateStored(d) {
      // give back whole prefetched bytes; the remaining (<8) bits are block padding and are dropped
      d.sourceIndex -= d.bitcount >> 3; d.bitcount = 0; d.tag = 0;
      var length = d.source[d.sourceIndex + 1] * 256 + d.source[d.sourceIndex];
      d.sourceIndex += 4;
      for (var i = length; i; --i) d.dest[d.destLen++] = d.source[d.sourceIndex++];
      d.bitcount = 0;
    }
    buildFixedTrees(sltree, sdtree);
    buildBitsBase(lengthBits, lengthBase, 4, 3);
    buildBitsBase(distBits, distBase, 2, 1);
    lengthBits[28] = 0; lengthBase[28] = 258;

    return function inflate(source, destLen) {
      var dest = new Uint8Array(destLen);
      var d = new Data(source, dest), bfinal, btype;
      do {
        bfinal = getBit(d);
        btype = readBits(d, 2, 0);
        if (btype === 0) inflateStored(d);
        else if (btype === 1) inflateBlockData(d, sltree, sdtree);
        else if (btype === 2) { decodeTrees(d, d.ltree, d.dtree); inflateBlockData(d, d.ltree, d.dtree); }
        else throw new Error('Stardust: bad deflate block');
      } while (!bfinal);
      return dest;
    };
  })();

  /* ---- org/as3commons/zip/Zip.js ---- */
  // org.as3commons.zip.Zip - minimal zip reader (store + deflate)
  // ======================================================================================
  // ZIP reader -> { filename: Uint8Array }
  // ======================================================================================
  function unzip(buffer) {
    var u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var files = {};
    // find End Of Central Directory
    var eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Not a zip file (no central directory)');
    var count = dv.getUint16(eocd + 10, true);
    var p = dv.getUint32(eocd + 16, true);
    for (var n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('Bad zip central directory');
      var method = dv.getUint16(p + 10, true);
      var csize = dv.getUint32(p + 20, true);
      var usize = dv.getUint32(p + 24, true);
      var nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      var lho = dv.getUint32(p + 42, true);
      var name = utf8(u8.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + elen + clen;
      if (name.charAt(name.length - 1) === '/') continue;
      // local header: name/extra lengths may differ from the central directory
      var ln = dv.getUint16(lho + 26, true), le = dv.getUint16(lho + 28, true);
      var start = lho + 30 + ln + le;
      var raw = u8.subarray(start, start + csize);
      if (method === 0) files[name] = raw.slice();
      else if (method === 8) files[name] = Inflate(raw, usize);
      else throw new Error('Unsupported zip compression method ' + method + ' for ' + name);
    }
    return files;
  }
  function utf8(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return decodeURIComponent(escape(s));
  }
  Stardust.unzip = unzip;

  /* ---- idv/cjcat/stardustextended/utils/Helpers.js ---- */
  // Small shared helpers (value parsing, random rounding, priority ordering)
    function num(v, def) {
      if (v === undefined || v === null || v === '') return def;
      if (typeof v === 'number') return v;
      var n = parseFloat(v);
      return isNaN(n) ? def : n;
    }
    function bool(v, def) {
      if (v === undefined || v === null || v === '') return def;
      return v === true || v === 'true';
    }
    function randomFloor(n) { var f = n | 0; return f + ((n - f) > Math.random() ? 1 : 0); }
    function stableSortByPriority(list) {
      // priority descending, ties keep the listed order
      return list.map(function (o, i) { return [o, i]; })
        .sort(function (a, b) { return (b[0].priority - a[0].priority) || (a[1] - b[1]); })
        .map(function (x) { return x[0]; });
    }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---- idv/cjcat/stardustextended/easing/EasingFunctionType.js ---- */
  // Robert Penner easing, fn(t, b, c, d): time, begin, change, duration. Same names as EasingFunctionType.as
  var HP = Math.PI / 2;
  var Easing = {};
  function linearEase(t, b, c, d) { return c * t / d + b; }
  function addEasing(name, a) { Easing[name + '.easeIn'] = a[0]; Easing[name + '.easeOut'] = a[1]; Easing[name + '.easeInOut'] = a[2]; }
  Easing['Linear.easeNone'] = Easing['Linear.easeIn'] = Easing['Linear.easeOut'] = Easing['Linear.easeInOut'] = linearEase;

  /* ---- idv/cjcat/stardustextended/easing/Back.js ---- */
  // Easing Back
  addEasing('Back', [
    function (t, b, c, d) { var s = 1.70158; t /= d; return c * t * t * ((s + 1) * t - s) + b; },
    function (t, b, c, d) { var s = 1.70158; t = t / d - 1; return c * (t * t * ((s + 1) * t + s) + 1) + b; },
    function (t, b, c, d) {
      var s = 1.70158 * 1.525;
      if ((t /= d / 2) < 1) return c / 2 * (t * t * ((s + 1) * t - s)) + b;
      t -= 2; return c / 2 * (t * t * ((s + 1) * t + s) + 2) + b;
    }]);

  /* ---- idv/cjcat/stardustextended/easing/Circ.js ---- */
  // Easing Circ
  addEasing('Circ', [
    function (t, b, c, d) { t /= d; return -c * (Math.sqrt(1 - t * t) - 1) + b; },
    function (t, b, c, d) { t = t / d - 1; return c * Math.sqrt(1 - t * t) + b; },
    function (t, b, c, d) {
      if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
      t -= 2; return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
    }]);

  /* ---- idv/cjcat/stardustextended/easing/Cubic.js ---- */
  // Easing Cubic
  addEasing('Cubic', [
    function (t, b, c, d) { t /= d; return c * t * t * t + b; },
    function (t, b, c, d) { t = t / d - 1; return c * (t * t * t + 1) + b; },
    function (t, b, c, d) { if ((t /= d / 2) < 1) return c / 2 * t * t * t + b; t -= 2; return c / 2 * (t * t * t + 2) + b; }]);

  /* ---- idv/cjcat/stardustextended/easing/Elastic.js ---- */
  // Easing Elastic
  function elastic(mode) {
    return function (t, b, c, d) {
      var a = 0, p = 0, s;
      if (t === 0) return b;
      if (mode === 2) { if ((t /= d / 2) === 2) return b + c; } else if ((t /= d) === 1) return b + c;
      p = mode === 2 ? d * (0.3 * 1.5) : d * 0.3;
      if (!a || a < Math.abs(c)) { a = c; s = p / 4; } else s = p / (2 * Math.PI) * Math.asin(c / a);
      if (mode === 0) return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * 2 * Math.PI / p)) + b;
      if (mode === 1) return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * 2 * Math.PI / p) + c + b;
      if (t < 1) return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * 2 * Math.PI / p)) + b;
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * 2 * Math.PI / p) * 0.5 + c + b;
    };
  }
  addEasing('Elastic', [elastic(0), elastic(1), elastic(2)]);

  /* ---- idv/cjcat/stardustextended/easing/Expo.js ---- */
  // Easing Expo
  addEasing('Expo', [
    function (t, b, c, d) { return t === 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b; },
    function (t, b, c, d) { return t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b; },
    function (t, b, c, d) {
      if (t === 0) return b; if (t === d) return b + c;
      if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
      return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }]);

  /* ---- idv/cjcat/stardustextended/easing/Quad.js ---- */
  // Easing Quad
  addEasing('Quad', [
    function (t, b, c, d) { t /= d; return c * t * t + b; },
    function (t, b, c, d) { t /= d; return -c * t * (t - 2) + b; },
    function (t, b, c, d) { if ((t /= d / 2) < 1) return c / 2 * t * t + b; --t; return -c / 2 * (t * (t - 2) - 1) + b; }]);

  /* ---- idv/cjcat/stardustextended/easing/Quart.js ---- */
  // Easing Quart
  addEasing('Quart', [
    function (t, b, c, d) { t /= d; return c * t * t * t * t + b; },
    function (t, b, c, d) { t = t / d - 1; return -c * (t * t * t * t - 1) + b; },
    function (t, b, c, d) { if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b; t -= 2; return -c / 2 * (t * t * t * t - 2) + b; }]);

  /* ---- idv/cjcat/stardustextended/easing/Quint.js ---- */
  // Easing Quint
  addEasing('Quint', [
    function (t, b, c, d) { t /= d; return c * t * t * t * t * t + b; },
    function (t, b, c, d) { t = t / d - 1; return c * (t * t * t * t * t + 1) + b; },
    function (t, b, c, d) { if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b; t -= 2; return c / 2 * (t * t * t * t * t + 2) + b; }]);

  /* ---- idv/cjcat/stardustextended/easing/Sine.js ---- */
  // Easing Sine
  addEasing('Sine', [
    function (t, b, c, d) { return -c * Math.cos(t / d * HP) + c + b; },
    function (t, b, c, d) { return c * Math.sin(t / d * HP) + b; },
    function (t, b, c, d) { return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b; }]);

  /* ---- idv/cjcat/stardustextended/math/UniformRandom.js ---- */
  // UniformRandom
  function UniformRandom(center, radius) { this.center = center; this.radius = radius; }
  UniformRandom.prototype.random = function () {
    return this.radius ? this.radius * 2 * (Math.random() - 0.5) + this.center : this.center;
  };
  UniformRandom.prototype.setRange = function (lo, hi) {
    var diameter = hi - lo; this.radius = 0.5 * diameter; this.center = lo + this.radius;
  };

  /* ---- idv/cjcat/stardustextended/math/AveragedRandom.js ---- */
  // AveragedRandom
  function AveragedRandom(obj, count) { this.obj = obj; this.count = count; }
  AveragedRandom.prototype.random = function () {
    if (!this.obj) return 0;
    var s = 0; for (var i = 0; i < this.count; i++) s += this.obj.random();
    return s / this.count;
  };
  AveragedRandom.prototype.setRange = function () { };

  /* ---- idv/cjcat/stardustextended/zones/Zone.js ---- */
  // Zone base class
  function Zone(spec, B) {
    this._x = 0; this._y = 0; this.area = 1;
    this.rotation = num(spec.rotation, 0);
    this.cos = Math.cos(this.rotation * DEG2RAD); this.sin = Math.sin(this.rotation * DEG2RAD);
    this.vt = num(spec.virtualThickness, 1);
  }
  Zone.prototype.getPoint = function (out) {
    this.calc(out);
    if (this.rotation !== 0) {
      var ox = out.x;
      out.x = ox * this.cos - out.y * this.sin;
      out.y = ox * this.sin + out.y * this.cos;
    }
    out.x += this._x; out.y += this._y;
    return out;
  };
  Zone.prototype.contains = function () { return false; };

  /* ---- idv/cjcat/stardustextended/zones/SinglePoint.js ---- */
  // SinglePoint zone
  function SinglePoint(spec, B) {
    Zone.call(this, spec, B);
    this._x = num(spec.x, 0); this._y = num(spec.y, 0);
    this.area = this.vt * this.vt * Math.PI;
  }
  SinglePoint.prototype = Object.create(Zone.prototype);
  SinglePoint.prototype.calc = function (o) { o.x = 0; o.y = 0; };
  SinglePoint.prototype.contains = function (x, y) { return this._x === x && this._y === y; };

  /* ---- idv/cjcat/stardustextended/zones/CircleZone.js ---- */
  // CircleZone zone
  function CircleZone(spec, B) {
    Zone.call(this, spec, B);
    this._x = num(spec.x, 0); this._y = num(spec.y, 0);
    this.r = num(spec.radius, 100);
    this.area = this.r * this.r * Math.PI;
  }
  CircleZone.prototype = Object.create(Zone.prototype);
  CircleZone.prototype.calc = function (o) {
    var t = TWO_PI * Math.random(), r = this.r * Math.sqrt(Math.random());
    o.x = r * Math.cos(t); o.y = r * Math.sin(t);
  };
  CircleZone.prototype.contains = function (x, y) {
    var dx = this._x - x, dy = this._y - y; return dx * dx + dy * dy <= this.r * this.r;
  };

  /* ---- idv/cjcat/stardustextended/zones/CircleContour.js ---- */
  // CircleContour zone
  function CircleContour(spec, B) {
    Zone.call(this, spec, B);
    this._x = num(spec.x, 0); this._y = num(spec.y, 0);
    this.r = num(spec.radius, 100);
    var r1 = this.r + 0.5 * this.vt, r2 = this.r - 0.5 * this.vt;
    this.r1 = r1 * r1; this.r2 = r2 * r2;
    this.area = (this.r1 - this.r2) * Math.PI * this.vt;
  }
  CircleContour.prototype = Object.create(Zone.prototype);
  CircleContour.prototype.calc = function (o) {
    var t = TWO_PI * Math.random(); o.x = this.r * Math.cos(t); o.y = this.r * Math.sin(t);
  };
  CircleContour.prototype.contains = function (x, y) {
    var dx = this._x - x, dy = this._y - y, d = dx * dx + dy * dy; return !(d > this.r1 || d < this.r2);
  };

  /* ---- idv/cjcat/stardustextended/zones/RectZone.js ---- */
  // RectZone zone
  function RectZone(spec, B) {
    Zone.call(this, spec, B);
    this._x = num(spec.x, 0); this._y = num(spec.y, 0);
    this.w = num(spec.width, 150); this.h = num(spec.height, 50);
    this.rx = B.random(spec.randomX, new UniformRandom(0.5, 0.5));
    this.ry = B.random(spec.randomY, new UniformRandom(0.5, 0.5));
    this.area = this.w * this.h;
  }
  RectZone.prototype = Object.create(Zone.prototype);
  RectZone.prototype.calc = function (o) {
    this.rx.setRange(0, this.w); this.ry.setRange(0, this.h);
    o.x = this.rx.random(); o.y = this.ry.random();
  };
  RectZone.prototype.contains = function (x, y) {
    if (this.rotation !== 0) {
      var c = Math.cos(-this.rotation * DEG2RAD), s = Math.sin(-this.rotation * DEG2RAD);
      var nx = x * c - y * s; y = x * s + y * c; x = nx;
    }
    return !(x < this._x || x > this._x + this.w || y < this._y || y > this._y + this.h);
  };

  /* ---- idv/cjcat/stardustextended/zones/Line.js ---- */
  // Line zone
  function Line(spec, B) {
    Zone.call(this, spec, B);
    this._x = num(spec.x1 !== undefined ? spec.x1 : spec.x, 0);
    this._y = num(spec.y1 !== undefined ? spec.y1 : spec.y, 0);
    this.x2 = num(spec.x2, 0); this.y2 = num(spec.y2, 0);
    this.rnd = B.random(spec.random, new UniformRandom(0.5, 0));
    var dx = this._x - this.x2, dy = this._y - this.y2;
    this.area = Math.sqrt(dx * dx + dy * dy) * this.vt;
  }
  Line.prototype = Object.create(Zone.prototype);
  Line.prototype.calc = function (o) {
    this.rnd.setRange(0, 1);
    var r = this.rnd.random();
    o.x = (this.x2 - this._x) * r; o.y = (this.y2 - this._y) * r;
  };

  // RectContour is a Composite of 4 Lines. Note: the original applies rotation + offset twice
  // (Composite/Zone.getPoint, then RectContour.getPoint); kept to match the runtime.

  /* ---- idv/cjcat/stardustextended/zones/RectContour.js ---- */
  // RectContour zone
  function RectContour(spec, B) {
    Zone.call(this, spec, B);
    this._x = num(spec.x, 0); this._y = num(spec.y, 0);
    var w = num(spec.width, 200), h = num(spec.height, 100), vt = this.vt;
    var segs = [[0, 0, w, 0], [0, h, w, h], [0, 0, 0, h], [w, 0, w, h]];
    this.zc = new ZoneCollection(segs.map(function (c) {
      return new Line({ x1: c[0], y1: c[1], x2: c[2], y2: c[3], virtualThickness: vt }, B);
    }));
    this.area = 0; for (var i = 0; i < 4; i++) this.area += this.zc.zones[i].area;
  }
  RectContour.prototype = Object.create(Zone.prototype);
  RectContour.prototype.calc = function (o) { this.zc.randomPoint(o); };
  RectContour.prototype.getPoint = function (out) {
    Zone.prototype.getPoint.call(this, out);
    if (this.rotation !== 0) { var ox = out.x; out.x = ox * this.cos - out.y * this.sin; out.y = ox * this.sin + out.y * this.cos; }
    out.x += this._x; out.y += this._y; return out;
  };
  RectContour.prototype.contains = function (x, y) { return this.zc.contains(x, y); };

  /* ---- idv/cjcat/stardustextended/zones/Sector.js ---- */
  // Sector zone
  function Sector(spec, B) {
    Zone.call(this, spec, B);
    this._x = num(spec.x, 0); this._y = num(spec.y, 0);
    this.minR = num(spec.minRadius, 0); this.maxR = num(spec.maxRadius, 100);
    this.minA = num(spec.minAngle, 0) * DEG2RAD; this.maxA = num(spec.maxAngle, 360) * DEG2RAD;
    var a = (this.maxA - this.minA) * 0.5;
    this.area = a * (this.maxR * this.maxR - this.minR * this.minR);
  }
  Sector.prototype = Object.create(Zone.prototype);
  Sector.prototype.calc = function (o) {
    if (this.maxR === 0) { o.x = this._x; o.y = this._y; return; }
    var t = this.minA + (this.maxA - this.minA) * Math.random();
    var r = this.minR + (this.maxR - this.minR) * Math.sqrt(Math.random());
    o.x = r * Math.cos(t); o.y = r * Math.sin(t);
  };

  /* ---- extras/Masks.js ---- */
  // NEW (no AS3 counterpart): registry of sprites used by the ImageMask zone
  // ---- Image masks: emit from the visible (non-transparent) pixels of a sprite ---------------
  // Stardust.Masks.set('shirt', canvasOrImage, {x, y, scale, anchor})  registers a sprite under a name.
  // An 'ImageMask' zone with maskName 'shirt' then spawns particles on its opaque pixels. The sprite is
  // looked up at every emission, so a game can swap the image / move it before each burst.
  var Masks = {
    _m: {},
    set: function (name, source, opts) {
      opts = opts || {};
      var w = source.naturalWidth || source.videoWidth || source.width, h = source.naturalHeight || source.videoHeight || source.height;
      var data;
      if (source.data && source.data.length === w * h * 4) data = source.data; // ImageData
      else {
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var cx = c.getContext('2d'); cx.drawImage(source, 0, 0);
        data = cx.getImageData(0, 0, w, h).data; // throws SecurityError for cross-origin / tainted images
      }
      this._m[name] = { name: name, w: w, h: h, data: data, x: num(opts.x, 0), y: num(opts.y, 0), scale: num(opts.scale, 1), anchor: opts.anchor || 'topleft', cache: {} };
      return this._m[name];
    },
    // move / rescale a registered sprite without re-reading its pixels
    place: function (name, opts) {
      var m = this._m[name]; if (!m) return;
      if (opts.x !== undefined) m.x = opts.x; if (opts.y !== undefined) m.y = opts.y;
      if (opts.scale !== undefined) m.scale = opts.scale; if (opts.anchor !== undefined) m.anchor = opts.anchor;
    },
    get: function (name) { return this._m[name] || null; },
    remove: function (name) { delete this._m[name]; },
    // list of pixel indices with alpha > threshold (0..1)
    pixels: function (m, thr) {
      var key = thr.toFixed(4), c = m.cache[key];
      if (c) return c;
      var cut = thr * 255, d = m.data, n = m.w * m.h, k = 0, i;
      for (i = 0; i < n; i++) if (d[i * 4 + 3] > cut) k++;
      var idx = new Uint32Array(k); k = 0;
      for (i = 0; i < n; i++) if (d[i * 4 + 3] > cut) idx[k++] = i;
      return (m.cache[key] = idx);
    }
  };

  /* ---- extras/ImageMask.js ---- */
  // NEW (no AS3 counterpart): spawn zone covering the non-transparent pixels of a sprite
  function ImageMask(spec, B) {
    Zone.call(this, spec, B);
    this.B = B;
    this.name = String(spec.maskName === undefined || spec.maskName === '' ? 'mask' : spec.maskName);
    this._x = num(spec.x, 0); this._y = num(spec.y, 0);
    this.sc = num(spec.scale, 1);
    this.thr = Math.min(1, Math.max(0, num(spec.alphaThreshold, 0)));
    this.anchor = spec.anchor === 'center' ? 'center' : (spec.anchor === 'inherit' || spec.anchor === undefined ? 'inherit' : 'topleft');
    this.sample = bool(spec.sampleColor, false);
    this.warned = false;
  }
  ImageMask.prototype = Object.create(Zone.prototype);
  Object.defineProperty(ImageMask.prototype, 'area', {
    get: function () { var m = Masks.get(this.name); return m ? Masks.pixels(m, this.thr).length * this.sc * this.sc * m.scale * m.scale + 1e-6 : 1; },
    set: function () {}
  });
  ImageMask.prototype.calc = function (o) {
    var m = Masks.get(this.name);
    o.hasColor = false;
    if (!m) {
      if (!this.warned) { this.warned = true; this.B.warn('Image mask "' + this.name + '" is not registered (Stardust.Masks.set); spawning at the zone origin'); }
      o.x = 0; o.y = 0; return;
    }
    var idx = Masks.pixels(m, this.thr);
    if (!idx.length) { o.x = 0; o.y = 0; return; }
    var i = idx[(Math.random() * idx.length) | 0], px = i % m.w, py = (i / m.w) | 0;
    var anchor = this.anchor === 'inherit' ? m.anchor : this.anchor;
    var ax = anchor === 'center' ? m.w / 2 : 0, ay = anchor === 'center' ? m.h / 2 : 0;
    var k = this.sc * m.scale;
    // ox/oy and the sprite position are added here; Zone.getPoint then rotates (about the zone origin) and adds _x/_y
    o.x = (px + Math.random() - ax) * k + m.x; o.y = (py + Math.random() - ay) * k + m.y;
    if (this.sample) { var d = m.data, q = i * 4; o.hasColor = true; o.cr = d[q] / 255; o.cg = d[q + 1] / 255; o.cb = d[q + 2] / 255; }
  };
  ImageMask.prototype.contains = function () { return false; };

  /* ---- idv/cjcat/stardustextended/zones/ZoneCollection.js ---- */
  // ZoneCollection
  function ZoneCollection(zones) { this.zones = zones || []; this._p = { x: 0, y: 0 }; }
  ZoneCollection.prototype.randomPoint = function (out) {
    var zs = this.zones, n = zs.length;
    if (n === 0) return null;
    if (n === 1) return zs[0].getPoint(out);
    var sum = 0, i, areas = [];
    for (i = 0; i < n; i++) { sum += zs[i].area; areas.push(sum); }
    var pos = Math.random() * sum;
    for (i = 0; i < n; i++) if (pos <= areas[i]) return zs[i].getPoint(out);
    return zs[n - 1].getPoint(out);
  };
  ZoneCollection.prototype.contains = function (x, y) {
    for (var i = 0; i < this.zones.length; i++) if (this.zones[i].contains(x, y)) return true;
    return false;
  };

  /* ---- idv/cjcat/stardustextended/fields/UniformField.js ---- */
  // UniformField
  function UniformField(spec) {
    this.x = num(spec.x, 0); this.y = num(spec.y, 0);
    this.active = bool(spec.active, true); this.massless = bool(spec.massless, true);
  }
  UniformField.prototype.get = function (p, out) {
    if (!this.active) { out.x = 0; out.y = 0; return out; }
    out.x = this.x; out.y = this.y;
    if (!this.massless) { out.x /= p.mass; out.y /= p.mass; }
    return out;
  };

  /* ---- idv/cjcat/stardustextended/fields/RadialField.js ---- */
  // RadialField
  function RadialField(spec) {
    this.x = num(spec.x, 0); this.y = num(spec.y, 0);
    this.strength = num(spec.strength, 1); this.att = num(spec.attenuationPower, 0); this.eps = num(spec.epsilon, 1);
    this.active = bool(spec.active, true); this.massless = bool(spec.massless, true);
  }
  RadialField.prototype.get = function (p, out) {
    if (!this.active) { out.x = 0; out.y = 0; return out; }
    var dx = p.x - this.x, dy = p.y - this.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    var L = len < this.eps ? this.eps : len;
    var mag = this.strength * Math.pow(L, -0.5 * this.att);
    if (len > 0) { out.x = dx / len * mag; out.y = dy / len * mag; } else { out.x = 0; out.y = 0; }
    if (!this.massless) { out.x /= p.mass; out.y /= p.mass; }
    return out;
  };

  /* ---- idv/cjcat/stardustextended/particles/Particle.js ---- */
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

  /* ---- idv/cjcat/stardustextended/initializers/Initializer.js ---- */
  // Initializer base: registry + shared helper
  var InitializerFactories = {};   // name -> function (spec, B) returning { type, active, priority, init(p) }
  var initTmp = { x: 0, y: 0 };
  function scalarInitializer(defRandom, assign) {
    return function (spec, B) {
      var rnd = B.random(spec.random, defRandom);
      return { type: spec.$type, active: bool(spec.active, true), priority: num(spec.priority, 0), init: function (p) { assign(p, rnd.random()); } };
    };
  }
  function makeInitializers(B) {
    var out = {};
    Object.keys(InitializerFactories).forEach(function (k) { out[k] = function (spec) { return InitializerFactories[k](spec, B); }; });
    return out;
  }

  /* ---- idv/cjcat/stardustextended/initializers/Alpha.js ---- */
  // Alpha initializer
  InitializerFactories.Alpha = scalarInitializer(new UniformRandom(1, 0), function (p, v) { p.initAlpha = p.alpha = v; });

  /* ---- idv/cjcat/stardustextended/initializers/CollisionRadius.js ---- */
  // CollisionRadius initializer
  InitializerFactories.CollisionRadius = scalarInitializer(new UniformRandom(0, 0), function () { });

  /* ---- idv/cjcat/stardustextended/initializers/Life.js ---- */
  // Life initializer
  InitializerFactories.Life = scalarInitializer(new UniformRandom(0, 0), function (p, v) { p.initLife = p.life = v; });

  /* ---- idv/cjcat/stardustextended/initializers/Mass.js ---- */
  // Mass initializer
  InitializerFactories.Mass = scalarInitializer(new UniformRandom(1, 0), function (p, v) { p.mass = v; });

  /* ---- idv/cjcat/stardustextended/initializers/Omega.js ---- */
  // Omega initializer
  InitializerFactories.Omega = scalarInitializer(new UniformRandom(0, 0), function (p, v) { p.omega = v; });

  /* ---- idv/cjcat/stardustextended/initializers/PositionAnimated.js ---- */
  // PositionAnimated initializer
  InitializerFactories.PositionAnimated = function (spec, B) {
    var zc = new ZoneCollection(B.zones(spec.zones, [new RectZone({}, B)]));
    var far = 0;
    zc.zones.forEach(function (z) { far = Math.max(far, Math.abs(z._x), Math.abs(z._y)); });
    return {
      type: 'PositionAnimated', active: bool(spec.active, true), priority: num(spec.priority, 0), maxPos: far,
      init: function (p) {
        initTmp.hasColor = false;
        var m = zc.randomPoint(initTmp);
        if (m) { p.x = m.x; p.y = m.y; if (m.hasColor) { p.colorR = m.cr; p.colorG = m.cg; p.colorB = m.cb; } }
      }
    };
  };

  /* ---- idv/cjcat/stardustextended/initializers/Rotation.js ---- */
  // Rotation initializer
  InitializerFactories.Rotation = scalarInitializer(new UniformRandom(0, 0), function (p, v) { p.rotation = v; });

  /* ---- idv/cjcat/stardustextended/initializers/Scale.js ---- */
  // Scale initializer
  InitializerFactories.Scale = scalarInitializer(new UniformRandom(1, 0), function (p, v) { p.initScale = p.scale = v; });

  /* ---- idv/cjcat/stardustextended/initializers/Velocity.js ---- */
  // Velocity initializer
  InitializerFactories.Velocity = function (spec, B) {
    var zc = new ZoneCollection(B.zones(spec.zones, [new SinglePoint({}, B)]));
    return {
      type: 'Velocity', active: bool(spec.active, true), priority: num(spec.priority, 0),
      init: function (p) { var m = zc.randomPoint(initTmp); if (m) { p.vx += m.x; p.vy += m.y; } }
    };
  };

  /* ---- idv/cjcat/stardustextended/actions/Action.js ---- */
  // Action base: registry + shared helper
  var ActionFactories = {};        // name -> function (spec, B, base, tmp) returning { type, active, priority, pre, update, post, fire }
  function actionBase(spec, extra) {
    var a = { type: spec.$type, active: bool(spec.active, true), priority: 0, pre: null, update: null };
    for (var k in extra) a[k] = extra[k];
    if (spec.priority !== undefined && spec.priority !== null && spec.priority !== '') a.priority = num(spec.priority, a.priority);
    return a;
  }
  function makeActions(B) {
    var tmp = { x: 0, y: 0 }, A = {};
    Object.keys(ActionFactories).forEach(function (k) { A[k] = function (s) { return ActionFactories[k](s, B, actionBase, tmp); }; });
    return A;
  }

  /* ---- idv/cjcat/stardustextended/actions/Accelerate.js ---- */
  // Accelerate action
  ActionFactories.Accelerate = function (s, B, base, tmp) {
    var acc = num(s.acceleration, 0), k = 0;
    return base(s, {
      pre: function (dt) { k = dt * 60; },
      update: function (p) {
        var len = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (len > 0) { var f = len + acc * k; if (f < 0) f = 0; p.vx = p.vx / len * f; p.vy = p.vy / len * f; }
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/AccelerationZone.js ---- */
  // AccelerationZone action
  ActionFactories.AccelerationZone = function (s, B, base, tmp) {
    var zc = new ZoneCollection(B.zones(s.zones, [new RectZone({}, B)])), inv = bool(s.inverted, false);
    var acc = num(s.acceleration, 200), useDir = bool(s.useParticleDirection, true);
    var dx = num(s.directionX, 100), dy = num(s.directionY, 0), dl = Math.sqrt(dx * dx + dy * dy) || 1; dx /= dl; dy /= dl;
    return base(s, {
      priority: -6,
      update: function (p, dt) {
        var aff = zc.contains(p.x, p.y); if (inv) aff = !aff; if (!aff) return;
        if (useDir) {
          var len = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (len > 0) { var f = len + acc * dt; if (f < 0) f = 0; p.vx = p.vx / len * f; p.vy = p.vy / len * f; }
        } else { p.vx += acc * dx * dt; p.vy += acc * dy * dt; }
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Age.js ---- */
  // Age action
  ActionFactories.Age = function (s, B, base, tmp) {
    var m = num(s.multiplier, 1);
    return base(s, { update: function (p, dt) { p.life -= dt * m; if (p.life < 0) p.life = 0; } });
  };

  /* ---- idv/cjcat/stardustextended/actions/AlphaCurve.js ---- */
  // AlphaCurve action
  ActionFactories.AlphaCurve = function (s, B, base, tmp) {
    var inA = num(s.inAlpha, 0), outA = num(s.outAlpha, 0), inL = num(s.inLifespan, 1), outL = num(s.outLifespan, 1);
    var inF = Easing[s.inFunction] || Easing['Linear.easeIn'], outF = Easing[s.outFunction] || Easing['Linear.easeOut'];
    return base(s, {
      update: function (p) {
        var age = p.initLife - p.life;
        if (age < inL) p.alpha = inF(age, inA, p.initAlpha - inA, inL);
        else if (p.life < outL) p.alpha = outF(outL - p.life, p.initAlpha, outA - p.initAlpha, outL);
        else p.alpha = p.initAlpha;
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/ColorGradient.js ---- */
  // ColorGradient action
  ActionFactories.ColorGradient = function (s, B, base, tmp) {
      var steps = num(s.numSteps, 500) | 0;
      var g = s.gradient || s; // editor specs nest the gradient
      var colors = splitList(g.colorsStr !== undefined ? g.colorsStr : g.colors);
      var ratios = splitList(g.ratiosStr !== undefined ? g.ratiosStr : g.ratios);
      var alphas = splitList(g.alphasStr !== undefined ? g.alphasStr : g.alphas);
      var lut = buildGradient(colors, ratios, alphas, steps);
      return base(s, {
        update: function (p) {
          var i = ((steps - 1) * p.life / p.initLife) | 0;
          if (!(i >= 0)) i = 0; if (i > steps - 1) i = steps - 1;
          var o = i * 4;
          p.colorR = lut[o]; p.colorG = lut[o + 1]; p.colorB = lut[o + 2]; p.alpha = lut[o + 3];
        }
      });
    };

  function splitList(v) {
    if (Array.isArray(v)) return v.map(Number);
    return String(v === undefined ? '' : v).split(',').map(function (x) { return parseFloat(x); });
  }
  // Linear RGBA gradient lookup table. Like the original (ColorGradient.setGradient fills its
  // vectors from the last pixel to the first), the table is REVERSED: index steps-1 is the gradient
  // start (ratio 0) and is used at birth (life == initLife), index 0 is the end of the gradient.
  function buildGradient(colors, ratios, alphas, steps) {
    var lut = new Float32Array(steps * 4);
    var n = Math.min(colors.length, ratios.length, alphas.length);
    if (!n) { for (var z = 0; z < steps; z++) { lut[z * 4] = lut[z * 4 + 1] = lut[z * 4 + 2] = lut[z * 4 + 3] = 1; } return lut; }
    for (var pix = 0; pix < steps; pix++) {
      var i = pix, slot = steps - 1 - pix;
      var r = steps > 1 ? i / (steps - 1) * 255 : 0;
      var a = 0;
      while (a < n - 1 && r > ratios[a + 1]) a++;
      var b = Math.min(a + 1, n - 1);
      var span = ratios[b] - ratios[a];
      var t = span > 0 ? (r - ratios[a]) / span : 0;
      if (t < 0) t = 0; if (t > 1) t = 1;
      var c0 = colors[a], c1 = colors[b];
      var R = lerp(((c0 >> 16) & 255), ((c1 >> 16) & 255), t) / 255;
      var G = lerp(((c0 >> 8) & 255), ((c1 >> 8) & 255), t) / 255;
      var Bc = lerp((c0 & 255), (c1 & 255), t) / 255;
      lut[slot * 4] = R; lut[slot * 4 + 1] = G; lut[slot * 4 + 2] = Bc; lut[slot * 4 + 3] = lerp(alphas[a], alphas[b], t);
    }
    return lut;
  }

  /* ---- idv/cjcat/stardustextended/actions/Damping.js ---- */
  // Damping action
  ActionFactories.Damping = function (s, B, base, tmp) {
    var d = num(s.damping, 0.05), damp = 1;
    return base(s, {
      priority: -1,
      pre: function (dt) { damp = 1; if (d) damp = Math.pow(1 - d, dt * 60); },
      update: function (p) { p.vx *= damp; p.vy *= damp; }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/DeathLife.js ---- */
  // DeathLife action
  ActionFactories.DeathLife = function (s, B, base, tmp) {
    return base(s, { update: function (p) { if (p.life <= 0) p.isDead = true; } });
  };

  /* ---- idv/cjcat/stardustextended/actions/DeathZone.js ---- */
  // DeathZone action
  ActionFactories.DeathZone = function (s, B, base, tmp) {
    var zc = new ZoneCollection(B.zones(s.zones || (s.zone ? [s.zone] : null), [])), inv = bool(s.inverted, false);
    return base(s, {
      priority: -6,
      update: function (p) { var d = zc.contains(p.x, p.y); if (inv) d = !d; if (d) p.isDead = true; }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Deflect.js ---- */
  // Deflect action
  ActionFactories.Deflect = function (s, B, base, tmp) {
    var ds = B.deflectors(s.deflectors), out = { x: 0, y: 0, vx: 0, vy: 0 };
    return base(s, {
      priority: -5,
      update: function (p) {
        for (var i = 0; i < ds.length; i++) if (ds[i].test(p, out)) { p.x = out.x; p.y = out.y; p.vx = out.vx; p.vy = out.vy; }
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Die.js ---- */
  // Die action
  ActionFactories.Die = function (s, B, base, tmp) { return base(s, { update: function (p) { p.isDead = true; } }); };

  /* ---- idv/cjcat/stardustextended/actions/Explode.js ---- */
  // Explode action
  ActionFactories.Explode = function (s, B, base, tmp) {
    var x = num(s.x, 0), y = num(s.y, 0), strength = num(s.strength, 5), grow = num(s.growSpeed, 40);
    var maxD = num(s.maxDistance, 200), att = num(s.attenuationPower, 0.1), eps = num(s.epsilon, 1);
    var done = true, inner = 0, outer = 0;
    return base(s, {
      update: function (p, dt) {
        if (done) return;
        var dx = p.x - x, dy = p.y - y, len = Math.sqrt(dx * dx + dy * dy), L = len < eps ? eps : len;
        if (L >= inner && L < outer && len > 0) {
          var mag = strength * Math.pow(L, -att);
          p.vx += dx / len * mag * dt; p.vy += dy / len * mag * dt;
        }
      },
      post: function () { if (done) return; inner += grow; outer += grow; if (inner > maxD) done = true; },
      fire: function () { done = false; inner = 0; outer = grow; }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/FollowWaypoints.js ---- */
  // FollowWaypoints action
  ActionFactories.FollowWaypoints = function (s, B, base, tmp) {
    var wps = B.arr(s.waypoints).map(function (w) {
      return { x: num(w.x, 0), y: num(w.y, 0), radius: num(w.radius, 20), strength: num(w.strength, 1), att: num(w.attenuationPower, 0), eps: num(w.epsilon, 1) };
    });
    var loop = bool(s.loop, false), massless = bool(s.massless, true), k = 0;
    return base(s, {
      pre: function (dt) { k = dt * 60; },
      update: function (p) {
        var n = wps.length; if (!n) return;
        var idx = p.dict.wp | 0;
        if (idx >= n) { idx = n - 1; p.dict.wp = idx; }
        var w = wps[idx];
        var dx = p.x - w.x, dy = p.y - w.y;
        if (dx * dx + dy * dy <= w.radius * w.radius) {
          if (idx < n - 1) { p.dict.wp++; w = wps[idx + 1]; }
          else if (loop) { p.dict.wp = 0; w = wps[0]; }
          else return;
          dx = p.x - w.x; dy = p.y - w.y;
        }
        var len = Math.sqrt(dx * dx + dy * dy);
        var L = len < w.eps ? w.eps : len;
        var mag = -w.strength * Math.pow(L, -0.5 * w.att);
        if (!massless) mag /= p.mass;
        if (len > 0) { p.vx += dx / len * mag * k; p.vy += dy / len * mag * k; }
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Gravity.js ---- */
  // Gravity action
  ActionFactories.Gravity = function (s, B, base, tmp) {
    var fields = B.fields(s.fields);
    return base(s, {
      priority: -3,
      update: function (p, dt) {
        var t = dt * 100; // acceleration is in m/(s*s), scaled like the original
        for (var i = 0; i < fields.length; i++) {
          var m = fields[i].get(p, tmp); p.vx += m.x * t; p.vy += m.y * t;
        }
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Impulse.js ---- */
  // Impulse action
  ActionFactories.Impulse = function (s, B, base, tmp) {
    var field = B.field(s.field, new UniformField({ x: 0, y: 0 })), done = true;
    return base(s, {
      update: function (p, dt) { if (done) return; var m = field.get(p, tmp); p.vx += m.x * dt; p.vy += m.y * dt; },
      post: function () { done = true; },
      fire: function () { done = false; }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Move.js ---- */
  // Move action
  ActionFactories.Move = function (s, B, base, tmp) {
    var m = num(s.multiplier, 1), f = 0;
    return base(s, { priority: -4, pre: function (dt) { f = dt * m; }, update: function (p) { p.x += p.vx * f; p.y += p.vy * f; } });
  };

  /* ---- idv/cjcat/stardustextended/actions/NormalDrift.js ---- */
  // NormalDrift action
  ActionFactories.NormalDrift = function (s, B, base, tmp) {
    var rnd = B.random(s.random, new UniformRandom(0, num(s.max, 1))), massless = bool(s.massless, false), k = 0;
    return base(s, {
      priority: 0,
      pre: function (dt) { k = dt * 60; },
      update: function (p) {
        // note: the original builds the vector as (vy, vx), i.e. a perpendicular-ish drift; kept as is
        var vx = p.vy, vy = p.vx, len = Math.sqrt(vx * vx + vy * vy);
        var L = rnd.random(); if (!massless) L /= p.mass;
        if (len > 0) { vx = vx / len * L; vy = vy / len * L; } else { vx = 0; vy = 0; }
        p.vx += vx * k; p.vy += vy * k;
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Oriented.js ---- */
  // Oriented action
  ActionFactories.Oriented = function (s, B, base, tmp) {
    var factor = num(s.factor, 1), offset = num(s.offset, 0), f = 0, os = 0, k = 0;
    return base(s, {
      priority: -6,
      pre: function (dt) { f = Math.pow(factor, 0.1 / dt); os = offset + 90; k = (dt + TIME_STEP_CORRECTION) * 60; if (k > 1) k = 1; },
      update: function (p) {
        var disp = (Math.atan2(p.vy, p.vx) * RAD2DEG + os) - p.rotation;
        p.rotation += f * disp * k;
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/RandomDrift.js ---- */
  // RandomDrift action
  ActionFactories.RandomDrift = function (s, B, base, tmp) {
    var maxX = num(s.maxX, 10), maxY = num(s.maxY, 10), massless = bool(s.massless, false), k = 0;
    var rx = B.random(s.randomX, new UniformRandom(0, maxX)), ry = B.random(s.randomY, new UniformRandom(0, maxY));
    return base(s, {
      priority: -3,
      pre: function (dt) { k = dt * 60; },
      update: function (p) {
        var x = rx.random(), y = ry.random();
        if (!massless) { x /= p.mass; y /= p.mass; }
        p.vx += x * k; p.vy += y * k;
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/ScaleCurve.js ---- */
  // ScaleCurve action
  ActionFactories.ScaleCurve = function (s, B, base, tmp) {
    var inS = num(s.inScale, 0), outS = num(s.outScale, 0), inL = num(s.inLifespan, 0), outL = num(s.outLifespan, 0);
    var inF = Easing[s.inFunction] || Easing['Linear.easeIn'], outF = Easing[s.outFunction] || Easing['Linear.easeOut'];
    return base(s, {
      update: function (p) {
        var age = p.initLife - p.life;
        if (age < inL) p.scale = inF(age, inS, p.initScale - inS, inL);
        else if (p.life < outL) p.scale = outF(outL - p.life, p.initScale, outS - p.initScale, outL);
        else p.scale = p.initScale;
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Spawn.js ---- */
  // Spawn action
  ActionFactories.Spawn = function (s, B, base, tmp) {
    var trig = B.trigger(s.trigger), inhDir = bool(s.inheritDirection, true), inhVel = bool(s.inheritVelocity, false);
    var a = base(s, {
      priority: -10, target: null,
      update: function (p, dt, t, em) {
        if (!a.target || a.target === em) return;
        if (trig(p, dt)) {
          var np = a.target.createParticles(a.target.clock.getTicks(dt));
          for (var i = 0; i < np.length; i++) {
            var q = np[i]; q.x += p.x; q.y += p.y;
            if (inhVel) { q.vx += p.vx; q.vy += p.vy; }
            if (inhDir) q.rotation += p.rotation;
          }
        }
      }
    });
    a.link = function (map) { a.target = (s.spawnerEmitter !== undefined && s.spawnerEmitter !== null && s.spawnerEmitter !== '') ? (map[s.spawnerEmitter] || null) : null; };
    return a;
  };

  /* ---- idv/cjcat/stardustextended/actions/SpeedLimit.js ---- */
  // SpeedLimit action
  ActionFactories.SpeedLimit = function (s, B, base, tmp) {
    var lim = num(s.limit, 100), lsq = lim * lim;
    return base(s, {
      update: function (p) {
        var sq = p.vx * p.vx + p.vy * p.vy;
        if (sq > lsq) { var f = lim / Math.sqrt(sq); p.vx *= f; p.vy *= f; }
      }
    });
  };

  /* ---- idv/cjcat/stardustextended/actions/Spin.js ---- */
  // Spin action
  ActionFactories.Spin = function (s, B, base, tmp) {
    var m = num(s.multiplier, 1), f = 0;
    return base(s, { priority: -4, pre: function (dt) { f = dt * m; }, update: function (p) { p.rotation += p.omega * f; } });
  };

  /* ---- idv/cjcat/stardustextended/actions/VelocityField.js ---- */
  // VelocityField action
  ActionFactories.VelocityField = function (s, B, base, tmp) { // sets the velocity to the field value (does not add)
      var field = B.field(s.field || (s.fields && B.arr(s.fields)[0]), new UniformField({ x: 100, y: 100 }));
      return base(s, {
        priority: -2,
        update: function (p) { var m = field.get(p, tmp); p.vx = m.x; p.vy = m.y; }
      });
    };

  /* ---- idv/cjcat/stardustextended/clocks/SteadyClock.js ---- */
  // SteadyClock
  function SteadyClock(spec, B) {
    this.ticksPerCall = num(spec.ticksPerCall, 1);
    this.initialDelay = B.random(spec.initialDelay, new UniformRandom(0, 0));
    this.reset();
  }
  SteadyClock.prototype.reset = function () {
    this.t = 0; var v = this.initialDelay.random(); this.delay = v > 0 ? v : 0;
  };
  SteadyClock.prototype.getTicks = function (time) {
    this.t += time;
    return this.t > this.delay ? randomFloor(this.ticksPerCall * time) : 0;
  };

  /* ---- idv/cjcat/stardustextended/clocks/ImpulseClock.js ---- */
  // ImpulseClock
  function ImpulseClock(spec, B) {
    this.ticksPerCall = num(spec.ticksPerCall, 1);
    this.interval = B.random(spec.impulseInterval, new UniformRandom(20, 10));
    this.length = B.random(spec.impulseLength, new UniformRandom(5, 0));
    this.initialDelay = B.random(spec.initialDelay, new UniformRandom(0, 0));
    this.reset();
  }
  ImpulseClock.prototype._len = function () { var v = this.length.random(); this.curLen = v > 0 ? v : 0; };
  ImpulseClock.prototype._int = function () { var v = this.interval.random(); this.curInt = v > 0 ? v : 0; };
  ImpulseClock.prototype.reset = function () {
    var v = this.initialDelay.random(); this.curDelay = v > 0 ? v : 0;
    this._len(); this._int(); this.t = 0;
  };
  ImpulseClock.prototype.impulse = function () { this.curDelay = -1; this.t = 0; };
  ImpulseClock.prototype.getTicks = function (time) {
    var ticks = 0;
    this.curDelay -= time;
    if (this.curDelay < 0) {
      this.t += time;
      if (this.t <= this.curLen) ticks = randomFloor(this.ticksPerCall * time);
      else if (this.t - time <= this.curLen) ticks = randomFloor(this.ticksPerCall * (this.curLen - this.t + time));
      if (this.t >= this.curInt) { this._len(); this._int(); this.t = 0; }
    }
    return ticks;
  };

  /* ---- idv/cjcat/stardustextended/deflectors/Deflector.js ---- */
  // Deflector base: registry, vector helpers, Builder.deflectors
  var DeflectorFactories = {};     // name -> function (o, s): fills o.test(p, result) for that deflector type
  var uidCounter = 1;
    function projOnto(ax, ay, nx, ny) {
      var d = Math.sqrt(nx * nx + ny * ny); if (!d) return [0, 0];
      nx /= d; ny /= d; var k = ax * nx + ay * ny; return [nx * k, ny * k];
    }
    function setLen(x, y, L) { var l = Math.sqrt(x * x + y * y); return l ? [x / l * L, y / l * L] : [0, 0]; }
  Builder.prototype.deflectors = function (list) {
    var self = this, out = [];
    this.arr(list).forEach(function (d) {
      var s = self.resolve(d); if (!s) return;
      var make = DeflectorFactories[s.$type];
      if (!make) { self.warn('Deflector "' + s.$type + '" not supported'); return; }
      var o = { uid: uidCounter++, active: bool(s.active, true), bounce: num(s.bounce, 0.8), slip: num(s.slipperiness, 1) };
      make(o, s);
      out.push(o);
    });
    return out;
  };

  /* ---- idv/cjcat/stardustextended/deflectors/CircleDeflector.js ---- */
  // CircleDeflector
  DeflectorFactories.CircleDeflector = function (o, s) {
    var x = num(s.x, 0), y = num(s.y, 0);
    var radius = num(s.radius, 100);
    o.test = function (p, r) {
      if (!o.active) return false;
      var dx = p.x - x, dy = p.y - y;
      if (Math.sqrt(dx * dx + dy * dy) > radius) return false;
      var rv = setLen(dx, dy, radius), v = projOnto(p.vx, p.vy, rv[0], rv[1]), f = 1 + o.bounce;
      r.x = x + rv[0]; r.y = y + rv[1];
      r.vx = (p.vx - v[0] * f) * o.slip; r.vy = (p.vy - v[1] * f) * o.slip; return true;
    };
  };

  /* ---- idv/cjcat/stardustextended/deflectors/LineDeflector.js ---- */
  // LineDeflector
  DeflectorFactories.LineDeflector = function (o, s) {
    var x = num(s.x, 0), y = num(s.y, 0);
    var nx = num(s.normalX, 0), ny = num(s.normalY, -1);
    o.test = function (p, r) {
      if (!o.active) return false;
      var rv = projOnto(p.x - x, p.y - y, nx, ny);
      var dot = rv[0] * nx + rv[1] * ny, dist = Math.sqrt(rv[0] * rv[0] + rv[1] * rv[1]), rad = 0, adj;
      if (dot > 0) { if (dist > rad) return false; adj = setLen(rv[0], rv[1], rad - dist); }
      else adj = setLen(rv[0], rv[1], -(dist + rad));
      var v = projOnto(p.vx, p.vy, nx, ny), f = 1 + o.bounce;
      r.x = p.x + adj[0]; r.y = p.y + adj[1];
      r.vx = (p.vx - v[0] * f) * o.slip; r.vy = (p.vy - v[1] * f) * o.slip; return true;
    };
  };

  /* ---- idv/cjcat/stardustextended/deflectors/WrappingBox.js ---- */
  // WrappingBox
  DeflectorFactories.WrappingBox = function (o, s) {
    var x = num(s.x, 0), y = num(s.y, 0);
    var w = num(s.width, 640), h = num(s.height, 480);
    var mod = function (a, b) { var m = a % b; return m < 0 ? m + b : m; };
    o.test = function (p, r) {
      if (!o.active) return false;
      if (!(p.x < x || p.x > x + w || p.y < y || p.y > y + h)) return false;
      r.x = x + mod(p.x - x, w); r.y = y + mod(p.y - y, h); r.vx = p.vx; r.vy = p.vy; return true;
    };
  };

  /* ---- idv/cjcat/stardustextended/actions/triggers/Trigger.js ---- */
  // Trigger base: registry + Builder.trigger
  var TriggerFactories = {};       // name -> function (s, B) returning function (particle, dt) -> boolean
  Builder.prototype.trigger = function (v) {
    var s = this.resolve(v);
    if (!s) return TriggerFactories.DeathTrigger(s, this);
    var make = TriggerFactories[s.$type];
    if (!make) { this.warn('Trigger "' + s.$type + '" not supported, using death trigger'); return TriggerFactories.DeathTrigger(s, this); }
    return make(s, this);
  };

  /* ---- idv/cjcat/stardustextended/actions/triggers/DeathTrigger.js ---- */
  // DeathTrigger
  TriggerFactories.DeathTrigger = function () { return function (p) { return p.isDead; }; };

  /* ---- idv/cjcat/stardustextended/actions/triggers/LifeTrigger.js ---- */
  // LifeTrigger
  TriggerFactories.LifeTrigger = function (s, B) {
    var lo = num(s.lowerBound, 0), hi = num(s.upperBound, Number.MAX_VALUE), within = bool(s.triggerWithinBounds, true);
    return function (p) { return within ? (p.life >= lo && p.life <= hi) : (p.life < lo || p.life > hi); };
  };

  /* ---- idv/cjcat/stardustextended/actions/triggers/ZoneTrigger.js ---- */
  // ZoneTrigger
  TriggerFactories.ZoneTrigger = function (s, B) {
    var zc = new ZoneCollection(B.zones(s.zones, [new RectZone({}, B)]));
    return function (p) { return zc.contains(p.x, p.y); };
  };

  /* ---- idv/cjcat/stardustextended/xml/XMLBuilder.js ---- */
  // XMLBuilder: turns parsed specs (XML or JSON) into engine objects (named "Builder" here)
  function Builder(named, warnings) {
    this.named = named || {}; this.warnings = warnings || [];
    this.cache = {};
    this.initFactories = makeInitializers(this);
    this.actionFactories = makeActions(this);
    this.warned = {};
  }
  Builder.prototype.warn = function (msg) {
    if (!this.warned[msg]) { this.warned[msg] = 1; this.warnings.push(msg); }
  };
  Builder.prototype.arr = function (v) {
    if (v === undefined || v === null) return [];
    if (Array.isArray(v)) return v;
    if (v.$values) return v.$values;
    return [v];
  };
  // resolve a reference (name string, {$ref}, or inline spec) to a spec object
  Builder.prototype.resolve = function (v) {
    if (v === undefined || v === null || v === '') return null;
    if (typeof v === 'string') return this.named[v] || null;
    if (v.$ref !== undefined) return this.named[v.$ref] || null;
    return v;
  };
  Builder.prototype.random = function (v, def) {
    var spec = this.resolve(v);
    if (!spec) return def || new UniformRandom(0, 0);
    var r;
    if (spec.$type === 'AveragedRandom') r = new AveragedRandom(this.random(spec.randomObj, new UniformRandom(0, 0)), num(spec.sampleCount, 3) | 0);
    else r = new UniformRandom(num(spec.center, 0.5), num(spec.radius, 0));
    if (spec.$type && spec.$type !== 'UniformRandom' && spec.$type !== 'AveragedRandom') this.warn('Random "' + spec.$type + '" not supported, using uniform');
    return r;
  };
  var ZONES = { ImageMask: ImageMask, RectContour: RectContour, SinglePoint: SinglePoint, CircleZone: CircleZone, CircleContour: CircleContour, RectZone: RectZone, Line: Line, Sector: Sector };
  Builder.prototype.zones = function (list, def) {
    var self = this, out = [];
    this.arr(list).forEach(function (z) {
      var spec = self.resolve(z); if (!spec) return;
      var C = ZONES[spec.$type];
      if (!C) { self.warn('Zone "' + spec.$type + '" not supported'); return; }
      out.push(new C(spec, self));
    });
    return out.length ? out : (def || []);
  };
  Builder.prototype.fields = function (list) {
    var self = this, out = [];
    this.arr(list).forEach(function (f) {
      var spec = self.resolve(f); if (!spec) return;
      if (spec.$type === 'UniformField') out.push(new UniformField(spec));
      else if (spec.$type === 'RadialField') out.push(new RadialField(spec));
      else self.warn('Field "' + spec.$type + '" not supported');
    });
    return out;
  };
  Builder.prototype.field = function (v, def) {
    var f = this.fields([v]);
    return f.length ? f[0] : (def || new UniformField({ x: 0, y: 0 }));
  };
  Builder.prototype.clock = function (v) {
    var spec = this.resolve(v);
    if (!spec) return new SteadyClock({ ticksPerCall: 0 }, this);
    if (spec.$type === 'ImpulseClock') return new ImpulseClock(spec, this);
    if (spec.$type === 'SteadyClock') return new SteadyClock(spec, this);
    this.warn('Clock "' + spec.$type + '" not supported'); return new SteadyClock({ ticksPerCall: 0 }, this);
  };
  Builder.prototype.handler = function (v) {
    var s = this.resolve(v) || {};
    return {
      blendMode: String(s.blendMode || 'normal'),
      smoothing: bool(s.smoothing, false),
      premultiplyAlpha: bool(s.premultiplyAlpha, true),
      animSpeed: num(s.spriteSheetAnimationSpeed, 1),
      randomStart: bool(s.spriteSheetStartAtRandomFrame, false)
    };
  };
  Builder.prototype.initializer = function (v) {
    var spec = this.resolve(v); if (!spec) return null;
    var f = this.initFactories[spec.$type];
    if (!f) { this.warn('Initializer "' + spec.$type + '" not supported'); return null; }
    var o = f(spec); o.spec = spec; return o;
  };
  Builder.prototype.action = function (v) {
    var spec = this.resolve(v); if (!spec) return null;
    var f = this.actionFactories[spec.$type];
    if (!f) { this.warn('Action "' + spec.$type + '" not supported (ignored)'); return null; }
    var o = f(spec); o.spec = spec; return o;
  };

  /* ---- idv/cjcat/stardustextended/emitters/Emitter.js ---- */
  // Emitter
  function Emitter(id, spec, B) {
    this.id = id; this.spec = spec;
    this.warnings = B ? B.warnings : [];
    this.B = B || new Builder({}, this.warnings);
    this.particles = []; this.pool = [];
    this.currentTime = 0; this.sinceLast = 0; this.animTimer = 0;
    this.frames = [];       // [{x,y,w,h,img?}]  img defaults to the sim atlas
    this.tintCache = {};
    this.rebuild('all');
  }
  // Rebuild parts of the runtime from this.spec without touching live particles.
  // what: 'all' | 'emitter' | 'clock' | 'handler' | 'initializers' | 'actions'
  Emitter.prototype.rebuild = function (what) {
    var spec = this.spec, B = this.B, all = !what || what === 'all';
    if (all || what === 'emitter') { this.active = bool(spec.active, true); this.setFps(num(spec.fps, 60)); }
    if (all || what === 'clock') this.clock = B.clock(spec.clock);
    if (all || what === 'handler') this.handler = B.handler(spec.particleHandler);
    if (all || what === 'initializers')
      this.initializers = stableSortByPriority(B.arr(spec.initializers).map(function (i) { return B.initializer(i); }).filter(Boolean));
    if (all || what === 'actions') {
      this.actions = stableSortByPriority(B.arr(spec.actions).map(function (a) { return B.action(a); }).filter(Boolean));
      if (this.siblings) this.link(this.siblings);
    }
  };
  // connect Spawn actions to their target emitters (map: id -> Emitter)
  Emitter.prototype.link = function (map) {
    this.siblings = map;
    for (var i = 0; i < this.actions.length; i++) if (this.actions[i].link) this.actions[i].link(map);
  };
  Emitter.prototype.findAction = function (spec) {
    for (var i = 0; i < this.actions.length; i++) if (this.actions[i].spec === spec) return this.actions[i];
    return null;
  };
  Emitter.prototype.setFps = function (v) { if (v > 60) v = 60; this.fps = v; this.invFps = 1 / v - TIME_STEP_CORRECTION; };
  Emitter.prototype.reset = function () {
    this.currentTime = 0; this.sinceLast = 0; this.animTimer = 0;
    for (var i = 0; i < this.particles.length; i++) this.pool.push(this.particles[i]);
    this.particles.length = 0; this.clock.reset();
  };
  Emitter.prototype.createParticles = function (count) {
    if (count <= 0) return [];
    var fresh = [], i;
    for (i = 0; i < count; i++) {
      var p = this.pool.pop() || new Particle();
      p.init();
      fresh.push(p);
    }
    for (i = 0; i < this.initializers.length; i++) {
      var ini = this.initializers[i];
      if (!ini.active) continue;
      for (var m = 0; m < fresh.length; m++) ini.init(fresh[m]);
    }
    var h = this.handler, total = this.frames.length;
    for (i = 0; i < fresh.length; i++) {
      var q = fresh[i];
      q.currentAnimationFrame = (total > 1 && h.randomStart) ? ((Math.random() * total) | 0) : 0;
      this.particles.push(q);
    }
    return fresh;
  };
  Emitter.prototype.step = function (time) {
    if (time <= 0) return;
    this.sinceLast += time; this.currentTime += time;
    if (this.sinceLast < this.invFps * (this.slow || 1)) return; // slow-motion: step more often so motion stays smooth
    var dt = this.sinceLast, i, m, len, acts = [];
    if (this.active) this.createParticles(this.clock.getTicks(dt));
    for (i = 0; i < this.actions.length; i++) if (this.actions[i].active) acts.push(this.actions[i]);
    len = acts.length;
    for (i = 0; i < len; i++) if (acts[i].pre) acts[i].pre(dt);
    var ps = this.particles;
    for (m = 0; m < ps.length; m++) {
      var p = ps[m];
      for (i = 0; i < len; i++) { if (acts[i].update) acts[i].update(p, dt, this.currentTime, this); }
      if (p.isDead) { this.pool.push(p); ps.splice(m, 1); m--; }
    }
    for (i = 0; i < len; i++) if (acts[i].post) acts[i].post(dt);
    // sprite sheet animation (StarlingHandler.stepEnd)
    var h = this.handler, total = this.frames.length;
    if (total > 1 && h.animSpeed > 0) {
      this.animTimer += dt;
      if (this.animTimer > 1 / h.animSpeed) {
        var stepSize = Math.floor(this.animTimer * h.animSpeed);
        for (i = 0; i < ps.length; i++) {
          var f = ps[i].currentAnimationFrame + stepSize;
          if (f >= total) f = 0;
          ps[i].currentAnimationFrame = f;
        }
        this.animTimer = 0;
      }
    }
    this.sinceLast = 0;
  };

  /* ---- com/funkypandagame/stardustplayer/project/ProjectValueObject.js ---- */
  // ProjectValueObject (named "Sim" here): a parsed .sde
  function Sim() {
    this.emitterSpecs = []; // {id, spec, named}
    this.atlas = null;      // {image, textures:{name:{x,y,w,h}}}
    this.descriptor = {};
    this.warnings = [];
    this.name = '';
  }

  /* ---- com/funkypandagame/stardustplayer/xml/XmlSpecs.js ---- */
  // NEW: .sde emitter XML / JSON -> spec trees (the AS3 library builds directly from XML)
  // --- XML -> spec ---------------------------------------------------------------------
  function xmlToSpecs(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('XML parse error');
    var rootEl = doc.documentElement;
    var named = {}, top = [];
    function kids(el) { var a = []; for (var c = el.firstElementChild; c; c = c.nextElementSibling) a.push(c); return a; }
    function attrs(el, spec) {
      for (var i = 0; i < el.attributes.length; i++) spec[el.attributes[i].name] = el.attributes[i].value;
      return spec;
    }
    // pass 1: top-level definitions
    kids(rootEl).forEach(function (group) {
      kids(group).forEach(function (el) {
        var spec = attrs(el, { $type: el.tagName });
        named[spec.name] = spec; top.push({ el: el, spec: spec });
      });
    });
    // pass 2: nested children lists
    function fill(el, spec) {
      kids(el).forEach(function (group) {
        var list = kids(group).map(function (c) {
          if (c.hasAttribute('name') && named[c.getAttribute('name')]) return { $ref: c.getAttribute('name') };
          var inline = attrs(c, { $type: c.tagName }); fill(c, inline); return inline;
        });
        spec[group.tagName] = list;
      });
    }
    top.forEach(function (t) { fill(t.el, t.spec); });
    var emitters = top.filter(function (t) { return t.spec.$type === 'Emitter2D' || t.spec.$type === 'Emitter'; }).map(function (t) { return t.spec; });
    return { named: named, emitters: emitters };
  }

  // --- JSON -> spec (inline objects) ---------------------------------------------------
  function jsonToSpecs(text) {
    var obj = JSON.parse(text);
    return { named: {}, emitters: [obj] };
  }

  /* ---- com/funkypandagame/stardustplayer/image/AtlasXml.js ---- */
  // TextureAtlas XML parser
  // --- Atlas ---------------------------------------------------------------------------
  function parseAtlasXml(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    var out = {};
    var subs = doc.getElementsByTagName('SubTexture');
    for (var i = 0; i < subs.length; i++) {
      var s = subs[i];
      out[s.getAttribute('name')] = {
        x: num(s.getAttribute('x'), 0), y: num(s.getAttribute('y'), 0),
        w: num(s.getAttribute('width'), 0), h: num(s.getAttribute('height'), 0)
      };
    }
    return out;
  }

  /* ---- com/funkypandagame/stardustplayer/image/ImageLoader.js ---- */
  // CSP-safe PNG decoding (createImageBitmap -> data: URL -> blob: URL)
  // Decode PNG bytes. Order matters for locked-down pages: createImageBitmap needs no URL at all,
  // data: URLs are allowed by most CSPs, blob: URLs are the last resort.
  function loadImage(bytes, mime) {
    mime = mime || 'image/png';
    var blob = new Blob([bytes], { type: mime });
    function viaImg(src, revoke) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { if (revoke) URL.revokeObjectURL(src); resolve(img); };
        img.onerror = function () { reject(new Error('image decode failed')); };
        img.src = src;
      });
    }
    function viaData() {
      var s = '', CH = 0x8000;
      for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      return viaImg('data:' + mime + ';base64,' + btoa(s), false);
    }
    var chain = (typeof createImageBitmap === 'function')
      ? createImageBitmap(blob).catch(viaData) : viaData();
    return chain.catch(function () { return viaImg(URL.createObjectURL(blob), true); })
      .catch(function () { throw new Error('Could not decode atlas image'); });
  }

  // Always returns a Promise (parse errors reject instead of throwing synchronously)

  /* ---- com/funkypandagame/stardustplayer/SimLoader.js ---- */
  // SimLoader: .sde bytes -> ProjectValueObject
  Sim.fromSde = function (buffer, name) {
      return new Promise(function (resolve) { resolve(Sim._fromSde(buffer, name)); });
    };
    // Load a .sde over http(s) (localhost or a server). Does not work from file:// - use a file input there.
    Sim.fromUrl = function (url) {
      return new Promise(function (resolve, reject) {
        var x = new XMLHttpRequest();
        x.open('GET', url); x.responseType = 'arraybuffer';
        x.onload = function () { (x.status === 200 || x.status === 0) && x.response ? resolve(Sim.fromSde(x.response, url.split('/').pop().replace(/\.sde$/i, ''))) : reject(new Error('HTTP ' + x.status + ' for ' + url)); };
        x.onerror = function () { reject(new Error('Could not fetch ' + url)); };
        x.send();
      });
    };
    Sim._fromSde = function (buffer, name) {
      var files = unzip(buffer);
      var sim = new Sim();
      sim.name = name || '';
      if (files['descriptor.json']) {
        try { sim.descriptor = JSON.parse(utf8(files['descriptor.json'])); } catch (e) { sim.warnings.push('descriptor.json unreadable'); }
      }
      var names = Object.keys(files);
      var atlasXmlName = names.filter(function (n) { return /^atlas_0\.xml$/i.test(n); })[0];
      var atlasPngName = names.filter(function (n) { return /^atlas_0\.png$/i.test(n); })[0];
      if (!atlasPngName || !atlasXmlName) throw new Error('This .sde has no atlas_0.png / atlas_0.xml');
      var emitterFiles = names.filter(function (n) { return /^stardustEmitter_.+\.(xml|json)$/i.test(n); });
      if (!emitterFiles.length) throw new Error('This .sde contains no emitters');
      emitterFiles.sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
      names.forEach(function (n) { if (/^emitterSnapshot_/.test(n)) sim.warnings.push('Particle snapshot "' + n + '" ignored (simulation starts empty)'); });

      emitterFiles.forEach(function (fn) {
        var id = fn.replace(/^stardustEmitter_/i, '').replace(/\.(xml|json)$/i, '');
        var text = utf8(files[fn]);
        var parsed = /\.json$/i.test(fn) ? jsonToSpecs(text) : xmlToSpecs(text);
        if (!parsed.emitters.length) { sim.warnings.push('No emitter found in ' + fn); return; }
        sim.emitterSpecs.push({ id: id, spec: parsed.emitters[0], named: parsed.named });
      });
      sim.atlasTextures = parseAtlasXml(utf8(files[atlasXmlName]));
      var bgName = names.filter(function (n) { return /^background\.png$/i.test(n); })[0];
      var bgPromise = bgName ? loadImage(files[bgName]).catch(function () { sim.warnings.push('background.png could not be decoded'); return null; }) : Promise.resolve(null);
      sim.hasBackground = !!bgName && String(sim.descriptor.hasBackground) !== 'false';
      sim.backgroundBytes = bgName ? files[bgName] : null;
      return Promise.all([loadImage(files[atlasPngName]), bgPromise]).then(function (r) {
        var img = r[0];
        sim.backgroundImage = r[1];
        sim.atlasImage = img;
        // dry run to collect warnings about unsupported elements
        sim.instantiate();
        return sim;
      });
  };

  /* ---- com/funkypandagame/stardustplayer/emitter/EmitterBuilder.js ---- */
  // EmitterBuilder: instantiate the emitters of a loaded sim
  Sim.prototype.instantiate = function () {
    var self = this, emitters = [];
    this.emitterSpecs.forEach(function (es) {
      var B = new Builder(es.named, self.warnings);
      var em = new Emitter(es.id, es.spec, B);
      var prefix = 'emitter_' + es.id + '_image_';
      var names = Object.keys(self.atlasTextures).filter(function (n) { return n.indexOf(prefix) === 0; }).sort();
      em.frames = names.map(function (n) { return self.atlasTextures[n]; });
      if (!em.frames.length) self.warn('Emitter ' + es.id + ' has no textures in the atlas');
      emitters.push(em);
    });
    var byId = {}; emitters.forEach(function (e) { byId[e.id] = e; });
    emitters.forEach(function (e) { e.link(byId); });
    emitters.sort(function (a, b) { return a.id.localeCompare(b.id, undefined, { numeric: true }); });
    // Stage mode: sims authored on a fixed stage use top-left (0,0) as the origin. Guess it from a
    // background image or from spawn positions far from (0,0), which only make sense on such a stage.
    var far = 0;
    emitters.forEach(function (em) { em.initializers.forEach(function (i) { if (i.maxPos > far) far = i.maxPos; }); });
    this.stageMode = !!(this.hasBackground || far >= 400);
    this.stageW = this.backgroundImage ? this.backgroundImage.width : 1920;
    this.stageH = this.backgroundImage ? this.backgroundImage.height : 1080;
    return emitters;
  };
  Sim.prototype.warn = function (m) { if (this.warnings.indexOf(m) < 0) this.warnings.push(m); };
  Stardust.Sim = Sim;

  /* ---- com/funkypandagame/stardustplayer/SimPlayer.js ---- */
  // SimPlayer: animation loop around the emitters
  function Player(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.originX = options.originX; // undefined -> centre of canvas
    this.originY = options.originY;
    this.timeScale = 1;
    this.zoom = 1;
    this.background = options.background === undefined ? null : options.background; // css colour or null = transparent
    this.forceSmoothing = options.forceSmoothing || false;
    this.reverseOrder = false;
    this.maxDt = 0.1;
    this.emitters = []; this.sim = null;
    this.running = false; this._raf = 0; this._last = 0;
    this.onframe = null;
    this.fpsSmooth = 60;
    var self = this;
    this._tick = function (now) { self._frame(now); };
  }
  Player.prototype.load = function (sim) {
    this.sim = sim;
    this.emitters = sim.instantiate();
    return this;
  };
  Player.prototype.reset = function () {
    if (!this.sim) return;
    this.emitters = this.sim.instantiate();
  };
  // Emit particles right now, e.g. for a game event: player.burst('1', 300). Without a count, one
  // clock burst's worth of particles is used. Returns the new particles.
  Player.prototype.burst = function (id, count) {
    var em = null;
    for (var i = 0; i < this.emitters.length; i++) if (String(this.emitters[i].id) === String(id)) em = this.emitters[i];
    if (!em) return [];
    if (count === undefined) { var c = em.clock; count = Math.max(1, Math.round(c.ticksPerCall * (c.length ? Math.max(c.length.center || 0.1, 0.05) : 0.1))); }
    return em.createParticles(count);
  };
  Player.prototype.start = function () {
    if (this.running) return; this.running = true; this._last = 0;
    var self = this;
    if (typeof document !== 'undefined' && !this._vis) {
      this._vis = function () { self._last = 0; };   // after returning to the tab, the first frame has dt 0 instead of "everything you missed"
      document.addEventListener('visibilitychange', this._vis);
    }
    this._raf = requestAnimationFrame(this._tick);
  };
  Player.prototype.stop = function () { this.running = false; cancelAnimationFrame(this._raf); };
  Object.defineProperty(Player.prototype, 'numParticles', {
    get: function () { var n = 0; for (var i = 0; i < this.emitters.length; i++) n += this.emitters[i].particles.length; return n; }
  });
  Player.prototype._frame = function (now) {
    if (!this.running) return;
    var dt = this._last ? (now - this._last) / 1000 : 0;
    this._last = now;
    if (dt > this.maxDt) dt = this.maxDt;
    if (dt > 0) this.fpsSmooth += (1 / dt - this.fpsSmooth) * 0.05;
    this.step(dt * this.timeScale);
    this.render();
    if (this.onframe) this.onframe(dt);
    this._raf = requestAnimationFrame(this._tick);
  };

  /* ---- com/funkypandagame/stardustplayer/SimPlayerStep.js ---- */
  // SimPlayer.step with sub-stepping
  Player.prototype.step = function (dt) {
    var slow = this.timeScale > 0 && this.timeScale < 1 ? this.timeScale : 1;
    // The physics (Euler steps with damping) depends on the step size: one big step after a lag spike or an
    // alt-tab makes particles travel ~30% farther than the same time in small steps. So long frames are split
    // into steps of at most 1/60 s, which is the rate the effects are authored at.
    var n = dt > MAX_SUBSTEP ? Math.ceil(dt / MAX_SUBSTEP - 1e-9) : 1, h = dt / n;
    for (var k = 0; k < n; k++)
      for (var i = 0; i < this.emitters.length; i++) { this.emitters[i].slow = slow; this.emitters[i].step(h); }
  };

  var MAX_SUBSTEP = 1 / 45;

  /* ---- idv/cjcat/stardustextended/handlers/canvas/CanvasRenderer.js ---- */
  // NEW (replaces handlers/starling/*): draws the particles with the canvas 2D API
  var BLEND = { normal: 'source-over', add: 'lighter', screen: 'screen', multiply: 'multiply', erase: 'destination-out', none: 'copy', below: 'destination-over' };

  // tinted copy of a sprite frame (multiply by colour, keep alpha shape)
  function tintedFrame(em, img, fi, fr, r, g, b) {
    var qr = (r * 31 + 0.5) | 0, qg = (g * 31 + 0.5) | 0, qb = (b * 31 + 0.5) | 0;
    var key = fi * 32768 + qr * 1024 + qg * 32 + qb;
    var c = em.tintCache[key];
    if (c) return c;
    c = document.createElement('canvas'); c.width = Math.max(1, fr.w); c.height = Math.max(1, fr.h);
    var x = c.getContext('2d');
    x.drawImage(img, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = 'rgb(' + ((qr * 255 / 31) | 0) + ',' + ((qg * 255 / 31) | 0) + ',' + ((qb * 255 / 31) | 0) + ')';
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(img, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
    em.tintCache[key] = c;
    em.tintCount = (em.tintCount || 0) + 1;
    if (em.tintCount > 4000) { em.tintCache = {}; em.tintCount = 0; }
    return c;
  }

  Player.prototype.render = function (ctxOverride) {
    var ctx = ctxOverride || this.ctx, canvas = this.canvas;
    var W = canvas.width, H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (this.background) { ctx.fillStyle = this.background; ctx.fillRect(0, 0, W, H); }
    else ctx.clearRect(0, 0, W, H);
    if (!this.sim) this.sim = {};
    var dpr = this.dpr || 1;
    var mode = this.originMode === 'manual' || this.originMode === 'center' || this.originMode === 'stage' ? this.originMode : (this.sim.stageMode ? 'stage' : 'center');
    var ox, oy, z, bg = this.sim.backgroundImage;
    if (mode === 'manual') {
      // free pan/zoom (used by the editor); the optional background sits at the stage origin (0,0)
      ox = this.viewX * dpr; oy = this.viewY * dpr; z = this.viewZoom * dpr;
      if (bg && this.sim.hasBackground && this.showBackground === true) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(bg, ox, oy, bg.width * z, bg.height * z);
      }
    } else if (mode === 'stage') {
      // whole stage fitted into the canvas (letterboxed), origin at its top-left corner
      var sw = this.sim.stageW, sh = this.sim.stageH, k = Math.min(W / sw, H / sh);
      ox = (W - sw * k) / 2; oy = (H - sh * k) / 2; z = k * this.zoom;
      if (bg && this.sim.hasBackground && this.showBackground === true) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(bg, ox, oy, sw * k, sh * k);
      }
    } else {
      ox = (this.originX === undefined ? W / 2 : this.originX * dpr);
      oy = (this.originY === undefined ? H / 2 : this.originY * dpr);
      z = this.zoom * dpr;
    }
    var img = this.sim.atlasImage;
    var list = this.reverseOrder ? this.emitters.slice().reverse() : this.emitters;
    for (var e = 0; e < list.length; e++) {
      var em = list[e], h = em.handler, frames = em.frames, ps = em.particles;
      if (!frames.length || !ps.length) continue;
      ctx.globalCompositeOperation = BLEND[h.blendMode] || 'source-over';
      ctx.imageSmoothingEnabled = this.forceSmoothing || h.smoothing;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        var a = p.alpha, s = p.scale;
        if (!(a > 0) || !(s > 0)) continue;
        if (a > 1) a = 1;
        var fi = p.currentAnimationFrame; if (fi >= frames.length) fi = 0;
        var fr = frames[fi];
        var rot = p.rotation * DEG2RAD, c = 1, sn = 0;
        if (rot) { c = Math.cos(rot); sn = Math.sin(rot); }
        ctx.setTransform(c * s * z, sn * s * z, -sn * s * z, c * s * z, ox + p.x * z, oy + p.y * z);
        ctx.globalAlpha = a;
        var src = fr.img || img;
        if (p.colorR < 0.999 || p.colorG < 0.999 || p.colorB < 0.999) {
          var t = tintedFrame(em, src, fi, fr, p.colorR, p.colorG, p.colorB);
          ctx.drawImage(t, -fr.w * 0.5, -fr.h * 0.5, fr.w, fr.h);
        } else {
          ctx.drawImage(src, fr.x, fr.y, fr.w, fr.h, -fr.w * 0.5, -fr.h * 0.5, fr.w, fr.h);
        }
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };

  /* ---- idv/cjcat/stardustextended/Exports.js ---- */
  // Public API
  Stardust.Masks = Masks;
  Stardust.Player = Player;
  Stardust.Emitter = Emitter;
  Stardust.Builder = Builder;
  Stardust.Easing = Easing;
  Stardust.io = { xmlToSpecs: xmlToSpecs, jsonToSpecs: jsonToSpecs, parseAtlasXml: parseAtlasXml, loadImage: loadImage, utf8: utf8 };
  Stardust.version = '1.1.0';

  if (typeof module !== 'undefined' && module.exports) module.exports = Stardust;
  root.Stardust = Stardust;
})(typeof window !== 'undefined' ? window : this);
