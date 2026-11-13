// Public API
Stardust.Masks = Masks;
Stardust.Player = Player;
Stardust.Emitter = Emitter;
Stardust.Builder = Builder;
Stardust.Easing = Easing;
Stardust.io = { xmlToSpecs: xmlToSpecs, jsonToSpecs: jsonToSpecs, parseAtlasXml: parseAtlasXml, loadImage: loadImage, utf8: utf8 };
Stardust.version = '1.0.0';

if (typeof module !== 'undefined' && module.exports) module.exports = Stardust;
root.Stardust = Stardust;
