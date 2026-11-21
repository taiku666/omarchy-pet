// Side-view pets for the walk cycle on the bar. The front-view art in
// Sprites.js stays for standing, sleeping and the care card; while a pet walks
// it turns into profile (facing right, mirrored by the caller).
//
// Each body is a hand-typed grid of fills; the outline and the light (a
// highlight along the top, shade along the bottom) come from code. Legs are
// hinged at fixed hips: the foot swings and lifts, the leg bends between hip
// and foot, so the legs never come loose from the body. Tails and the dragon's
// wing are drawn separately so they can move. Palette keys are the ones in
// Sprites.js: o outline, b body, h highlight, l light, d shade, p pink,
// a accent, w white, k dark.
//
// Everything that needs Sprites.js (eyes, palette) comes in through `o.lib`, so
// this file also loads on its own in node for the tests and the preview sheet.

var SW = 24
var SH = 18
// The row under the feet: feet are filled down to GROUND - 1, their outline
// sits on GROUND.
var GROUND = 17

// art: rows of fills (24 wide, up to 18 tall, '.' empty), facing right.
// legs: hip x of the back and front pair, hip row (the body's bottom outline),
//       width, fill key, toe key; `biped` draws one far and one near leg,
//       `reach` shortens the step (penguins shuffle).
// tail: chain from an anchor (see chain()). face: eye (2x3), nose pixel,
// mouth anchor, cheek. hat: where hats sit. mark: what the adult wears.
var SIDE = {
  cat: {
    art: [
      "........................",
      "...............b...b....",
      "..............bpb.bpb...",
      "..............bbbbbbb...",
      ".............bbbbbbbbb..",
      ".............bbbbbbbbbb.",
      ".....bdbbdbbbbbbbbbbbbb.",
      "....bbbbbbbbbbbbbbbbbll.",
      "....bbbbbbbbbbbbbbbbbl..",
      "....bbbbbbbbbbbbbbbbb...",
      "....bbbbbbbbbbbbbbbb....",
      ".....bbllllllllllbb....."
    ],
    legs: { back: 6, front: 15, top: 12, w: 2, fill: "b", toe: "w" },
    tail: { ax: 4, ay: 7, len: 9, base: 60, curl: -55, t0: 2, t1: 2, c: "b", tipC: "d", tip: 2 },
    face: { eye: [18, 5], nose: [22, 7, "p"], mouth: [20, 9], cheek: [17, 8] },
    gait: "walk", hat: { x: 14, y: 3, w: 8 }, mark: [16, 3, 3, 1]
  },
  dog: {
    art: [
      "........................",
      "........................",
      "..............bbbbb.....",
      ".............bbbbbbb....",
      "............bbbbbbbbb...",
      "............ddbbbbbbbll.",
      "....bbbbbbbbdddbbbbllll.",
      "...bbbbbbbbbdddbbbbllll.",
      "...bbbbbbbbbbddbbbbbb...",
      "...bbbbbbbbbbbdbbbbb....",
      "...bbbbbbbbbbbbbbbb.....",
      "....bblllllllllbb......."
    ],
    legs: { back: 5, front: 14, top: 12, w: 2, fill: "b", toe: "l" },
    tail: { ax: 3, ay: 7, len: 6, base: 55, curl: -25, t0: 2, t1: 2, c: "b", tipC: "l", tip: 1 },
    face: { eye: [16, 4], nose: [22, 5, "k"], mouth: [20, 8], cheek: [17, 7] },
    gait: "trot", hat: { x: 13, y: 2, w: 7 }, mark: [11, 9, 4, 2]
  },
  bunny: {
    art: [
      "........................",
      ".............bb..bb.....",
      ".............bpbbpb.....",
      ".............bpbbpb.....",
      "..............bbbpb.....",
      "..............bbbbbb....",
      ".............bbbbbbbb...",
      "......bbbbbbbbbbbbbbbb..",
      "....bbbbbbbbbbbbbbbbbl..",
      "...bbbbbbbbbbbbbbbbbl...",
      "...bbbbbbbbbbbbbbbbb....",
      "...bbbbbbbbbbbbbbbb.....",
      "....bbbbllllllllb......."
    ],
    legs: { back: 5, front: 15, top: 13, w: 3, fill: "b", toe: "l", frontW: 2 },
    tail: { ax: 3, ay: 8, len: 1, base: 10, curl: 0, t0: 3, t1: 3, c: "w" },
    face: { eye: [18, 6], nose: [21, 8, "p"], mouth: [20, 10], cheek: [17, 9] },
    gait: "bound", hat: { x: 13, y: 5, w: 7 }, mark: [16, 5, 2, 1]
  },
  frog: {
    art: [
      "........................",
      "........................",
      "........................",
      "........................",
      "...............bbb......",
      "..............bbbbb.....",
      "..............bbbbbb....",
      "......bbbbbbbbbbbbbbbb..",
      "....bbbbbbbbbbbbbbbbbbb.",
      "...bbbbdbbbdbbbbbbbbbbb.",
      "...bbbbbbbbbbbbbllllll..",
      "...ddddbbbbbbllllllll...",
      "...ddddbllllllllll......"
    ],
    legs: { back: 4, front: 16, top: 13, w: 3, fill: "b", toe: "l", frontW: 2 },
    tail: null,
    face: { eye: [16, 4], nose: null, mouth: [17, 10], cheek: [19, 9], wide: true },
    gait: "hop", hat: { x: 14, y: 4, w: 6 }, mark: [8, 11, 7, 1]
  },
  panda: {
    art: [
      "........................",
      "...............kk..kk...",
      "..............kkbbbkk...",
      "..............bbbbbbbb..",
      ".............bbkkbbbbbb.",
      ".............bkkkbbbbbb.",
      "....bbbbbbbkkbkkbbbbbll.",
      "...bbbbbbbkkkbbbbbbbbl..",
      "...bbbbbbbkkkbbbbbbbb...",
      "...bbbbbbbkkkbbbbbbb....",
      "...bbbbbbbkkkkbbbbb.....",
      "....bbbbbbkkkkbbb......."
    ],
    legs: { back: 5, front: 13, top: 12, w: 3, fill: "k", toe: "k" },
    tail: { ax: 3, ay: 7, len: 1, base: 20, curl: 0, t0: 2, t1: 2, c: "k" },
    face: { eye: [15, 4], nose: [22, 6, "k"], mouth: [20, 8], cheek: [19, 8] },
    gait: "amble", hat: { x: 14, y: 2, w: 8 }, mark: [18, 1, 3, 2]
  },
  fox: {
    art: [
      "........................",
      "..............kb..kb....",
      "..............bkb.bkb...",
      "..............bbbbbbb...",
      ".............bbbbbbbbb..",
      ".............bbbbbbbbbb.",
      ".....bbbbbbbbbbbbbbwwww.",
      "....bbbbbbbbbbbbbwwww...",
      "....bbbbbbbbbbbbwwww....",
      "....bbbbbbbbbbbbwwb.....",
      "....bbbbbbbbbbbbbb......",
      ".....bbwwwwwwwwbb......."
    ],
    legs: { back: 6, front: 15, top: 12, w: 2, fill: "k", toe: "k" },
    tail: { ax: 4, ay: 8, len: 10, base: 22, curl: 22, t0: 2, t1: 4, c: "b", tipC: "w", tip: 3 },
    face: { eye: [18, 4], nose: [22, 6, "k"], mouth: [20, 8], cheek: [16, 7] },
    gait: "trot", hat: { x: 14, y: 3, w: 7 }, mark: [16, 3, 2, 1]
  },
  dragon: {
    art: [
      "........................",
      "..............aa.aa.....",
      "..............bbbbbb....",
      ".............bbbbbbbb...",
      "......a..a..abbbbbbbbb..",
      ".....bbbbbbbbbbbbbbbbbb.",
      "....bbbbbbbbbbbbbbbbbbb.",
      "....bbbbbbbbbbbbbbbbbb..",
      "....bbbbbbbbbbbbbbbbb...",
      "....bbbbbbbbbbbbbbbb....",
      "....blllllllllllllb.....",
      ".....blllllllllllb......"
    ],
    legs: { back: 6, front: 15, top: 12, w: 3, fill: "b", toe: "l" },
    tail: { ax: 4, ay: 8, len: 10, base: 15, curl: 25, t0: 3, t1: 1, c: "b", tipC: "a", tip: 2 },
    wing: { x: 7, y: 5 },
    face: { eye: [18, 3], nose: [22, 6, "o"], mouth: [20, 8], cheek: [17, 7] },
    gait: "stomp", hat: { x: 14, y: 2, w: 7 }, mark: [16, 2, 2, 1]
  },
  penguin: {
    art: [
      "........................",
      "..........kkkkk.........",
      ".........kkkkkkk........",
      "........kkkkkkwwk.......",
      "........kkkkkwwwwk......",
      "........kkkkkwwwwk......",
      "........kkkkwwwwwk......",
      "........kkkkwwwwwk......",
      "........kkkwwwwwwk......",
      "........kkkwwwwwwk......",
      "........kkkwwwwwwk......",
      "........kkkwwwwwwk......",
      "........kkkkwwwwk......."
    ],
    legs: { back: 10, front: 13, top: 13, w: 2, fill: "a", toe: "a", biped: true, reach: 0.5 },
    tail: null,
    flipper: { x: 10, y: 6 },
    face: { eye: [14, 3], nose: null, mouth: null, cheek: [15, 6], beak: [18, 5] },
    gait: "waddle", hat: { x: 9, y: 1, w: 8 }, mark: [12, 8, 2, 2]
  }
}

