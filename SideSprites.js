// Side-view pets for the walk cycle on the bar. The front-view art in
// Sprites.js stays for standing, sleeping and the care card; while a pet walks
// it turns into profile (facing right, mirrored by the caller) with four legs.
//
// The body is built from a few filled shapes and gets its outline from code, so
// the art is a short list per pet instead of a hand-typed grid. Legs and tail
// are drawn separately so they can move. Palette keys are the ones in
// Sprites.js: o outline, b body, l light, d shade, p pink, a accent, w white,
// k dark.
//
// Everything that needs Sprites.js (eyes, palette) comes in through `o.lib`, so
// this file also loads on its own in node for the tests and the preview sheet.

var SW = 24
var SH = 18
var GROUND = 17

// Ops: ["r", x, y, w, h, c] rectangle, ["rr", ...] rectangle without its four
// corners, ["p", x, y, c] pixel, ["x", x, y] clear a pixel.
// legs: x of the back and front leg, top row, inner width, fill key.
// face: eye (2x2), nose pixel, mouth anchor, cheek.
var SIDE = {
  cat: {
    ops: [
      ["rr", 3, 5, 15, 7, "b"], ["rr", 5, 9, 11, 3, "l"],
      ["rr", 14, 3, 8, 7, "b"], ["rr", 19, 6, 3, 3, "l"],
      ["r", 14, 1, 2, 3, "b"], ["x", 14, 1], ["p", 15, 2, "p"],
      ["r", 19, 1, 2, 3, "b"], ["x", 20, 1], ["p", 19, 2, "p"]
    ],
    legs: { back: 5, front: 14, top: 11, w: 2, fill: "b" },
    tail: { ax: 3, ay: 7, len: 9, base: 55, curl: -50, t0: 2, t1: 2, c: "b" },
    face: { eye: [17, 5], nose: [21, 6, "p"], mouth: [19, 8], cheek: [17, 7] },
    gait: "walk", hat: { x: 14, y: 3, w: 8 }, mark: [17, 3, 3, 2]
  },
  dog: {
    ops: [
      ["rr", 3, 5, 14, 7, "b"], ["rr", 5, 9, 10, 3, "l"],
      ["rr", 13, 3, 8, 7, "b"], ["rr", 19, 6, 4, 4, "l"],
      ["rr", 13, 3, 3, 7, "d"]
    ],
    legs: { back: 5, front: 13, top: 11, w: 2, fill: "b" },
    tail: { ax: 3, ay: 6, len: 7, base: 60, curl: -30, t0: 2, t1: 2, c: "b" },
    face: { eye: [17, 5], nose: [22, 6, "k"], mouth: [19, 9], cheek: [17, 8] },
    gait: "trot", hat: { x: 14, y: 3, w: 8 }, mark: [13, 9, 5, 2]
  },
  bunny: {
    ops: [
      ["rr", 4, 6, 13, 6, "b"], ["rr", 6, 9, 9, 3, "l"],
      ["rr", 14, 5, 7, 6, "b"], ["rr", 19, 7, 2, 3, "l"],
      ["r", 14, 1, 2, 5, "b"], ["r", 14, 2, 1, 3, "p"],
      ["r", 17, 2, 2, 4, "b"], ["r", 17, 3, 1, 2, "p"],
      ["rr", 1, 7, 4, 4, "w"],
      ["rr", 3, 7, 7, 6, "b"], ["rr", 4, 9, 4, 3, "d"]
    ],
    legs: { back: 5, front: 14, top: 11, w: 3, fill: "b" },
    tail: null,
    face: { eye: [17, 6], nose: [21, 7, "p"], mouth: [18, 9], cheek: [16, 8] },
    gait: "bound", hat: { x: 14, y: 5, w: 7 }, mark: [16, 5, 3, 2]
  },
  frog: {
    ops: [
      ["rr", 3, 9, 16, 5, "b"], ["rr", 5, 12, 12, 2, "l"],
      ["rr", 14, 8, 8, 5, "b"],
      ["rr", 15, 5, 5, 4, "b"],
      ["rr", 3, 10, 6, 4, "d"],
      ["p", 10, 10, "d"], ["p", 12, 11, "d"], ["p", 14, 10, "d"]
    ],
    legs: { back: 4, front: 15, top: 13, w: 3, fill: "b" },
    tail: null,
    face: { eye: [17, 6], nose: null, mouth: [18, 11], cheek: [16, 10], wide: true },
    gait: "hop", hat: { x: 14, y: 5, w: 8 }, mark: [7, 12, 9, 2]
  },
  panda: {
    ops: [
      ["rr", 3, 5, 15, 7, "b"], ["r", 12, 5, 4, 7, "k"],
      ["rr", 14, 3, 8, 7, "b"], ["rr", 19, 6, 3, 3, "l"],
      ["r", 14, 2, 3, 2, "k"], ["rr", 16, 5, 4, 3, "k"]
    ],
    legs: { back: 5, front: 13, top: 11, w: 3, fill: "k" },
    tail: { ax: 3, ay: 9, len: 2, base: 20, curl: 0, t0: 3, t1: 3, c: "w" },
    face: { eye: [17, 5], nose: [21, 7, "k"], mouth: [19, 8], cheek: [20, 8] },
    gait: "amble", hat: { x: 14, y: 3, w: 8 }, mark: [18, 1, 3, 2]
  },
  fox: {
    ops: [
      ["rr", 3, 6, 14, 5, "b"], ["rr", 12, 8, 5, 3, "w"],
      ["rr", 14, 4, 6, 6, "b"], ["rr", 19, 7, 4, 2, "b"], ["r", 16, 9, 4, 1, "w"],
      ["r", 14, 1, 2, 4, "b"], ["x", 14, 1], ["p", 15, 3, "k"],
      ["r", 18, 1, 2, 4, "b"], ["x", 19, 1], ["p", 18, 3, "k"]
    ],
    legs: { back: 5, front: 14, top: 10, w: 2, fill: "d" },
    tail: { ax: 3, ay: 8, len: 10, base: 25, curl: 20, t0: 2, t1: 4, c: "b", tipC: "w", tip: 3 },
    face: { eye: [17, 6], nose: [22, 7, "k"], mouth: [18, 9], cheek: [16, 8] },
    gait: "trot", hat: { x: 14, y: 4, w: 6 }, mark: [16, 4, 3, 2]
  },
  dragon: {
    ops: [
      ["rr", 3, 5, 15, 7, "b"], ["rr", 5, 8, 12, 4, "l"],
      ["rr", 14, 3, 8, 7, "b"], ["rr", 20, 6, 3, 4, "b"],
      ["p", 15, 1, "a"], ["p", 15, 2, "a"], ["p", 18, 1, "a"], ["p", 18, 2, "a"],
      ["p", 5, 4, "a"], ["p", 8, 4, "a"], ["p", 11, 4, "a"]
    ],
    legs: { back: 5, front: 14, top: 11, w: 3, fill: "b" },
    tail: { ax: 3, ay: 8, len: 11, base: 15, curl: 25, t0: 3, t1: 1, c: "b", tipC: "a", tip: 2 },
    wing: { ax: 10, ay: 5, base: 105, c: "a", c2: "aw", t0: 3, t1: 1 },
    face: { eye: [17, 5], nose: [22, 7, "o"], mouth: [19, 9], cheek: [17, 8] },
    gait: "stomp", hat: { x: 14, y: 3, w: 8 }, mark: [16, 3, 3, 2]
  }
}

