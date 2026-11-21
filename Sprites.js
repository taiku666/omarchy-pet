// Pixel art for the pets. Every pet is a 20x18 grid drawn from its left half
// (10 columns) mirrored across the middle, so the art stays symmetrical and
// each pet is only 18 short strings. Faces, tails, wings and hats are drawn on
// top in code so they can animate.
//
// The pets are chibi shaped: a big round head on a small body with paws. Light
// comes from the top left: `runsFor` gives every body pixel on a top or left
// edge the highlight colour and every one on a bottom or right edge the shade,
// so the hand-typed halves only carry the markings.
//
// Palette keys: o outline, b body, h highlight, l light belly, d shade, p pink,
// a accent, w white, k dark. A '.' is transparent.

var W = 20
var H = 18

var HALVES = {
  cat: [
    "..........",
    ".o........",
    ".oo.......",
    ".obo......",
    ".obpo.....",
    ".obppooooo",
    ".obbbbbdbd",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbbbbb",
    "..oobbbbbb",
    "...obbllll",
    "...obbllll",
    "...obbllll",
    "...obwwwob",
    "...ooooooo"
  ],
  dog: [
    "..........",
    "..........",
    ".....ooooo",
    "...oobbbbb",
    "..obbbbbbb",
    ".oddobbbbb",
    "odddobbbbb",
    "odddobbbbb",
    "odddobbbbb",
    "odddobbbll",
    ".oddobblll",
    "..oo.obbll",
    ".....ooooo",
    "....obllll",
    "....obllll",
    "....obllll",
    "....obbbob",
    "....oooooo"
  ],
  bunny: [
    "..ooo.....",
    ".obbbo....",
    ".obpbo....",
    ".obpbo....",
    ".obpbo....",
    ".obpbo....",
    "..obbooooo",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbbbbb",
    "..oobbllll",
    "...obbllll",
    "...obbllll",
    "...oblllob",
    "...ooooooo"
  ],
  frog: [
    "..........",
    "..oooo....",
    ".obbbbo...",
    ".obbbbbooo",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbbbbb",
    "..obllllll",
    "..obllllll",
    ".obbllllll",
    "obbdblllll",
    "obddbbllll",
    "obbbbobbbb",
    ".oooo.oooo"
  ],
  panda: [
    "..........",
    ".ooo......",
    "okkko.....",
    "okkkoooooo",
    ".okbbbbbbb",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbkkkbbbb",
    "obkkkkbbbb",
    "obkkkkbbbb",
    "obbkkbbbbb",
    ".obbbbbbbb",
    "..ookkbbbb",
    "..okkkbbbb",
    "..okkkbbbb",
    "...okkbbbb",
    "...okkkokk",
    "...ooooooo"
  ],
  fox: [
    "..........",
    ".o........",
    ".oo.......",
    ".oko......",
    ".obko.....",
    ".obbkooooo",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "owwwbbbbbb",
    ".owwwwwbbw",
    "..oowwwwww",
    "...obbwwww",
    "...obbwwww",
    "...obbwwww",
    "...okkkokk",
    "...ooooooo"
  ],
  dragon: [
    "..........",
    "..a.......",
    ".aao......",
    ".oaoooooo.",
    ".obbbbbbbo",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbbbbb",
    "..oobbllll",
    "...obbllll",
    "...obbllll",
    "...obbllll",
    "...obdddod",
    "...ooooooo"
  ],
  penguin: [
    "....oooooo",
    "..ookkkkkk",
    ".okkkkkkkk",
    ".okkkkkkkk",
    "okkkwwwkkk",
    "okkwwwwwkw",
    "okkwwwwwww",
    "okkwwwwwww",
    "okkwwwwwww",
    "okkwwwwwww",
    ".okkwwwwww",
    "..okwwwwww",
    "..okwwwwww",
    "..okwwwwww",
    "..okwwwwww",
    "...okwwwww",
    "...oaaaooo",
    "...ooooo.."
  ]
}

// Markings that break the mirror: [x, y, w, h, key], painted over the full
// grid before it is lit. The cat has a tabby stripe on each cheek.
var MARKS = {
  cat: [[3, 7, 1, 2, "d"], [16, 7, 1, 2, "d"]]
}