var SIDE_PETS = ["cat", "dog", "bunny", "frog", "panda", "fox", "dragon", "penguin"]
function hasSide(type) { return !!SIDE[type] }

// ----------------------------------------------------------------- body

var _body = {}

// Lay the fills on the grid, give every empty cell that touches a filled one
// the outline colour, then light it: top edges highlight, bottom edges shade.
// Returns merged runs { x, y, w, c } and the rows.
function bodyRuns(type) {
  if (_body[type]) return _body[type]
  var art = SIDE[type].art, g = [], x, y
  for (y = 0; y < SH; y++) {
    g.push([])
    for (x = 0; x < SW; x++) g[y].push(y < art.length ? art[y].charAt(x) || "." : ".")
  }
  var filled = function (cx, cy) { return cx >= 0 && cy >= 0 && cx < SW && cy < SH && g[cy][cx] !== "." && g[cy][cx] !== "o" }
  var rows = []
  for (y = 0; y < SH; y++) {
    var row = ""
    for (x = 0; x < SW; x++) {
      var c = g[y][x]
      if (c === "." && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) c = "o"
      row += c
    }
    rows.push(row)
  }
  var lit = []
  for (y = 0; y < SH; y++) {
    var r2 = ""
    for (x = 0; x < SW; x++) {
      var ch = rows[y].charAt(x)
      var up = y === 0 ? "." : rows[y - 1].charAt(x), down = y === SH - 1 ? "." : rows[y + 1].charAt(x)
      var open = function (q) { return q === "." || q === "o" }
      if (ch === "b" && open(down)) ch = "d"
      else if (ch === "b" && open(up)) ch = "h"
      else if (ch === "l" && open(down)) ch = "s"
      r2 += ch
    }
    lit.push(r2)
  }
  var out = []
  for (y = 0; y < SH; y++) {
    x = 0
    while (x < SW) {
      var cc = lit[y].charAt(x), x2 = x
      while (x2 < SW && lit[y].charAt(x2) === cc) x2++
      if (cc !== ".") out.push({ x: x, y: y, w: x2 - x, c: cc })
      x = x2
    }
  }
  _body[type] = { runs: out, rows: lit }
  return _body[type]
}

