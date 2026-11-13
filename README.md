### Stardust-Javascript
An Javascript port of the amazing Stardust Particle System.

Early working demo:
https://howlingmadz.github.io/Stardust-Javascript/

Player:
https://howlingmadz.github.io/Stardust-Javascript/dist/stardust-player.html

Editor:
https://howlingmadz.github.io/Stardust-Javascript/dist/stardust-editor.html


I noticed there didn't seem to be a particle solution that I would like to see for simple html5 websites, so I decided I am going to try to port one from as3, at least the parts I need, and eventually maybe with a few fixes that the other doesn't have.

Documentation I first found:
https://wiki.starling-framework.org/extensions/stardust-engine

Original StarDust (2009 - 2011):
https://code.google.com/archive/p/stardust-particle-engine/

Plumbee's Fork of Stardust (2013 - 2016):
https://github.com/plumbee/stardust-library-plumbee

Matyasf's Fork of Plumbee's Fork of Stardust (2013 - 2016):
https://github.com/matyasf/stardust-library-plumbee

***

Online Flash Editor for Stardust SDE files:
https://s3-eu-west-1.amazonaws.com/s3.funkypandagame.com/startdust-particle-editor/stardust-editor.html

AS3 Loader:
https://github.com/matyasf/stardust-sim-loader
(This helps load the editor build SDE files so designers can tweak particles without the need for a programmer to code them)

***



# stardust-canvas

A dependency-free **canvas 2D / JavaScript port of the Stardust particle engine** (the AS3 library by CJ Cat, extended by Plumbee and FunkyPanda), together with HowlingMadZ

* a **player** that runs the `.sde` simulation files made by the Stardust editor, and
* a browser **editor** (sliders, gizmos, attraction points, undo, open/save `.sde`) that replaces the lost AIR/SWF editor.

Everything is plain `<script>` code: no modules, no `fetch`, no network. It runs from `file://`, from a local server and under a strict CSP (images are decoded without blob URLs where needed).

```
dist/stardust.js          the library (readable)                       ← ship this with your game
dist/stardust.min.js      the library (minified, ~40 KB)               ← or this
dist/stardust-player.html single-file player (sample sims embedded)
dist/stardust-editor.html single-file editor
```

## Using the library

```html
<script src="stardust.min.js"></script>
<script>
  const sim = await Stardust.Sim.fromSde(arrayBuffer);   // or: await Stardust.Sim.fromUrl('fx/fire.sde')
  const player = new Stardust.Player(canvas);            // origin = canvas centre by default
  player.load(sim);
  player.start();                                        // requestAnimationFrame loop
</script>
```

Useful bits of the API (`Stardust.*`):

| | |
|---|---|
| `Sim.fromSde(buffer)` / `Sim.fromUrl(url)` | parse a `.sde` (XML or JSON emitters, atlas, optional background) → `Promise<Sim>` |
| `new Player(canvas, opts)` | `load(sim)`, `start()`, `stop()`, `reset()`, `step(dt)`, `render()`, `burst(emitterId, count)`, `timeScale`, `zoom`, `originMode` (`'auto'｜'center'｜'stage'｜'manual'`), `dpr`, `numParticles` |
| `Masks.set(name, sprite, {x, y, scale, anchor})` | register a sprite for **ImageMask** zones; `Masks.place(name, {...})` moves it without re-reading pixels |
| `Emitter`, `Builder` | for building your own render loop: `emitter.step(dt)`, `emitter.particles`, `emitter.createParticles(n)` |
| `unzip(buffer)`, `io.*` | the zip reader and the image/atlas/XML helpers |

### ImageMask zone (new – not in the Flash library)

A spawn zone covering every non-transparent pixel of a sprite, e.g. for outfit-change "poofs":

```js
Stardust.Masks.set('mask', shirtSprite, { x: shirtX, y: shirtY });   // canvas, <img>, ImageBitmap or ImageData
player.emitters[0].active = false;                                    // no automatic bursts
player.burst('1', 350);                                               // poof, on the visible pixels
```