var PALETTES = {
  cat:     { o: "#7a3f22", b: "#f2a65a", h: "#ffc887", s: "#eeb984", l: "#ffe6bf", d: "#d9823b", p: "#ffb3c1", a: "#d9823b", w: "#fff6e8", k: "#4a2c1a" },
  dog:     { o: "#5e3a22", b: "#d9a066", h: "#efc08c", s: "#cfae88", l: "#f9e4c4", d: "#9c6b3f", p: "#ffb3c1", a: "#9c6b3f", w: "#fff6e8", k: "#3d2616" },
  bunny:   { o: "#8c7383", b: "#f5ece6", h: "#ffffff", s: "#eee5ea", l: "#ffffff", d: "#d9c6d0", p: "#ffb8cc", a: "#ffb8cc", w: "#ffffff", k: "#6a5560" },
  frog:    { o: "#2f6b3e", b: "#7fcf87", h: "#b4ecab", s: "#a1d39f", l: "#dff7cf", d: "#55a865", p: "#ffb3b3", a: "#ffd966", w: "#ffffff", k: "#2e5a39" },
  panda:   { o: "#2c2c36", b: "#f4f1ea", h: "#ffffff", s: "#e9e7e4", l: "#ffffff", d: "#cfcac2", p: "#ffb3c1", a: "#7fc97f", w: "#ffffff", k: "#3a3a46" },
  fox:     { o: "#7f3a17", b: "#f58a3f", h: "#ffb070", s: "#e4b08e", l: "#fff2e0", d: "#c4602a", p: "#ffb3c1", a: "#6b2f14", w: "#fff4e6", k: "#4a2210" },
  dragon:  { o: "#25665f", b: "#7fd6c4", h: "#b5f0e2", s: "#b0d5b4", l: "#fff0c2", d: "#4fb3a2", p: "#ffb3b3", a: "#ff9e7a", w: "#ffffff", k: "#1f5650" },
  penguin: { o: "#1c2036", b: "#3b4263", h: "#58608a", s: "#9ea1b0", l: "#fbfbff", d: "#2c3250", p: "#ffb3c1", a: "#ffb347", w: "#fbfbff", k: "#3b4263" }
}

// Face anchors in grid pixels: eyes are 2x3 at (x, y), the mouth is centred on
// (mx, my), the nose sits above it. Head metrics place hats and headphones.
var FACES = {
  cat:     { eyes: [5, 7],  eyeR: [13, 7],  mouth: [9, 11], nose: { y: 10, c: "#ff8fa8" }, cheeks: [3, 10], hat: 5, head: { hw: 10, cupY: 8 }, hatDx: 0 },
  dog:     { eyes: [6, 5],  eyeR: [12, 5],  mouth: [9, 9],  nose: { y: 8,  c: "#2b2433", w: 2 }, cheeks: [5, 8],  hat: 2, head: { hw: 8, cupY: 6 }, hatDx: 0 },
  bunny:   { eyes: [5, 8],  eyeR: [13, 8],  mouth: [9, 12], nose: { y: 11, c: "#ff8fa8" }, cheeks: [3, 11], hat: 6, head: { hw: 10, cupY: 9 }, hatDx: 0 },
  frog:    { eyes: [3, 2],  eyeR: [15, 2],  mouth: [9, 8],  nose: null,                        cheeks: [2, 7],  hat: 3, head: { hw: 10, cupY: 6 }, hatDx: 0, wideMouth: true },
  panda:   { eyes: [4, 7],  eyeR: [14, 7],  mouth: [9, 11], nose: { y: 10, c: "#2b2433", w: 2 }, cheeks: [3, 11], hat: 3, head: { hw: 10, cupY: 7 }, hatDx: 0 },
  fox:     { eyes: [5, 7],  eyeR: [13, 7],  mouth: [9, 11], nose: { y: 10, c: "#2b2433", w: 2 }, cheeks: [2, 10], hat: 5, head: { hw: 10, cupY: 8 }, hatDx: 0 },
  dragon:  { eyes: [5, 6],  eyeR: [13, 6],  mouth: [9, 10], nose: { y: 9,  c: "#2e7a73", w: 2, dots: true }, cheeks: [3, 9], hat: 3, head: { hw: 10, cupY: 7 }, hatDx: 0 },
  penguin: { eyes: [5, 6],  eyeR: [13, 6],  mouth: [9, 10], nose: null,                        cheeks: [3, 9],  hat: 0, head: { hw: 10, cupY: 6 }, hatDx: 0, beak: true }
}