function rect(ctx, S, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(x * S, y * S, w * S + 0.5, h * S + 0.5)
}

function col(pal, k) {
  if (pal[k]) return pal[k]
  return k === "h" ? pal.b : k === "s" ? pal.d : pal.o
}

// ----------------------------------------------------------------- legs

// Footfall offsets per gait, in strides: back-far, front-far, back-near,
// front-near. Walk is the four-beat lateral sequence, trot swaps diagonals,
// bound and hop move the pairs together, waddle is two feet in turn.
var GAITS = {
  walk:   { off: [0.0, 0.25, 0.5, 0.75],  duty: 0.65 },
  amble:  { off: [0.0, 0.2, 0.5, 0.7],    duty: 0.7 },
  trot:   { off: [0.0, 0.5, 0.5, 0.0],    duty: 0.5 },
  stomp:  { off: [0.0, 0.25, 0.5, 0.75],  duty: 0.7 },
  bound:  { off: [0.0, 0.12, 0.0, 0.12],  duty: 0.35 },
  hop:    { off: [0.0, 0.0, 0.0, 0.0],    duty: 0.3 },
  waddle: { off: [0.0, 0.5, 0.5, 0.0],    duty: 0.55 }
}

// One leg: where the foot is (-1 back .. 1 front) and how far it is lifted.
// The swing eases in and out so the foot accelerates off the ground and
// settles onto it instead of moving at one speed.
function legState(kind, i, phase) {
  var g = GAITS[kind] || GAITS.walk
  var u = phase + g.off[i]
  u -= Math.floor(u)
  if (u < g.duty) return { x: 1 - 2 * (u / g.duty), lift: 0 }
  var s = (u - g.duty) / (1 - g.duty)
  var e = s * s * (3 - 2 * s)
  return { x: -1 + 2 * e, lift: Math.sin(Math.PI * s) }
}

