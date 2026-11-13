// Shortcuts: window.Stardust, schema, $() and el()
var S = window.Stardust, E = S.Editor, D = E.defs;
var $ = function (id) { return document.getElementById(id); };
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