var SIDE_PETS = ["cat", "dog", "bunny", "frog", "panda", "fox", "dragon"]
function hasSide(type) { return !!SIDE[type] }

// ----------------------------------------------------------------- body

var _body = {}

// Fill the shapes, then give every empty cell that touches a filled one the
// outline colour. Returns merged runs { x, y, w, c }.
function bodyRuns(type) {
  if (_body[type]) return _body[type]
  var spec = SIDE[type], g = [], x, y, i
  for (y = 0; y < SH; y++) { g.push([]); for (x = 0; x < SW; x++) g[y].push(".") }
  for (i = 0; i < spec.ops.length; i++) {
    var op = spec.ops[i], k = op[0]
    if (k === "p") { g[op[2]][op[1]] = op[3]; continue }
    if (k === "x") { g[op[2]][op[1]] = "."; continue }
    for (y = op[2]; y < op[2] + op[4]; y++) for (x = op[1]; x < op[1] + op[3]; x++) {
      if (k === "rr" && op[3] > 2 && op[4] > 2 && (x === op[1] || x === op[1] + op[3] - 1) && (y === op[2] || y === op[2] + op[4] - 1)) continue
      g[y][x] = op[5]
    }
  }
  var out = []
  var filled = function (cx, cy) { return cx >= 0 && cy >= 0 && cx < SW && cy < SH && g[cy][cx] !== "." }
  var rows = []
  for (y = 0; y < SH; y++) {
    var row = ""
    for (x = 0; x < SW; x++) {
      var c = g[y][x]
      if (c === "." && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) c = "o"
      row += c
    }
    rows.push(row)
    x = 0
    while (x < SW) {
      var ch = row.charAt(x), x2 = x
      while (x2 < SW && row.charAt(x2) === ch) x2++
      if (ch !== ".") out.push({ x: x, y: y, w: x2 - x, c: ch })
      x = x2
    }
  }
  _body[type] = { runs: out, rows: rows }
  return _body[type]
}