// A leg from the hip (x, top) down to the foot. dx moves the foot, lift raises
// it; the part near the hip stays put and a lifted leg bends its lower half
// back, like a paw folding at the wrist. Outline first, then the fill, then a
// toe one pixel forward.
function drawLeg(ctx, S, x, top, w, dx, lift, fill, outline, toe) {
  var footY = GROUND - 1 - lift
  if (footY < top + 1) footY = top + 1
  var len = footY - top, xs = [], y
  for (y = top; y <= footY; y++) {
    var t = len > 0 ? (y - top) / len : 1
    var fold = t > 0.5 ? (t - 0.5) * 2 : 0
    xs.push(Math.round(x + dx * t - Math.min(lift, 2) * fold * 0.8))
  }
  for (y = top; y <= footY; y++) rect(ctx, S, xs[y - top] - 1, y, w + 2, 1, outline)
  var fx = xs[len]
  rect(ctx, S, fx - 1, footY, w + 3, 2, outline)
  for (y = top; y < footY; y++) rect(ctx, S, xs[y - top], y, w, 1, fill)
  rect(ctx, S, fx, footY, w + 1, 1, toe)
}

// ----------------------------------------------------------------- tail

// A chain of squares from an anchor, bending with `curl` and swaying with
// `phase`. Every square is outlined first, so the chain reads as one shape.
function chain(ctx, S, pal, t, n, base, phase, amp) {
  var i, pts = []
  for (i = 0; i <= n; i++) {
    var u = n > 0 ? i / n : 0
    var th = (base + t.curl * u + amp * Math.sin(phase - u * 2.4) * u) * Math.PI / 180
    pts.push({ x: t.ax - Math.cos(th) * i, y: t.ay - Math.sin(th) * i, w: Math.max(1, Math.round(t.t0 + (t.t1 - t.t0) * u)) })
  }
  for (i = 0; i < pts.length; i++) rect(ctx, S, Math.round(pts[i].x) - 1, Math.round(pts[i].y) - 1, pts[i].w + 2, pts[i].w + 2, pal.o)
  for (i = 0; i < pts.length; i++) {
    var p = pts[i], tipped = t.tipC && i > n - t.tip
    var key = tipped ? t.tipC : (i === 1 || i === 2) && t.c === "b" ? "h" : t.c
    rect(ctx, S, Math.round(p.x), Math.round(p.y), p.w, p.w, col(pal, key))
  }
}

function drawSideTail(ctx, S, pal, t, phase, amp) {
  if (t) chain(ctx, S, pal, t, t.len, t.base, phase, amp)
}

