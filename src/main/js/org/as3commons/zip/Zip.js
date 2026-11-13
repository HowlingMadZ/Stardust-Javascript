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