var EYE = "#2b2433"

// The palette of the pet being drawn. drawPet sets it so every helper below
// paints in the same (theme-derived) colours without threading it through.
var CUR = null
// Lets other sprite files (SideSprites.js) paint with the same palette.
function usePalette(p) { CUR = p }
function E() { return (CUR && CUR.e) || EYE }
function HP() { return (CUR && CUR.hat) || HAT_PAL }
function themed(k, fallback) { return (CUR && CUR[k]) || fallback }
function GOLD() { return (CUR && CUR.gold) || "#ffd966" }
// Older palettes have no highlight; fall back to the body colour.
function colorOf(P, k) { return P[k] || (k === "h" ? P.b : k === "s" ? P.d : P.o) }

// ---------------------------------------------------------------- runs

var _runs = {}

// Top-left light: a body pixel on a top or left edge (next to the outline or
// the outside) becomes highlight, one on a bottom or right edge becomes shade.
// Pure, shared with SideSprites.js, which builds its grids the same way.
function lightGrid(rows) {
  var out = [], y, x
  var edge = function (cx, cy) {
    if (cy < 0 || cy >= rows.length || cx < 0 || cx >= rows[cy].length) return true
    var c = rows[cy].charAt(cx)
    return c === "." || c === "o"
  }
  for (y = 0; y < rows.length; y++) {
    var row = ""
    for (x = 0; x < rows[y].length; x++) {
      var c = rows[y].charAt(x)
      if (c === "b") {
        if (edge(x, y + 1) || edge(x + 1, y)) c = "d"
        else if (edge(x, y - 1) || edge(x - 1, y)) c = "h"
      } else if (c === "l" && edge(x, y + 1)) c = "s"
      row += c
    }
    out.push(row)
  }
  return out
}

function gridRuns(rows) {
  var out = []
  for (var y = 0; y < rows.length; y++) {
    var row = rows[y], x = 0
    while (x < row.length) {
      var c = row.charAt(x), x2 = x
      while (x2 < row.length && row.charAt(x2) === c) x2++
      if (c !== ".") out.push({ x: x, y: y, w: x2 - x, c: c })
      x = x2
    }
  }
  return out
}

// Expand the left half to the full row, light it, and merge neighbours of the
// same colour into rectangles so a frame costs ~100 fillRects instead of 360.
function fullRows(type) {
  var half = HALVES[type], rows = []
  for (var y = 0; y < H; y++) rows.push(half[y] + half[y].split("").reverse().join(""))
  var marks = MARKS[type] || []
  for (var i = 0; i < marks.length; i++) {
    var m = marks[i]
    for (var yy = m[1]; yy < m[1] + m[3]; yy++)
      rows[yy] = rows[yy].substr(0, m[0]) + new Array(m[2] + 1).join(m[4]) + rows[yy].substr(m[0] + m[2])
  }
  return lightGrid(rows)
}
function runsFor(type) {
  if (!_runs[type]) _runs[type] = gridRuns(fullRows(type))
  return _runs[type]
}

function rect(ctx, S, x, y, w, h, color) {
  ctx.fillStyle = color
  // A hair of overlap hides seams between neighbours at fractional scales.
  ctx.fillRect(x * S, y * S, w * S + 0.5, h * S + 0.5)
}

// ------------------------------------------------------------ face parts