// The near wing, folded along the back. flap -1..1 raises its far end; a
// bigger stage gets the bigger wing.
var SIDE_WING_SMALL = [
  "...oo",
  "..oao",
  ".oaao",
  "oaaao",
  ".oooo"
]
var SIDE_WING_BIG = [
  ".....oo",
  "...ooao",
  "..oaaao",
  ".oaaaao",
  "oaaaaao",
  ".oaoaoo",
  "..o.o.."
]
function drawSideWing(ctx, S, pal, w, stage, flap) {
  if (!w) return
  var g = stage >= 2 ? SIDE_WING_BIG : SIDE_WING_SMALL
  var gw = g[0].length
  for (var r = 0; r < g.length; r++) for (var c = 0; c < gw; c++) {
    var ch = g[r].charAt(c)
    if (ch === ".") continue
    var dist = gw - 1 - c
    var dy = -Math.round(flap * (gw - 1 - dist) * 0.6) - (stage >= 2 ? 2 : 0)
    rect(ctx, S, w.x + c - gw + 4, w.y + r - g.length + 3 + dy, 1, 1, ch === "o" ? pal.o : (r + c) % 3 === 0 ? (pal.aw || pal.a) : pal.a)
  }
}

// The penguin's near flipper, hanging along its side and swinging with the step.
function drawFlipper(ctx, S, pal, f, swing) {
  if (!f) return
  var segs = [], i
  for (i = 0; i < 6; i++) segs.push([f.x + 1 - Math.round(swing * i * 0.35), f.y + i, i < 5 ? 2 : 1])
  for (i = 0; i < segs.length; i++) rect(ctx, S, segs[i][0] - 1, segs[i][1] - 1, segs[i][2] + 2, 3, pal.o)
  for (i = 0; i < segs.length; i++) rect(ctx, S, segs[i][0], segs[i][1], segs[i][2], 1, i === 0 ? col(pal, "h") : pal.d)
}

// ----------------------------------------------------------------- face

function sideMouth(ctx, S, kind, x, y, pal, wide) {
  var c = pal.m || "#5a3040"
  if (wide && (kind === "smile" || !kind)) { rect(ctx, S, x, y, 4, 1, c); rect(ctx, S, x + 4, y - 1, 1, 1, c); return }
  switch (kind) {
    case "open": rect(ctx, S, x, y, 2, 2, c); rect(ctx, S, x, y + 1, 2, 1, pal.p || "#ff8fa8"); break
    case "oh": rect(ctx, S, x, y, 1, 2, c); break
    case "sad": rect(ctx, S, x, y, 2, 1, c); rect(ctx, S, x + 2, y + 1, 1, 1, c); break
    case "flat": case "chew": rect(ctx, S, x, y, 2, 1, c); break
    case "tongue": rect(ctx, S, x, y, 2, 1, c); rect(ctx, S, x + 1, y + 1, 1, 2, pal.p || "#ff8fa8"); break
    case "zzz": case "none": break
    default: rect(ctx, S, x, y, 2, 1, c); rect(ctx, S, x + 2, y - 1, 1, 1, c)
  }
}

function sideBeak(ctx, S, pal, b, open) {
  var a = pal.a || "#ffb347", d = pal.aw || "#ff9a2e"
  rect(ctx, S, b[0] - 1, b[1] - 1, 4, open ? 5 : 4, pal.o)
  rect(ctx, S, b[0], b[1], 2, 1, a)
  rect(ctx, S, b[0], b[1] + 1, 1, 1, d)
  if (open) rect(ctx, S, b[0], b[1] + 2, 2, 1, d)
}

// -------------------------------------------------------------- hats, marks

function drawSideHat(ctx, S, spec, hat) {
  var lib = spec.lib, h = spec.hat, f = spec.face, HP = lib.HP()
  if (hat === "glasses") {
    var ex = f.eye[0], ey = f.eye[1]
    rect(ctx, S, ex, ey, 2, 3, "rgba(150,215,255,0.45)")
    rect(ctx, S, ex - 1, ey - 1, 4, 1, HP.k); rect(ctx, S, ex - 1, ey + 3, 4, 1, HP.k)
    rect(ctx, S, ex - 1, ey, 1, 3, HP.k); rect(ctx, S, ex + 2, ey, 1, 3, HP.k)
    rect(ctx, S, h.x + 1, ey, ex - 2 - h.x, 1, HP.k)
    return
  }
  if (hat === "phones") {
    rect(ctx, S, h.x + 2, h.y - 1, h.w - 4, 1, HP.o)
    rect(ctx, S, h.x + 2, h.y - 1, 1, 4, HP.o)
    rect(ctx, S, h.x + 1, h.y + 3, 2, 3, HP.a)
    rect(ctx, S, h.x + 1, h.y + 3, 2, 1, HP.p)
    return
  }
  var rows = lib.HAT_ART[hat]
  if (!rows) return
  var w = rows[0].length
  var x0 = h.x + Math.round((h.w - w) / 2) + 1
  var y0 = h.y - rows.length + 1 + (hat === "halo" ? -2 : 0)
  for (var r = 0; r < rows.length; r++) for (var c = 0; c < w; c++) {
    var ch = rows[r].charAt(c)
    if (ch !== ".") rect(ctx, S, x0 + c, y0 + r, 1, 1, HP[ch])
  }
}

