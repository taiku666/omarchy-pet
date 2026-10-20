// Pixel art for the pets. Every pet is a 20x18 grid drawn from its left half
// (10 columns) mirrored across the middle, so the art stays symmetrical and
// each pet is only 18 short strings. Faces, tails, wings and hats are drawn on
// top in code so they can animate.
//
// Palette keys: o outline, b body, l light belly, d shade, p pink, a accent,
// w white, k dark. A '.' is transparent.

var W = 20
var H = 18

var HALVES = {
  cat: [
    "..........",
    ".oo.......",
    ".obo......",
    ".obpo.....",
    ".obppooooo",
    ".obbbdbbdb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbbbbb",
    "obbbllllll",
    "obbbllllll",
    "obbbllllll",
    ".obbbbbbbo",
    ".ooooooooo"
  ],
  dog: [
    "..........",
    "..........",
    "...ooooooo",
    "..obbbbbbb",
    ".obbbbbbbb",
    "oddbbbbbbb",
    "oddbbbbbbb",
    "oddbbbbbbb",
    "oddbbbbbbb",
    ".odbbbllll",
    ".obbbbllll",
    ".obbbbllll",
    "..obbbbbbb",
    ".obbbbllll",
    "obbbbbllll",
    "obbbbbllll",
    ".obbbbbbbo",
    ".ooooooooo"
  ],
  bunny: [
    "...ooo....",
    "..obbbo...",
    "..obpbo...",
    "..obpbo...",
    "..obpbo...",
    "..obpbo...",
    "..obbbbooo",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbllll",
    ".obbblllll",
    ".obbblllll",
    "..obbbbbbo",
    "..oooooooo"
  ],
  frog: [
    "..........",
    "..oooo....",
    ".obbbbo...",
    ".obbbbbooo",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obblllllll",
    "obblllllll",
    "obblllllll",
    ".obbllllll",
    "oobbbbbbbb",
    ".ooooooooo"
  ],
  panda: [
    "..........",
    ".ooo......",
    "okkko.....",
    "okkkoooooo",
    "okkkbbbbbb",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbkkkkbbb",
    "obbkkkkbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbbbbb",
    "okkkbbbbbb",
    "okkkbbbbbb",
    "okkkbbbbbb",
    ".okkkbbbbb",
    ".okkkbbbbo",
    ".ooooooooo"
  ],
  fox: [
    ".o........",
    ".oo.......",
    ".odo......",
    ".obbo.....",
    ".obbbooooo",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbwwwwwww",
    ".obwwwwwww",
    ".obbwwwwww",
    ".obbbbwwww",
    "obbbbwwwww",
    "obbbbwwwww",
    "obbbbwwwww",
    ".obbbbbbbo",
    ".ooooooooo"
  ],
  dragon: [
    "..a.......",
    ".oao....aa",
    ".obboooooo",
    ".obbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    "obbbbbbbbb",
    ".obbbbbbbb",
    ".oblllllll",
    "obllllllll",
    "obllllllll",
    "obllllllll",
    ".oblllllll",
    ".obbbbbbbo",
    ".ooooooooo"
  ],
  penguin: [
    "...ooooooo",
    "..okkkkkkk",
    ".okkkkkkkk",
    "okkkkkkkkk",
    "okkkkkkkkk",
    "okkkkkkkkk",
    "okkwwwwwww",
    "okwwwwwwww",
    "okwwwwwwww",
    "okkwwwwwww",
    "okkwwwwwww",
    "okkwwwwwww",
    "okkwwwwwww",
    "okkwwwwwww",
    ".okwwwwwww",
    ".okkwwwwww",
    ".okkwwwwwo",
    ".oaaaaa..."
  ]
}

