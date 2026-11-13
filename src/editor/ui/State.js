// Application state, the Stardust player and the fake sim that feeds it
// ------------------------------------------------------------------ state
var project = { emitters: [], background: null, includeBackground: false, name: 'untitled' };
var sel = 0;            // selected emitter index
var selCard = null;     // selected element spec (gizmo focus)
var showBg = true;
var warnings = [];
var undoStack = [], redoStack = [], lastChange = 0;
var openCards = {};     // spec object -> bool, kept across re-renders (WeakMap-ish via array)
var openList = [];

var canvas = $('c'), gz = $('gz'), gctx = gz.getContext('2d');
var player = new S.Player(canvas, {});
player.originMode = 'manual'; player.viewX = 0; player.viewY = 0; player.viewZoom = 1; player.showBackground = true;
var fakeSim = {
  stageMode: false, hasBackground: false, backgroundImage: null, stageW: 1920, stageH: 1080, atlasImage: null,
  instantiate: function () {
    var map = {}, out = project.emitters.map(function (pe) {
      var B = new S.Builder({}, warnings);
      var em = new S.Emitter(pe.id, pe.spec, B);
      em.frames = frameRects(pe);
      map[pe.id] = em; return em;
    });
    out.forEach(function (em) { em.link(map); });
    return out;
  }
};
player.sim = fakeSim;
function frameRects(pe) { return pe.frames.map(function (f) { return { x: 0, y: 0, w: f.canvas.width, h: f.canvas.height, img: f.canvas }; }); }
function liveFor(pe) { for (var i = 0; i < player.emitters.length; i++) if (player.emitters[i].spec === pe.spec) return player.emitters[i]; return null; }
function cur() { return project.emitters[sel] || null; }