// What the adult form wears; the dog's bandana is red, the panda's sprout
// green, the rest gold.
function drawSideMark(ctx, S, type, m, lib, pal) {
  if (!m) return
  var c = type === "dog" ? (pal.t || "#ff6b6b") : type === "panda" ? (pal.a || "#7fc97f") : lib.GOLD()
  rect(ctx, S, m[0], m[1], m[2], m[3], c)
  if (type === "dog") rect(ctx, S, m[0] + 1, m[1] + m[3], 2, 1, pal.o)
  if (type === "panda") rect(ctx, S, m[0] + 1, m[1] - 1, 2, 1, c)
}

// ------------------------------------------------------------------ pet

// How far the body rises while the feet are off the ground, in rows. Hoppers
// and bounders really leave it; walkers rise a little at each push-off
// (walkLift) and their legs stretch to keep the feet planted.
function sideBob(kind, phase, amt) {
  if (kind !== "hop" && kind !== "bound") return 0
  var sum = 0
  for (var i = 0; i < 4; i++) sum += legState(kind, i, phase).lift
  return Math.round(sum / 4 * (kind === "hop" ? 4 : 3) * amt)
}

// Body rise of a walker in rows (0 or 1): up as a foot swings through, down as
// it lands. Hoppers use sideBob instead.
function walkLift(kind, phase, amt) {
  if (kind === "hop" || kind === "bound") return 0
  var k = kind === "trot" || kind === "stomp" || kind === "waddle" ? 1.2 : 0.9
  return Math.round(Math.abs(Math.sin(phase * 2 * Math.PI)) * k * amt)
}

