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
