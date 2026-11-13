// Parameter schema: zones
// ---------- zones ----------
var ROT = n('rotation', 'Rotation (deg)', 0, -360, 360, 1);
var VT = n('virtualThickness', 'Thickness', 1, 0.1, 50, 0.1);
var Z = D.zone;
Z.SinglePoint = { label: 'Point', params: [X('x', 'X', 0), X('y', 'Y', 0), ROT, VT] };
Z.CircleZone = { label: 'Circle', params: [X('x', 'X', 0), X('y', 'Y', 0), n('radius', 'Radius', 100, 0, 1500, 1), ROT] };
Z.CircleContour = { label: 'Circle outline', params: [X('x', 'X', 0), X('y', 'Y', 0), n('radius', 'Radius', 100, 0, 1500, 1), ROT, VT] };
Z.RectZone = { label: 'Rectangle', params: [X('x', 'X', 0), X('y', 'Y', 0), n('width', 'Width', 150, -1500, 1500, 1), n('height', 'Height', 50, -1500, 1500, 1), ROT] };
Z.RectContour = { label: 'Rectangle outline', params: [X('x', 'X', 0), X('y', 'Y', 0), n('width', 'Width', 200, 0, 1500, 1), n('height', 'Height', 100, 0, 1500, 1), ROT, VT] };
Z.Line = { label: 'Line', params: [X('x1', 'X1', 0), X('y1', 'Y1', 0), X('x2', 'X2', 100), X('y2', 'Y2', 0), ROT, VT] };
Z.Sector = { label: 'Sector', params: [X('x', 'X', 0), X('y', 'Y', 0), n('minRadius', 'Min radius', 0, 0, 1500, 1), n('maxRadius', 'Max radius', 100, 0, 1500, 1),
  n('minAngle', 'Min angle', 0, -360, 720, 1), n('maxAngle', 'Max angle', 360, -360, 720, 1), ROT] };
Z.ImageMask = { label: 'Image mask (sprite pixels)', params: [st('maskName', 'Mask name', 'mask'), X('x', 'Offset X', 0), X('y', 'Offset Y', 0), n('scale', 'Scale', 1, 0.05, 5, 0.01),
  n('alphaThreshold', 'Min. alpha (0 = any visible pixel)', 0, 0, 1, 0.01), en('anchor', 'Image anchor', ['inherit', 'topleft', 'center'], 'inherit'), b('sampleColor', 'Particles take the pixel colour', false), ROT] };
Z.Line.alias = { x1: ['x'], y1: ['y'] };
