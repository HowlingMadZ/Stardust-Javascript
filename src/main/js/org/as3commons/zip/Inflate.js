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