function rect(ctx, S, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(x * S, y * S, w * S + 0.5, h * S + 0.5)
}

// ----------------------------------------------------------------- legs

// Footfall offsets per gait, in strides: back-far, front-far, back-near,
// front-near. Walk is the four-beat lateral sequence, trot swaps diagonals,
// bound and hop move the pairs together.
var GAITS = {
  walk:  { off: [0.0, 0.25, 0.5, 0.75],  duty: 0.65 },
  amble: { off: [0.0, 0.2, 0.5, 0.7],    duty: 0.7 },
  trot:  { off: [0.0, 0.5, 0.5, 0.0],    duty: 0.5 },
  stomp: { off: [0.0, 0.25, 0.5, 0.75],  duty: 0.7 },
  bound: { off: [0.0, 0.12, 0.0, 0.12],  duty: 0.35 },
  hop:   { off: [0.0, 0.0, 0.0, 0.0],    duty: 0.3 }
}

// One leg: where the foot is (-1 back .. 1 front) and how far it is lifted.
function legState(kind, i, phase) {
  var g = GAITS[kind] || GAITS.walk
  var u = phase + g.off[i]
  u -= Math.floor(u)
  if (u < g.duty) return { x: 1 - 2 * (u / g.duty), lift: 0 }
  var s = (u - g.duty) / (1 - g.duty)
  return { x: -1 + 2 * s, lift: Math.sin(Math.PI * s) }
}

function drawLeg(ctx, S, pal, x, top, w, dx, lift, fill, outline, light) {
  var bottom = GROUND - lift
  var h = bottom - top + 1
  if (h < 2) return
  rect(ctx, S, x + dx - 1, top, w + 2, h, outline)
  rect(ctx, S, x + dx, top, w, h - 1, fill)
  rect(ctx, S, x + dx, bottom - 1, w, 1, light)
}

// ----------------------------------------------------------------- tail