// o: { lib, pal, type, S, stage, gait (strides), gaitAmt 0..1, gaitType, eyes,
//      lookX, lookY, mouth, blush, tailPhase, tailAmp, wing, hat }
// The origin is the pet's feet, centre. Faces right.
function drawSidePet(ctx, o) {
  var spec = SIDE[o.type], S = o.S, pal = o.pal, lib = o.lib
  var amt = Math.max(0, Math.min(1, o.gaitAmt === undefined ? 1 : o.gaitAmt))
  var kind = o.gaitType || spec.gait
  var lg = spec.legs, reach = REACH * amt * (lg.reach || 1)
  var ph = o.gait || 0
  lib.usePalette(pal)
  ctx.save()
  ctx.translate(-SW * S / 2, -SH * S)

  var st = [0, 1, 2, 3].map(function (i) { return legState(kind, i, ph) })
  var bob = sideBob(kind, ph, amt) + walkLift(kind, ph, amt)
  var xs = [lg.back, lg.front, lg.back, lg.front]
  var ws = [lg.w, lg.frontW || lg.w, lg.w, lg.frontW || lg.w]
  var far = lg.biped ? [0] : [0, 1], near = lg.biped ? [2] : [2, 3]
  if (lg.biped) xs = [lg.back, lg.back, lg.front, lg.front]
  var liftOf = function (i) { return Math.round(st[i].lift * 2.5 * amt) }
  var i
  for (i = 0; i < far.length; i++) {
    var a = far[i]
    drawLeg(ctx, S, xs[a] + (lg.biped ? 0 : 1), lg.top - bob, ws[a], Math.round(st[a].x * reach), liftOf(a), pal.d, pal.o, pal.d)
  }

  ctx.save()
  ctx.translate(0, -bob * S)
  drawSideTail(ctx, S, pal, spec.tail, o.tailPhase || 0, o.tailAmp === undefined ? 1 : o.tailAmp)
  var runs = bodyRuns(o.type).runs
  for (i = 0; i < runs.length; i++) rect(ctx, S, runs[i].x, runs[i].y, runs[i].w, 1, col(pal, runs[i].c))
  if ((o.stage || 0) >= 3) drawSideMark(ctx, S, o.type, spec.mark, lib, pal)
  ctx.restore()

  for (i = 0; i < near.length; i++) {
    var b = near[i]
    drawLeg(ctx, S, xs[b], lg.top - bob, ws[b], Math.round(st[b].x * reach), liftOf(b), col(pal, lg.fill), pal.o, col(pal, lg.toe))
  }

  ctx.save()
  ctx.translate(0, -bob * S)
  drawSideWing(ctx, S, pal, spec.wing, o.stage || 0, o.wing || 0)
  drawFlipper(ctx, S, pal, spec.flipper, amt * Math.sin(ph * 2 * Math.PI))
  var f = spec.face
  if (o.blush > 0) rect(ctx, S, f.cheek[0], f.cheek[1], 2, 1, "rgba(" + (pal.cheek || "255,120,150") + "," + (0.35 + 0.4 * Math.min(1, o.blush)).toFixed(2) + ")")
  if (f.nose) rect(ctx, S, f.nose[0], f.nose[1], 1, 1, f.nose[2] === "o" ? pal.o : f.nose[2] === "k" ? "#2b2433" : (pal[f.nose[2]] || "#ff8fa8"))
  if (f.beak) sideBeak(ctx, S, pal, f.beak, o.mouth === "open")
  lib.drawEye(ctx, S, o.eyes || "open", f.eye[0], f.eye[1], o.lookX || 0, o.lookY || 0, 0)
  if (f.mouth) sideMouth(ctx, S, o.mouth || "smile", f.mouth[0], f.mouth[1], pal, f.wide)
  if (o.hat && o.hat !== "none") drawSideHat(ctx, S, { lib: lib, hat: spec.hat, face: f }, o.hat)
  ctx.restore()
  ctx.restore()
}

// ------------------------------------------------------------- locomotion

// Which behaviours show the profile. Rolling and sliding stay front-on.
var NO_SIDE = { pandaRoll: true, penguinSlide: true }
function showsSide(type, behaviour) { return hasSide(type) && !NO_SIDE[behaviour] }

// Pixels the body travels per full stride, keeping the feet close to the ground.
// A foot on the ground moves back 2 * reach sprite pixels while it is planted,
// which is `duty` of the cycle. Hoppers cover more ground in the air.
var AIR = { hop: 2.4, bound: 1.8 }
// How far a foot swings either way (sprite pixels), and how much longer a
// cartoon stride is than the legs strictly allow: the legs are only ~5 pixels
// long, so a true no-slip stride would flicker at 14 steps a second.
var REACH = 2.5
var STRIDE_SCALE = 1.9
function strideLength(kind, S) {
  var g = GAITS[kind] || GAITS.walk
  return (2 * REACH / g.duty) * S * STRIDE_SCALE * (AIR[kind] || 1)
}

// 0..1: how far the legs swing. Ramps up as the pet gets going and back down as
// it slows, which makes the start and the stop read as steps, not a slide.
function gaitAmount(speed) { return Math.max(0, Math.min(1, speed / 70)) }

// Lean into the direction of travel, radians, before the mirror is applied.
// The penguin rocks from foot to foot on top of that.
function leanFor(speed) { return 0.06 * Math.min(1, speed / 180) }
function waddleRock(kind, phase, amt) { return kind === "waddle" ? Math.sin(phase * 2 * Math.PI) * 0.09 * amt : 0 }

// Horizontal squeeze while turning between front and profile. `m` runs 0 (front
// view) to 1 (profile): the front shrinks to a sliver, then the profile grows.
function turnScale(m) { return m <= 0 ? 1 : m >= 1 ? 1 : m < 0.5 ? 1 - 1.5 * m : 0.25 + 1.5 * (m - 0.5) }