var PALETTES = {
  cat:     { o: "#8a4b2a", b: "#f2a65a", l: "#ffe6bf", d: "#d9823b", p: "#ffb3c1", a: "#d9823b", w: "#fff6e8", k: "#4a2c1a" },
  dog:     { o: "#6b4429", b: "#d9a066", l: "#f9e4c4", d: "#9c6b3f", p: "#ffb3c1", a: "#9c6b3f", w: "#fff6e8", k: "#3d2616" },
  bunny:   { o: "#a58b9b", b: "#fdf6f0", l: "#ffffff", d: "#e3d3dc", p: "#ffb8cc", a: "#ffb8cc", w: "#ffffff", k: "#6a5560" },
  frog:    { o: "#3f7d4e", b: "#8fd694", l: "#dff7cf", d: "#5fb06b", p: "#ffb3b3", a: "#ffd966", w: "#ffffff", k: "#2e5a39" },
  panda:   { o: "#3a3a44", b: "#f7f4ee", l: "#ffffff", d: "#cfcac2", p: "#ffb3c1", a: "#7fc97f", w: "#ffffff", k: "#3a3a46" },
  fox:     { o: "#9a4a1f", b: "#f58a3f", l: "#fff2e0", d: "#6b2f14", p: "#ffb3c1", a: "#6b2f14", w: "#fff4e6", k: "#4a2210" },
  dragon:  { o: "#2e7a73", b: "#7fd6c4", l: "#fff0c2", d: "#4fb3a2", p: "#ffb3b3", a: "#ff9e7a", w: "#ffffff", k: "#1f5650" },
  penguin: { o: "#262b42", b: "#3b4263", l: "#fbfbff", d: "#2c3250", p: "#ffb3c1", a: "#ffb347", w: "#fbfbff", k: "#3b4263" }
}

// Face anchors in grid pixels: eyes are 2x2 at (x, y), the mouth is centred on
// (mx, my), the nose sits above it. Head metrics place hats and headphones.
var FACES = {
  cat:     { eyes: [5, 7],  eyeR: [13, 7],  mouth: [9, 10], nose: { y: 9,  c: "#ff8fa8" }, cheeks: [3, 9],  hat: 4, head: { hw: 9, cupY: 8 }, hatDx: 0 },
  dog:     { eyes: [5, 6],  eyeR: [13, 6],  mouth: [9, 11], nose: { y: 9,  c: "#2b2433", w: 3 }, cheeks: [3, 9],  hat: 3, head: { hw: 9, cupY: 7 }, hatDx: 0 },
  bunny:   { eyes: [5, 9],  eyeR: [13, 9],  mouth: [9, 12], nose: { y: 11, c: "#ff8fa8" }, cheeks: [3, 11], hat: 6, head: { hw: 9, cupY: 10 }, hatDx: 0 },
  frog:    { eyes: [3, 2],  eyeR: [15, 2],  mouth: [9, 9],  nose: null,                        cheeks: [2, 8],  hat: 3, head: { hw: 9, cupY: 7 }, hatDx: 0, wideMouth: true },
  panda:   { eyes: [5, 7],  eyeR: [13, 7],  mouth: [9, 10], nose: { y: 9,  c: "#2b2433", w: 2 }, cheeks: [3, 10], hat: 3, head: { hw: 9, cupY: 8 }, hatDx: 0 },
  fox:     { eyes: [4, 7],  eyeR: [14, 7],  mouth: [9, 11], nose: { y: 9,  c: "#2b2433", w: 2 }, cheeks: [4, 10], hat: 4, head: { hw: 9, cupY: 8 }, hatDx: 0 },
  dragon:  { eyes: [5, 6],  eyeR: [13, 6],  mouth: [9, 9],  nose: { y: 8,  c: "#2e7a73", w: 4, dots: true }, cheeks: [3, 8], hat: 2, head: { hw: 9, cupY: 7 }, hatDx: 0 },
  penguin: { eyes: [5, 7],  eyeR: [13, 7],  mouth: [9, 10], nose: null,                        cheeks: [3, 9],  hat: 1, head: { hw: 9, cupY: 7 }, hatDx: 0, beak: true }
}

var EYE = "#2b2433"

// The palette of the pet being drawn. drawPet sets it so every helper below
// paints in the same (theme-derived) colours without threading it through.
var CUR = null
function E() { return (CUR && CUR.e) || EYE }
function HP() { return (CUR && CUR.hat) || HAT_PAL }
function GOLD() { return (CUR && CUR.gold) || "#ffd966" }