// A chain of squares from an anchor, bending with `curl` and swaying with
// `phase`. Used for tails and for the dragon's wing.
function chain(ctx, S, pal, t, n, base, phase, amp) {
  var i, pts = []
  for (i = 0; i <= n; i++) {
    var u = i / n
    var th = (base + t.curl * u + amp * Math.sin(phase - u * 2.4) * u) * Math.PI / 180
    pts.push({ x: t.ax - Math.cos(th) * i, y: t.ay - Math.sin(th) * i, w: Math.max(1, Math.round(t.t0 + (t.t1 - t.t0) * u)) })
  }
  for (i = 0; i < pts.length; i++) rect(ctx, S, Math.round(pts[i].x) - 1, Math.round(pts[i].y) - 1, pts[i].w + 2, pts[i].w + 2, pal.o)
  for (i = 0; i < pts.length; i++) {
    var p = pts[i], tipped = t.tipC && i > n - t.tip
    var key = tipped ? t.tipC : (t.c2 && i % 2 ? t.c2 : t.c)
    rect(ctx, S, Math.round(p.x), Math.round(p.y), p.w, p.w, pal[key] || pal[t.c])
  }
}

function drawSideTail(ctx, S, pal, t, phase, amp) {
  if (t) chain(ctx, S, pal, { ax: t.ax, ay: t.ay, curl: t.curl, t0: t.t0, t1: t.t1, c: t.c, tipC: t.tipC, tip: t.tip }, t.len, t.base, phase, amp)
}

// flap -1..1 swings the wing; a bigger stage grows it. Three ribs make a fan.
function drawSideWing(ctx, S, pal, w, stage, flap) {
  if (!w) return
  var spread = [-26, 0, 26], i
  for (i = 0; i < 3; i++)
    chain(ctx, S, pal, { ax: w.ax + (i - 1) * 1.5, ay: w.ay, curl: 0, t0: 2, t1: 1, c: w.c, c2: w.c2 }, 5 + stage * 2 - (i === 1 ? 0 : 1), w.base + spread[i] - flap * 40, 0, 0)
}

// ----------------------------------------------------------------- face