// Eyes are 2x3 with a catch light; `ring` lifts them off a dark patch (panda).
// lookX/lookY nudge the pupil one pixel.
function drawEye(ctx, S, kind, x, y, lookX, lookY, tear, ring) {
  var lx = Math.round(lookX), ly = Math.round(lookY)
  var shine = "#ffffff", e = E()
  switch (kind) {
    case "closed":
      rect(ctx, S, x - 1, y + 1, 1, 1, e); rect(ctx, S, x, y + 2, 2, 1, e); rect(ctx, S, x + 2, y + 1, 1, 1, e); break
    case "sleepy":
      rect(ctx, S, x, y + 1, 2, 1, "rgba(43,36,51,0.35)")
      rect(ctx, S, x - 1, y + 2, 4, 1, e); break
    case "happy":
      rect(ctx, S, x - 1, y + 2, 1, 1, e)
      rect(ctx, S, x, y + 1, 2, 1, e)
      rect(ctx, S, x + 2, y + 2, 1, 1, e); break
    case "love":
      var lc = themed("love", "#ff5a86")
      rect(ctx, S, x - 1, y, 1, 1, lc); rect(ctx, S, x + 2, y, 1, 1, lc)
      rect(ctx, S, x - 1, y + 1, 4, 1, lc)
      rect(ctx, S, x, y + 2, 2, 1, lc)
      rect(ctx, S, x - 1, y, 1, 1, "rgba(255,255,255,0.5)"); break
    case "sad":
      if (ring) rect(ctx, S, x - 1 + lx, y + ly, 4, 4, themed("w", shine))
      rect(ctx, S, x + lx, y + 1 + ly, 2, 2, e)
      rect(ctx, S, x + lx, y + 1 + ly, 1, 1, shine)
      rect(ctx, S, x - 1, y - 1, 1, 1, "rgba(43,36,51,0.55)"); rect(ctx, S, x, y - 1, 1, 1, "rgba(43,36,51,0.55)"); rect(ctx, S, x + 1, y - 2, 2, 1, "rgba(43,36,51,0.55)")
      if (tear) rect(ctx, S, x, y + 3 + (tear % 3), 1, 1, "#8fd0ff")
      break
    case "wide":
      if (ring) rect(ctx, S, x - 2 + lx, y - 2 + ly, 6, 6, themed("w", shine))
      rect(ctx, S, x - 1 + lx, y - 1 + ly, 4, 4, e)
      rect(ctx, S, x - 1 + lx, y - 1 + ly, 2, 2, shine); rect(ctx, S, x + 2 + lx, y + 2 + ly, 1, 1, shine); break
    default: // open
      if (ring) rect(ctx, S, x - 1 + lx, y - 1 + ly, 4, 5, themed("w", shine))
      rect(ctx, S, x + lx, y + ly, 2, 3, e)
      rect(ctx, S, x + lx, y + ly, 1, 1, shine)
  }
}

function drawMouth(ctx, S, kind, mx, my, wide) {
  var c = (CUR && CUR.m) || "#5a3040"
  var half = wide ? 3 : 1
  if (kind === "smile" && !wide) half = 2
  switch (kind) {
    case "smile":
      rect(ctx, S, mx - 1 - half + 1, my, 1, 1, c)
      rect(ctx, S, mx - half + 1, my + 1, 2 + (half - 1) * 2, 1, c)
      rect(ctx, S, mx + 2 + half - 1, my, 1, 1, c); break
    case "open":
      rect(ctx, S, mx - half + 1, my, 2 + (half - 1) * 2, 2, c)
      rect(ctx, S, mx, my + 1, 2, 1, themed("p", "#ff8fa8")); break
    case "chew":
      rect(ctx, S, mx, my, 2, 1, c); break
    case "sad":
      rect(ctx, S, mx - half + 1, my + 1, 1, 1, c)
      rect(ctx, S, mx - half + 2, my, 2 + (half - 1) * 2 - 2 + 0, 1, c)
      rect(ctx, S, mx + half, my + 1, 1, 1, c); break
    case "oh":
      rect(ctx, S, mx, my, 2, 2, c); break
    case "flat":
      rect(ctx, S, mx - half + 1, my, 2 + (half - 1) * 2, 1, c); break
    case "tongue":
      rect(ctx, S, mx - 1, my, 4, 1, c); rect(ctx, S, mx + 1, my + 1, 2, 1, themed("p", "#ff8fa8")); break
    case "zzz": case "none": break
  }
}

function drawNose(ctx, S, face) {
  var n = face.nose
  if (!n) return
  var w = n.w || 2
  var x = 10 - w / 2
  // Pink noses take the palette's pink; the dragon's dots its outline colour.
  var c = n.c === "#ff8fa8" ? themed("p", n.c) : n.dots ? themed("o", n.c) : n.c
  rect(ctx, S, x, n.y, w, 1, c)
  if (n.dots) { rect(ctx, S, x - 1, n.y, 1, 1, c); rect(ctx, S, x + w, n.y, 1, 1, c) }
}

function drawBeak(ctx, S, open) {
  var bk = themed("a", "#ffb347"), bd = themed("aw", "#ff9a2e")
  rect(ctx, S, 8, 8, 4, 1, bk); rect(ctx, S, 9, 9, 2, 1, bd)
  if (open) rect(ctx, S, 9, 10, 2, 1, bd)
}