// ---------------------------------------------------------------- runs

var _runs = {}

// Expand the left half to the full row and merge neighbours of the same colour
// into rectangles so a frame costs ~100 fillRects instead of 360.
function runsFor(type) {
  if (_runs[type]) return _runs[type]
  var out = []
  var half = HALVES[type]
  for (var y = 0; y < H; y++) {
    var left = half[y]
    var row = left + left.split("").reverse().join("")
    var x = 0
    while (x < W) {
      var c = row.charAt(x)
      var x2 = x
      while (x2 < W && row.charAt(x2) === c) x2++
      if (c !== ".") out.push({ x: x, y: y, w: x2 - x, c: c })
      x = x2
    }
  }
  _runs[type] = out
  return out
}

function rect(ctx, S, x, y, w, h, color) {
  ctx.fillStyle = color
  // A hair of overlap hides seams between neighbours at fractional scales.
  ctx.fillRect(x * S, y * S, w * S + 0.5, h * S + 0.5)
}

// ------------------------------------------------------------ face parts

function drawEye(ctx, S, kind, x, y, lookX, lookY, tear) {
  var lx = Math.round(lookX), ly = Math.round(lookY)
  switch (kind) {
    case "closed":
      rect(ctx, S, x, y + 1, 2, 1, E()); break
    case "sleepy":
      rect(ctx, S, x, y + 1, 2, 1, E())
      rect(ctx, S, x, y, 2, 1, "rgba(43,36,51,0.35)"); break
    case "happy":
      rect(ctx, S, x - 1, y + 1, 1, 1, E())
      rect(ctx, S, x, y, 2, 1, E())
      rect(ctx, S, x + 2, y + 1, 1, 1, E()); break
    case "love":
      rect(ctx, S, x - 1, y, 1, 1, "#ff5a86"); rect(ctx, S, x + 1, y, 2, 1, "#ff5a86")
      rect(ctx, S, x - 1, y + 1, 4, 1, "#ff5a86")
      rect(ctx, S, x, y + 2, 2, 1, "#ff5a86"); break
    case "sad":
      rect(ctx, S, x + lx, y + ly, 2, 2, E())
      rect(ctx, S, x + lx, y + ly, 1, 1, "#ffffff")
      rect(ctx, S, x - 1, y - 1, 3, 1, "rgba(43,36,51,0.55)")
      if (tear) rect(ctx, S, x + 1, y + 2 + (tear % 3), 1, 1, "#8fd0ff")
      break
    case "wide":
      rect(ctx, S, x - 1 + lx, y - 1 + ly, 4, 4, E())
      rect(ctx, S, x + lx, y - 1 + ly, 1, 1, "#ffffff"); rect(ctx, S, x + 2 + lx, y + 1 + ly, 1, 1, "#ffffff"); break
    default: // open
      rect(ctx, S, x + lx, y + ly, 2, 2, E())
      rect(ctx, S, x + lx, y + ly, 1, 1, "#ffffff")
  }
}

function drawMouth(ctx, S, kind, mx, my, wide) {
  var c = (CUR && CUR.m) || "#5a3040"
  var half = wide ? 3 : 1
  switch (kind) {
    case "smile":
      rect(ctx, S, mx - 1 - half + 1, my, 1, 1, c)
      rect(ctx, S, mx - half + 1, my + 1, 2 + (half - 1) * 2, 1, c)
      rect(ctx, S, mx + 2 + half - 1, my, 1, 1, c); break
    case "open":
      rect(ctx, S, mx - half + 1, my, 2 + (half - 1) * 2, 2, c)
      rect(ctx, S, mx, my + 1, 2, 1, "#ff8fa8"); break
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
      rect(ctx, S, mx - 1, my, 4, 1, c); rect(ctx, S, mx + 1, my + 1, 2, 1, "#ff8fa8"); break
    case "zzz": case "none": break
  }
}

