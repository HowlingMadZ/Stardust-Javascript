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