function drawCheeks(ctx, S, face, amount) {
  if (amount <= 0) return
  var a = Math.min(1, amount)
  var c = "rgba(" + ((CUR && CUR.cheek) || "255,120,150") + "," + (0.35 + 0.4 * a).toFixed(2) + ")"
  rect(ctx, S, face.cheeks[0], face.cheeks[1], 2, 1, c)
  rect(ctx, S, W - face.cheeks[0] - 2, face.cheeks[1], 2, 1, c)
}

// ------------------------------------------------------- tails and wings

// Tails are lists of squares: every one gets an outline first, then all of
// them are filled, so the chain reads as one outlined shape.
function chainDraw(ctx, S, segs, outline) {
  var i, q
  for (i = 0; i < segs.length; i++) { q = segs[i]; rect(ctx, S, Math.round(q[0]) - 1, Math.round(q[1]) - 1, q[2] + 2, q[3] + 2, outline) }
  for (i = 0; i < segs.length; i++) { q = segs[i]; rect(ctx, S, Math.round(q[0]), Math.round(q[1]), q[2], q[3], q[4]) }
}

// phase: radians; amp: pixels of side sway. Drawn behind the body, which sits
// on columns 3..16 from row 13 down, so tails start at its right edge.
function drawTail(ctx, S, type, stage, phase, amp) {
  var P = CUR || PALETTES[type]
  var i, k, segs = []
  var hi = colorOf(P, "h")
  switch (type) {
    case "cat": {
      var n = 9
      var curl = function (side) {
        for (i = 0; i < n; i++) {
          var t = i / (n - 1)
          var x = side > 0 ? 15.5 + i * 0.75 + Math.sin(phase - i * 0.5) * amp * t : 2.5 - i * 0.75 - Math.sin(phase + 1 - i * 0.5) * amp * t
          // The tip hooks over at the top.
          if (i >= n - 2) x += side * (i - n + 3) * 0.6
          segs.push([x, 14.5 - i * 0.95 - (i >= n - 2 ? 0.3 : 0), 2, 2, i >= n - 2 ? P.d : i % 3 === 1 ? P.d : P.b])
        }
      }
      curl(1)
      if (stage >= 3) curl(-1) // the mystic cat grows a second tail
      break
    }
    case "dog": {
      for (i = 0; i < 6; i++)
        segs.push([16 + i * 0.55 + Math.sin(phase) * amp * (i / 5) * 1.6, 14.5 - i * 1.05, 2, 2, i === 5 ? P.l : P.b])
      break
    }
    case "bunny": chainDraw(ctx, S, [[16, 14, 2, 2, P.w || P.l]], P.o); return
    case "panda": chainDraw(ctx, S, [[16, 14, 2, 2, P.k]], P.o); return
    case "fox": {
      var tails = stage >= 3 ? 3 : 1
      for (k = 0; k < tails; k++) {
        var spread = tails === 1 ? 0 : (k - 1)
        for (i = 0; i < 8; i++) {
          var f = i / 7
          var w = i === 0 ? 2 : (i > 1 && i < 6 ? 4 : 3)
          var x = 15.5 + i * 0.9 + spread * i * 0.55 + Math.sin(phase + k * 0.9 - i * 0.45) * amp * f
          var y = 13.5 - i * 0.95 - Math.abs(spread) * i * 0.2
          segs.push([x, y, w, 3, i >= 6 ? (P.w || "#fff4e6") : i === 2 || i === 3 ? hi : P.b])
        }
      }
      break
    }
    case "dragon": {
      for (i = 0; i < 8; i++) {
        var q = i / 7
        segs.push([15.5 + i * 0.95, 14.5 - i * 0.35 + Math.sin(phase - i * 0.55) * amp * q, 2, i < 3 ? 3 : 2, P.b])
      }
      var tip = segs[segs.length - 1]
      segs.push([tip[0] + 1, tip[1] - 1, 2, 3, P.a]) // spade tip
      break
    }
  }
  chainDraw(ctx, S, segs, P.o)
}