function drawNose(ctx, S, face) {
  var n = face.nose
  if (!n) return
  var w = n.w || 2
  var x = 10 - w / 2
  rect(ctx, S, x, n.y, w, 1, n.c)
  if (n.dots) { rect(ctx, S, x - 1, n.y, 1, 1, n.c); rect(ctx, S, x + w, n.y, 1, 1, n.c) }
}

function drawBeak(ctx, S, open) {
  rect(ctx, S, 8, 8, 4, 1, "#ffb347"); rect(ctx, S, 9, 9, 2, 1, "#ff9a2e")
  if (open) rect(ctx, S, 9, 10, 2, 1, "#ff9a2e")
}

function drawCheeks(ctx, S, face, amount) {
  if (amount <= 0) return
  var a = Math.min(1, amount)
  var c = "rgba(" + ((CUR && CUR.cheek) || "255,120,150") + "," + (0.35 + 0.4 * a).toFixed(2) + ")"
  rect(ctx, S, face.cheeks[0], face.cheeks[1], 2, 1, c)
  rect(ctx, S, W - face.cheeks[0] - 2, face.cheeks[1], 2, 1, c)
}

// ------------------------------------------------------- tails and wings

function seg(ctx, S, x, y, w, h, color) { rect(ctx, S, Math.round(x), Math.round(y), w, h, color) }

// phase: radians; amp: pixels of side sway. Drawn behind the body.
function drawTail(ctx, S, type, stage, phase, amp) {
  var P = CUR || PALETTES[type]
  var i, k
  switch (type) {
    case "cat": {
      var n = 9
      for (i = 0; i < n; i++) {
        var t = i / (n - 1)
        seg(ctx, S, 18 + i * 0.8 + Math.sin(phase - i * 0.5) * amp * t, 15 - i * 0.9, 2, 2, i > n - 3 ? P.d : P.b)
      }
      if (stage >= 3) for (i = 0; i < n; i++) { // the mystic cat grows a second tail
        var u = i / (n - 1)
        seg(ctx, S, -0.8 - i * 0.7 - Math.sin(phase + 1 - i * 0.5) * amp * u, 15 - i * 0.9, 2, 2, i > n - 3 ? P.d : P.b)
      }
      break
    }
    case "dog": {
      for (i = 0; i < 5; i++)
        seg(ctx, S, 19 + i * 0.5 + Math.sin(phase) * amp * (i / 4) * 1.6, 14 - i * 1.1, 2, 2, P.d)
      break
    }
    case "bunny": rect(ctx, S, 18.5, 14.5, 3, 3, "#ffffff"); rect(ctx, S, 18.5, 16, 3, 1, "#ece0e6"); break
    case "panda": rect(ctx, S, 19, 15, 2, 2, P.k); break
    case "fox": {
      var tails = stage >= 3 ? 3 : 1
      for (k = 0; k < tails; k++) {
        var spread = tails === 1 ? 0 : (k - 1)
        for (i = 0; i < 8; i++) {
          var f = i / 7
          var w = 3 + (i > 1 && i < 6 ? 1 : 0)
          var x = 18 + i * 0.9 + spread * i * 0.55 + Math.sin(phase + k * 0.9 - i * 0.45) * amp * f
          var y = 14 - i * 0.9 - Math.abs(spread) * i * 0.2
          seg(ctx, S, x, y, w, 3, i >= 6 ? "#fff4e6" : P.b)
          if (i === 0) seg(ctx, S, x, y + 3, w, 1, P.o)
        }
      }
      break
    }
    case "dragon": {
      for (i = 0; i < 8; i++) {
        var q = i / 7
        seg(ctx, S, 18 + i * 0.9, 15 - i * 0.2 + Math.sin(phase - i * 0.55) * amp * q, 2, i === 7 ? 3 : 2, i === 7 ? P.a : P.b)
      }
      break
    }
  }
}

