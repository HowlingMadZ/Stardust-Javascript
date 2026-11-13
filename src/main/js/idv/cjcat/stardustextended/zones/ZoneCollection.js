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