// Bat wings, drawn behind the body from its shoulders. The left wing is the
// grid; the right one mirrors it. `flap` -1..1 shears the far end up or down.
var WING_SMALL = [
  "oo...",
  "oaoo.",
  "oaaao",
  ".oaao",
  "..o.o"
]
var WING_BIG = [
  "oo.....",
  "oaoo...",
  "oaaaoo.",
  "oaaaaao",
  ".oaaaao",
  "..oaoao",
  "...o.o."
]
function drawWings(ctx, S, type, stage, flap) {
  if (type !== "dragon") return
  var P = CUR || PALETTES.dragon
  var g = stage >= 2 ? WING_BIG : WING_SMALL
  var gw = g[0].length
  for (var side = 0; side < 2; side++) {
    for (var r = 0; r < g.length; r++) for (var c = 0; c < gw; c++) {
      var ch = g[r].charAt(c)
      if (ch === ".") continue
      var dist = gw - 1 - c
      var dy = -Math.round(flap * dist * 0.7)
      var x = side === 0 ? 4 - gw + c : 15 + gw - 1 - c + 1
      var col = ch === "o" ? P.o : (r + c) % 3 === 0 ? (P.aw || P.a) : P.a
      rect(ctx, S, x, (stage >= 2 ? 9 : 11) + r + dy, 1, 1, col)
    }
  }
}

// Penguin flippers swing at the sides of the body, in front of it.
function drawFlippers(ctx, S, type, flap) {
  if (type !== "penguin") return
  var P = CUR || PALETTES.penguin
  var segs = []
  for (var side = 0; side < 2; side++) {
    var dir = side === 0 ? -1 : 1
    for (var i = 0; i < 5; i++) {
      var out = Math.max(0, flap) * i * 0.45
      var x = dir < 0 ? 2 - out : 17 + out
      segs.push([x, 10 + i - flap * 0.9 * (i / 4), 1, 1, i === 4 ? P.d : colorOf(P, "h")])
    }
  }
  chainDraw(ctx, S, segs, P.o)
}

// What an adult (stage 3) wears that the younger forms do not.
function drawAdultMark(ctx, S, type, t) {
  switch (type) {
    case "cat": rect(ctx, S, 9, 5, 2, 1, GOLD()); break
    case "dog": rect(ctx, S, 5, 13, 10, 1, themed("t", "#ff6b6b")); rect(ctx, S, 9, 14, 2, 1, GOLD()); break
    case "bunny": rect(ctx, S, 8, 5, 1, 2, GOLD()); rect(ctx, S, 11, 5, 1, 2, GOLD()); rect(ctx, S, 9, 6, 2, 1, GOLD()); break
    case "frog": rect(ctx, S, 7, 10, 6, 1, GOLD()); break
    case "panda": rect(ctx, S, 15, 4, 1, 3, themed("a", "#7fc97f")); rect(ctx, S, 16, 3, 2, 1, themed("a", "#7fc97f")); break
    case "fox": rect(ctx, S, 9, 6, 2, 1, GOLD()); break
    case "dragon": rect(ctx, S, 9, 5, 2, 1, GOLD()); break
    case "penguin": rect(ctx, S, 7, 11, 2, 3, GOLD()); rect(ctx, S, 11, 11, 2, 3, GOLD()); rect(ctx, S, 9, 12, 2, 1, GOLD()); break
  }
}

// ----------------------------------------------------------------- hats

var HAT_PAL = { o: "#4a3a66", a: "#ff7eb6", w: "#ffffff", y: "#ffd84d", c: "#7ad7f0", g: "#7fcf7a", b: "#6b5bd2", v: "#463c94", k: "#34323f", r: "#ff5a5a", p: "#ff9fc4" }
var HAT_ART = {
  party: ["..yy..", "..oo..", ".oaao.", ".owwo.", "oaaaao", "owwwwo"],
  bow: [".oo..oo.", "orroorro", ".oo..oo."],
  flower: ["..p..", ".pyp.", "..p..", ".ggg."],
  tophat: ["..kkkk..", "..kkkk..", "..rrrr..", "kkkkkkkk"],
  wizard: ["....bb....", "...bbbb...", "...bybb...", "..bbbbbb..", "..bbbbyb..", ".bbbbbbbb.", "vvvvvvvvvv"],
  halo: [".yyyyyy.", "y......y", ".yyyyyy."],
  crown: ["y..yy..y", "yyyyyyyy", "yyryyryy", "oooooooo"]
}