function sideMouth(ctx, S, kind, x, y, pal) {
  var c = pal.m || "#5a3040"
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

// -------------------------------------------------------------- hats, marks

function drawSideHat(ctx, S, spec, hat, eyesDone) {
  var lib = spec.lib, h = spec.hat, f = spec.face, HP = lib.HP()
  if (hat === "glasses") {
    var ex = f.eye[0], ey = f.eye[1]
    rect(ctx, S, ex, ey, 2, 2, "rgba(150,215,255,0.5)")
    rect(ctx, S, ex - 1, ey - 1, 4, 1, HP.k); rect(ctx, S, ex - 1, ey + 2, 4, 1, HP.k)
    rect(ctx, S, ex - 1, ey, 1, 2, HP.k); rect(ctx, S, ex + 2, ey, 1, 2, HP.k)
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

// What the adult form wears; the dog's bandana is red, the rest gold.
function drawSideMark(ctx, S, type, m, lib, pal) {
  if (!m) return
  var c = type === "dog" ? (pal.t || "#ff6b6b") : type === "panda" ? (pal.a || "#7fc97f") : lib.GOLD()
  rect(ctx, S, m[0], m[1], m[2], m[3], c)
  if (type === "dog") rect(ctx, S, m[0] + 1, m[1] + m[3], 2, 1, pal.o)
  if (type === "panda") rect(ctx, S, m[0] + 1, m[1] - 1, 2, 1, c)
}

// ------------------------------------------------------------------ pet

// How far the body rises while the feet are off the ground, in rows. Walkers
// stay level (the caller bobs them); hoppers and bounders really leave it.
function sideBob(kind, phase, amt) {
  if (kind !== "hop" && kind !== "bound") return 0
  var sum = 0
  for (var i = 0; i < 4; i++) sum += legState(kind, i, phase).lift
  return Math.round(sum / 4 * (kind === "hop" ? 4 : 3) * amt)
}

// o: { lib, pal, type, S, stage, gait (strides), gaitAmt 0..1, gaitType, eyes,
//      lookX, lookY, mouth, blush, tailPhase, tailAmp, wing, hat }
// The origin is the pet's feet, centre. Faces right.
function drawSidePet(ctx, o) {
  var spec = SIDE[o.type], S = o.S, pal = o.pal, lib = o.lib
  var amt = Math.max(0, Math.min(1, o.gaitAmt === undefined ? 1 : o.gaitAmt))
  var kind = o.gaitType || spec.gait
  var lg = spec.legs, reach = REACH * amt
  lib.usePalette(pal)
  ctx.save()
  ctx.translate(-SW * S / 2, -SH * S)

  var st = [0, 1, 2, 3].map(function (i) { return legState(kind, i, o.gait || 0) })
  var bob = sideBob(kind, o.gait || 0, amt)
  var xs = [lg.back, lg.front, lg.back, lg.front]
  var i
  for (i = 0; i < 2; i++)
    drawLeg(ctx, S, pal, xs[i] + 1, lg.top - bob, lg.w, Math.round(st[i].x * reach), Math.round(st[i].lift * 2.5 * amt), pal.d, pal.o, pal.d)

  ctx.save()
  ctx.translate(0, -bob * S)
  drawSideWing(ctx, S, pal, spec.wing, o.stage || 0, o.wing || 0)
  drawSideTail(ctx, S, pal, spec.tail, o.tailPhase || 0, o.tailAmp === undefined ? 1 : o.tailAmp)
  var runs = bodyRuns(o.type).runs
  for (i = 0; i < runs.length; i++) rect(ctx, S, runs[i].x, runs[i].y, runs[i].w, 1, pal[runs[i].c])
  if ((o.stage || 0) >= 3) drawSideMark(ctx, S, o.type, spec.mark, lib, pal)
  ctx.restore()

  for (i = 2; i < 4; i++)
    drawLeg(ctx, S, pal, xs[i], lg.top - bob, lg.w, Math.round(st[i].x * reach), Math.round(st[i].lift * 2.5 * amt), pal[lg.fill], pal.o, pal.l)

  ctx.save()
  ctx.translate(0, -bob * S)
  var f = spec.face
  if (o.blush > 0) rect(ctx, S, f.cheek[0], f.cheek[1], 2, 1, "rgba(" + (pal.cheek || "255,120,150") + "," + (0.35 + 0.4 * Math.min(1, o.blush)).toFixed(2) + ")")
  if (f.nose) rect(ctx, S, f.nose[0], f.nose[1], 1, 1, f.nose[2] === "o" ? pal.o : f.nose[2] === "k" ? "#2b2433" : (pal[f.nose[2]] || "#ff8fa8"))
  lib.drawEye(ctx, S, o.eyes || "open", f.eye[0], f.eye[1], o.lookX || 0, o.lookY || 0, 0)
  sideMouth(ctx, S, o.mouth || "smile", f.mouth[0], f.mouth[1], pal)
  if (o.hat && o.hat !== "none") drawSideHat(ctx, S, { lib: lib, hat: spec.hat, face: f }, o.hat)
  ctx.restore()
  ctx.restore()
}

// ------------------------------------------------------------- locomotion

// Which behaviours show the profile. Rolling and the like stay front-on.
var NO_SIDE = { pandaRoll: true }
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

// Body rise while walking, in pixels (hoppers rise through sideBob instead).
function walkBob(kind, phase, amt, S) {
  if (kind === "hop" || kind === "bound") return 0
  var k = kind === "trot" || kind === "stomp" ? 0.9 : 0.5
  return -Math.abs(Math.sin(phase * 2 * Math.PI)) * k * S * amt
}

// Lean into the direction of travel, radians, before the mirror is applied.
function leanFor(speed) { return 0.06 * Math.min(1, speed / 180) }

// Horizontal squeeze while turning between front and profile. `m` runs 0 (front
// view) to 1 (profile): the front shrinks to a sliver, then the profile grows.
function turnScale(m) { return m <= 0 ? 1 : m >= 1 ? 1 : m < 0.5 ? 1 - 1.5 * m : 0.25 + 1.5 * (m - 0.5) }