// flap: -1..1. Wings sit behind the body on both sides.
function drawWings(ctx, S, type, stage, flap) {
  if (type !== "dragon") return
  var P = CUR || PALETTES.dragon
  var size = 3 + stage
  for (var side = 0; side < 2; side++) {
    var dir = side === 0 ? -1 : 1
    for (var r = 0; r < size + 2; r++) {
      var w = Math.max(1, size - Math.abs(r - 1) + 1)
      var lift = flap * (size - r * 0.4) * 0.9
      var x = dir < 0 ? 1.5 - w : 18.5
      seg(ctx, S, x - (dir < 0 ? lift * 0.3 : -lift * 0.3), 6 + r - lift * 0.6, w, 1, r % 2 ? P.a : "#ffb59a")
    }
  }
}

// Penguin flippers swing in front of the body.
function drawFlippers(ctx, S, type, flap) {
  if (type !== "penguin") return
  var P = CUR || PALETTES.penguin
  for (var side = 0; side < 2; side++) {
    var dir = side === 0 ? -1 : 1
    for (var i = 0; i < 6; i++) {
      var x = dir < 0 ? 0.5 - Math.abs(flap) * i * 0.35 : 18.5 + Math.abs(flap) * i * 0.35
      seg(ctx, S, x, 9 + i - flap * 0.8, 1.5, 1, P.o)
      seg(ctx, S, x + 0.5, 9 + i - flap * 0.8, 1, 1, P.d)
    }
  }
}

// What an adult (stage 3) wears that the younger forms do not.
function drawAdultMark(ctx, S, type, t) {
  switch (type) {
    case "cat": rect(ctx, S, 9, 5, 2, 1, GOLD()); break
    case "dog": rect(ctx, S, 4, 14, 12, 2, "#ff6b6b"); rect(ctx, S, 3, 14, 1, 2, "#c94b4b"); rect(ctx, S, 16, 14, 1, 2, "#c94b4b"); break
    case "bunny": rect(ctx, S, 9, 7, 2, 1, GOLD()); rect(ctx, S, 8, 8, 1, 1, GOLD()); break
    case "frog": rect(ctx, S, 7, 10, 6, 1, GOLD()); break
    case "panda": rect(ctx, S, 15, 4, 1, 3, "#7fc97f"); rect(ctx, S, 16, 3, 2, 1, "#7fc97f"); break
    case "fox": rect(ctx, S, 9, 6, 2, 1, GOLD()); break
    case "dragon": rect(ctx, S, 9, 5, 2, 1, GOLD()); break
    case "penguin": rect(ctx, S, 4, 8, 2, 2, GOLD()); rect(ctx, S, 14, 8, 2, 2, GOLD()); break
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
      rect(ctx, S, ex[e][0] - 1, ex[e][1] - 1, 4, 3, HP().k)
      rect(ctx, S, ex[e][0], ex[e][1] - 1, 1, 1, HP().o)
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
  drawTail(ctx, S, o.type, o.stage, o.tailPhase || 0, o.tailAmp || 0)
  drawWings(ctx, S, o.type, o.stage, o.wing || 0)
  var runs = runsFor(o.type)
  for (var i = 0; i < runs.length; i++) {
    var r = runs[i]
    rect(ctx, S, r.x, r.y, r.w, 1, P[r.c])
  }
  if (o.stage >= 3) drawAdultMark(ctx, S, o.type)
  drawCheeks(ctx, S, face, o.blush || 0)
  drawNose(ctx, S, face)
  if (face.beak) drawBeak(ctx, S, o.mouth === "open")
  var eyes = o.eyes || "open"
  drawEye(ctx, S, eyes, face.eyes[0], face.eyes[1], o.lookX || 0, o.lookY || 0, o.tear)
  drawEye(ctx, S, eyes, face.eyeR[0], face.eyeR[1], o.lookX || 0, o.lookY || 0, o.tear)
  if (!face.beak) drawMouth(ctx, S, o.mouth || "smile", face.mouth[0], face.mouth[1], !!face.wideMouth)
  drawFlippers(ctx, S, o.type, o.wing || 0)
  if (o.hat && o.hat !== "none") drawHat(ctx, S, o.type, o.hat, o.hatBob || 0)
  ctx.restore()
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