`Masks.set` reads the pixels with `getImageData`, so the image must be same-origin (or drawn to a canvas first). `.sde` files that use `ImageMask` only play in this engine, not in the Flash player.

### Frame-rate independence

`Player.step` splits long frames into steps of at most 1/45 s, so particles travel the same distance on a lagging machine or after an alt-tab as at a steady 60 fps. Slow motion (`timeScale < 1`) steps every frame, so it stays smooth.

## Source layout (one file ↔ one AS3 class)

The sources are small fragments concatenated, in the order of `build/manifest.json`, into **one closure** (no `import`/`export`, so the result works as a classic script). Paths mirror the AS3 repositories:

```
src/main/js/
  idv/cjcat/stardustextended/        ← stardust-library-plumbee  (src/main/flex/idv/cjcat/stardustextended)
    Stardust.js  Exports.js            namespace + constants / public API
    actions/*.js                       Age, Move, Damping, Gravity, … (one registry entry per file) + triggers/
    initializers/*.js  clocks/*.js  zones/*.js  fields/*.js  deflectors/*.js  easing/*.js  math/*.js
    particles/Particle.js  emitters/Emitter.js  xml/XMLBuilder.js  utils/Helpers.js
    handlers/canvas/CanvasRenderer.js  NEW – replaces handlers/starling/*
  com/funkypandagame/stardustplayer/ ← stardust-sim-loader
    SimLoader.js  SimPlayer.js  SimPlayerStep.js  project/ProjectValueObject.js  emitter/EmitterBuilder.js
    xml/XmlSpecs.js  image/AtlasXml.js  image/ImageLoader.js      (helpers the AS3 loader gets from Flash/Starling)
  org/as3commons/zip/                ← the zip library the loader uses
    Zip.js  Inflate.js
  extras/                            NEW – things the Flash library does not have
    Masks.js  ImageMask.js
src/editor/{core,ui}/                the editor, as fragments too (schema, normaliser, XML serializer, zip writer, atlas packer, widgets, gizmos …)
src/apps/*.html                      page templates  ·  src/helpers/sprite-flash.js  ·  examples/*.sde, shirt.png
build/build.js  build-apps.js  manifest.json
test/run.js
```

Naming differences to keep in mind: our `Sim` is the AS3 `ProjectValueObject`, our `Builder` is `XMLBuilder`, our `Player` is `SimPlayer`. Actions, initializers, deflectors and triggers register themselves in a table (`ActionFactories.Age = …`) instead of being classes; the maths inside are ported line by line from the AS3 sources (see comments in the individual files).

### Not ported

`BitmapField`/`BitmapZone`, `Collide`/`MutualGravity`/`MutualAction`, the `flashdisplay` bursters and display-object handlers, the Starling renderer (replaced by the canvas renderer), `DeflectorTrigger` and **particle snapshots** (`emitterSnapshot_*.bytearray` are ignored; simulations start empty). The editor drops elements it does not know (with a warning on load).

## Building and testing

```
npm install          # only needed for the minified build (terser)
npm run build        # → dist/stardust.js, stardust.min.js and the HTML pages
npm test             # builds, then runs test/run.js (zip, easing, emitters, physics, spawn, gradient, ImageMask)
```

Adding a class = add a file under `src/main/js/…` and list it in `build/manifest.json` (order matters only for base classes: a base file must come before the files that extend it).

## The `.sde` format (what the editor writes)

A zip (store-only) with `atlas_0.png`, `atlas_0.xml` (TextureAtlas, sub-textures named `emitter_<id>_image_<NN>`), `descriptor.json`, one `stardustEmitter_<id>.xml` per emitter and optionally `background.png`. Backgrounds are a preview aid only; the editor does not export one unless you tick "save in file".

## Licence

MIT, see `LICENSE`. The engine maths and file format come from Stardust © Allen Chou (CJ Cat), Plumbee Ltd. and FunkyPanda Ltd. The files in `examples/` are sample content; check their provenance before redistributing them.