function drawHat(ctx, S, type, hat, bob) {
  var face = FACES[type]
  var y0, x0, rows, r, c, ch, color
  if (hat === "glasses") {
    var ex = [face.eyes, face.eyeR]
    for (var e = 0; e < 2; e++) {
      rect(ctx, S, ex[e][0] - 1, ex[e][1] - 1, 4, 4, HP().k)
      rect(ctx, S, ex[e][0], ex[e][1], 1, 1, "rgba(255,255,255,0.6)")
    }
    rect(ctx, S, face.eyes[0] + 3, face.eyes[1], face.eyeR[0] - face.eyes[0] - 4, 1, HP().k)
    return
  }
  if (hat === "phones") {
    var hw = face.head.hw, cy = face.head.cupY, top = face.hat
    var left = 10 - hw - 1, right = 10 + hw - 1
    rect(ctx, S, left, cy - 1, 2, 4, HP().a); rect(ctx, S, right, cy - 1, 2, 4, HP().a)
    rect(ctx, S, left, cy - 1, 2, 1, HP().p); rect(ctx, S, right, cy - 1, 2, 1, HP().p)
    for (var i = 0; i < 4; i++) {
      var yy = top - 1 + Math.round(i * (cy - top) / 3)
      var inset = Math.max(0, 3 - i)
      rect(ctx, S, left + 1 - 0 + (i === 0 ? 3 : i === 1 ? 1 : 0), yy, 1, 1, HP().o)
      rect(ctx, S, right + (i === 0 ? -2 : i === 1 ? 0 : 0), yy, 1, 1, HP().o)
    }
    rect(ctx, S, left + 4, top - 2, right - left - 3, 1, HP().o)
    return
  }
  rows = HAT_ART[hat]
  if (!rows) return
  var w = rows[0].length
  x0 = 10 - w / 2 + face.hatDx
  y0 = face.hat - rows.length + 1 + (hat === "halo" ? -2 + (bob || 0) : 0)
  for (r = 0; r < rows.length; r++) {
    for (c = 0; c < w; c++) {
      ch = rows[r].charAt(c)
      if (ch === ".") continue
      color = HP()[ch]
      rect(ctx, S, x0 + c, y0 + r, 1, 1, color)
    }
  }
}

// ----------------------------------------------------------- whole pet

// o: { type, S, stage, tailPhase, tailAmp, wing, eyes, lookX, lookY, tear,
//      mouth, blush, hat, hatBob }
// The caller has already moved the origin to the pet's feet and scaled it.
function drawPet(ctx, o) {
  var S = o.S
  CUR = o.pal || PALETTES[o.type]
  var P = CUR
  var face = FACES[o.type]
  ctx.save()
  ctx.translate(-W * S / 2, -H * S)
  // While walking the body is raised by up to two rows and the feet fill the gap.
  var lift = o.gaitAmt ? Math.round(Math.min(1, o.gaitAmt) * 2) : 0
  if (lift > 0) drawFeet(ctx, S, o.type, lift, o.gait || 0, !!o.gaitSync)
  ctx.save()
  ctx.translate(0, -lift * S)
  drawTail(ctx, S, o.type, o.stage, o.tailPhase || 0, o.tailAmp || 0)
  drawWings(ctx, S, o.type, o.stage, o.wing || 0)
  var runs = runsFor(o.type)
  for (var i = 0; i < runs.length; i++) {
    var r = runs[i]
    rect(ctx, S, r.x, r.y, r.w, 1, colorOf(P, r.c))
  }
  if (o.stage >= 3) drawAdultMark(ctx, S, o.type)
  drawCheeks(ctx, S, face, o.blush || 0)
  drawNose(ctx, S, face)
  if (face.beak) drawBeak(ctx, S, o.mouth === "open")
  var eyes = o.eyes || "open"
  drawEye(ctx, S, eyes, face.eyes[0], face.eyes[1], o.lookX || 0, o.lookY || 0, o.tear, face.lightEyes)
  drawEye(ctx, S, eyes, face.eyeR[0], face.eyeR[1], o.lookX || 0, o.lookY || 0, o.tear, face.lightEyes)
  if (!face.beak) drawMouth(ctx, S, o.mouth || "smile", face.mouth[0], face.mouth[1], !!face.wideMouth)
  drawFlippers(ctx, S, o.type, o.wing || 0)
  if (o.hat && o.hat !== "none") drawHat(ctx, S, o.type, o.hat, o.hatBob || 0)
  ctx.restore()
  ctx.restore()
}

// Two boots under the raised body. `phase` is the stride in radians: feet swap
// every half turn, the lifted one rises a row and swings forward. With `sync`
// both feet tuck together (hoppers).
var FOOT_FILL = { panda: "k", fox: "d", dragon: "d", penguin: "a" }

function drawFeet(ctx, S, type, lift, phase, sync) {
  var P = CUR || PALETTES[type]
  var fill = P[FOOT_FILL[type] || "b"]
  for (var side = 0; side < 2; side++) {
    var s = sync ? Math.sin(phase) : Math.sin(phase + side * Math.PI)
    var up = s > 0.3 && lift > 1
    var swing = sync ? 0 : Math.round(Math.cos(phase + side * Math.PI))
    var x = (side === 0 ? 4 : 12) + swing
    var y = H - lift
    var h = up ? lift - 1 : lift
    if (h < 1) continue
    rect(ctx, S, x, y, 4, h, P.o)
    rect(ctx, S, x + 1, y, 2, 1, fill)
  }
}

// ------------------------------------------------------------- particles

var HEART = [".xx.xx.", "xxxxxxx", "xxxxxxx", ".xxxxx.", "..xxx..", "...x..."]
var STAR = ["..x..", "..x..", "xxxxx", "..x..", "..x.."]
var POOP = ["...xx...", "..xxxx..", ".xxxxxx.", "xxxxxxxx", "xxxxxxxx"]

function drawBitmap(ctx, rows, x, y, S, color) {
  ctx.fillStyle = color
  for (var r = 0; r < rows.length; r++)
    for (var c = 0; c < rows[r].length; c++)
      if (rows[r].charAt(c) === "x") ctx.fillRect(Math.round(x + c * S), Math.round(y + r * S), S + 0.5, S + 0.5)
}
function drawHeart(ctx, x, y, S, color) { drawBitmap(ctx, HEART, x - 3.5 * S, y - 3 * S, S, color || "#ff6b9a") }
function drawStar(ctx, x, y, S, color) { drawBitmap(ctx, STAR, x - 2.5 * S, y - 2.5 * S, S, color || "#ffd84d") }
function drawPoop(ctx, x, y, S) {
  var ox = x - 4 * S, oy = y - 5 * S
  drawBitmap(ctx, POOP, ox, oy, S, "#9c6b3f")
  ctx.fillStyle = "#c8915a"; ctx.fillRect(ox + 2 * S, oy + S, S, S)
  ctx.fillStyle = "#ffffff"; ctx.fillRect(ox + 2 * S, oy + 3 * S, S, S); ctx.fillRect(ox + 5 * S, oy + 3 * S, S, S)
  ctx.fillStyle = "#2b2433"; ctx.fillRect(ox + 2 * S, oy + 3.5 * S, S, S * 0.6); ctx.fillRect(ox + 5 * S, oy + 3.5 * S, S, S * 0.6)
}

// ------------------------------------------------------------------ egg

var EGG_HALF = [
  "....oo", "...obb", "..obbb", "..obbs", ".obbbb", ".obbbb", "obbbbb", "obbbbb",
  "obssbb", "obbbbb", "obbbss", "obbbbb", ".obbbb", "..oobb", "....oo"
]
var EGG_W = 12
var EGG_H = 15
// Cracks appear one step per tap; each entry is [x, y] in egg pixels.
var EGG_CRACKS = [[5, 4], [6, 5], [5, 6], [6, 7], [4, 8], [7, 8], [3, 9], [8, 9], [5, 10]]

// Origin at the bottom centre, like drawPet. `taps` 0..5 widens the cracks.
function drawEgg(ctx, S, spotColor, taps, eggPal) {
  ctx.save()
  ctx.translate(-EGG_W * S / 2, -EGG_H * S)
  var pal = { o: (eggPal && eggPal.o) || "#b89a7a", b: (eggPal && eggPal.b) || "#fff6e6", s: spotColor }
  for (var y = 0; y < EGG_H; y++) {
    var left = EGG_HALF[y]
    var row = left + left.split("").reverse().join("")
    for (var x = 0; x < EGG_W; x++) {
      var ch = row.charAt(x)
      if (ch !== ".") rect(ctx, S, x, y, 1, 1, pal[ch])
    }
  }
  var n = Math.min(EGG_CRACKS.length, taps * 2)
  for (var i = 0; i < n; i++) rect(ctx, S, EGG_CRACKS[i][0], EGG_CRACKS[i][1], 1, 1, (eggPal && eggPal.k) || "#7a5a3a")
  ctx.restore()
}
