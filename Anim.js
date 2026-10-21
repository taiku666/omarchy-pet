// Behaviours: short authored animations the pet plays on its own or in answer
// to the user. A behaviour is a duration range plus a pose function; `pose(p)`
// takes progress 0..1 and returns only the fields that differ from the resting
// pose. The scene combines that with breathing and blinking.
//
// Pose fields: dx dy (pixels), sx sy (scale), rot (radians, about the body),
// eyes, mouth, lookX lookY, tailAmp, wing, blush, and `fx` for effects the
// scene draws itself (tongue, fire, bamboo, ...).

function env(p) { return Math.sin(Math.PI * p) }
function clamp01(p) { return p < 0 ? 0 : p > 1 ? 1 : p }
function sat(p, a, b) { return clamp01((p - a) / (b - a)) }

function hopArc(p, height) {
  var crouch = sat(p, 0, 0.18) * (1 - sat(p, 0.82, 1))
  var air = sat(p, 0.18, 0.82)
  return {
    dy: -Math.sin(Math.PI * air) * height,
    sy: 1 - 0.16 * Math.sin(Math.PI * Math.min(1, crouch)) * (air <= 0 || air >= 1 ? 1 : 0) + 0.1 * env(air),
    sx: 1 + 0.12 * (air <= 0 || air >= 1 ? env(crouch) : 0) - 0.05 * env(air)
  }
}

// Feet for the walk cycle: `phase` is the stride in radians (one step per half
// turn), `sync` makes both feet move together for hoppers. The body is raised
// while the feet show, easing in and out over the ends of the behaviour.
function stride(p, phase, sync) {
  return { gait: phase, gaitAmt: sat(p, 0, 0.1) * (1 - sat(p, 0.9, 1)), gaitSync: !!sync }
}
function withGait(o, g) { for (var k in g) o[k] = g[k]; return o }

var BEHAVIORS = {
  idle:    { dur: [2500, 5000], pose: function (p) { return {} } },
  look:    { dur: [1600, 2600], pose: function (p) {
    return { lookX: p < 0.33 ? -1 : p < 0.7 ? 1 : 0, lookY: p > 0.7 ? -1 : 0 } } },
  stretch: { dur: [1800, 2400], pose: function (p) {
    var e = env(p)
    return { sx: 1 + 0.2 * e, sy: 1 - 0.13 * e, eyes: "closed", mouth: e > 0.5 ? "open" : "smile", tailAmp: 1.5 } } },
  hop:     { dur: [700, 900], move: 0, pose: function (p) {
    var h = hopArc(p, 16); h.mouth = "smile"; return h } },
  doubleHop: { dur: [1300, 1500], pose: function (p) {
    var h = hopArc((p * 2) % 1, 13); h.eyes = "happy"; return h } },
  wiggle:  { dur: [1200, 1800], pose: function (p) {
    return { rot: Math.sin(p * 26) * 0.07, tailAmp: 3.2, eyes: "happy", mouth: "open" } } },
  spin:    { dur: [900, 1100], pose: function (p) {
    var h = hopArc(p, 18); h.sx = Math.cos(p * Math.PI * 2) * (h.sx || 1); h.eyes = "happy"; h.mouth = "open"; return h } },
  yawn:    { dur: [1800, 2400], pose: function (p) {
    var e = env(p)
    return { sy: 1 + 0.07 * e, sx: 1 - 0.03 * e, eyes: "closed", mouth: e > 0.25 ? "open" : "flat" } } },
  walk:    { dur: [1600, 2800], move: 1, pose: function (p) {
    return withGait({ dy: -Math.abs(Math.sin(p * 18)) * 3, rot: Math.sin(p * 18) * 0.03 }, stride(p, p * 18)) } },
  sit:     { dur: [2500, 4500], pose: function (p) { return { sy: 0.96, tailAmp: 0.6 } } },
  dance:   { dur: [1800, 2400], pose: function (p) {
    return { rot: Math.sin(p * 20) * 0.1, dy: -Math.abs(Math.sin(p * 10)) * 8, eyes: "happy", mouth: "open", tailAmp: 3 } } },

  // --- cat
  catWalk: { dur: [1800, 2800], move: 1, pose: function (p) {
    return withGait({ dy: -Math.abs(Math.sin(p * 16)) * 1.5, rot: Math.sin(p * 16) * 0.015, tailAmp: 2.2, mouth: "smile" }, stride(p, p * 16)) } },
  catFlick: { dur: [1800, 2600], pose: function (p) {
    return { tailAmp: 4, lookX: Math.sin(p * 9), lookY: -1, sx: 1.02, mouth: "chew" } } },
  catKnead: { dur: [2000, 2600], pose: function (p) {
    return { sy: 1 - 0.05 * Math.abs(Math.sin(p * 14)), eyes: "closed", mouth: "smile", tailAmp: 1 } } },
  // --- dog
  dogRun: { dur: [1500, 2200], move: 2, pose: function (p) {
    return withGait({ dy: -Math.abs(Math.sin(p * 24)) * 5, sx: 1 + 0.05 * Math.sin(p * 24), mouth: "tongue", tailAmp: 4.2, eyes: "happy" }, stride(p, p * 24)) } },
  dogBark: { dur: [1200, 1500], pose: function (p) {
    var b = Math.floor(p * 3) % 3, local = (p * 3) % 1
    var e = env(local)
    return { dy: -4 * e, sy: 1 + 0.06 * e, mouth: "open", tailAmp: 3, fx: { bark: e } } } },
  // --- bunny
  bunnyNibble: { dur: [1800, 2400], pose: function (p) {
    return { dy: Math.abs(Math.sin(p * 20)) * 1.5, mouth: Math.sin(p * 30) > 0 ? "chew" : "flat", fx: { nibble: 1 } } } },
  bunnyTwitch: { dur: [1000, 1400], pose: function (p) {
    return { sx: 1 + 0.025 * Math.sin(p * 40), lookX: Math.sin(p * 6), mouth: "flat" } } },
  bunnyScamper: { dur: [1400, 2000], move: 1, pose: function (p) {
    var q = (p * 3) % 1
    var h = hopArc(q, 9); h.mouth = "smile"; return withGait(h, stride(p, Math.PI * sat(q, 0.18, 0.82), true)) } },
  bunnyBinky: { dur: [1000, 1200], pose: function (p) {
    var h = hopArc(p, 24); h.rot = Math.sin(p * Math.PI * 2) * 0.35; h.eyes = "happy"; h.mouth = "open"; return h } },
  // --- frog
  frogTongue: { dur: [1600, 2000], pose: function (p) {
    var snap = sat(p, 0.35, 0.5) * (1 - sat(p, 0.5, 0.65))
    return { sx: 1 + 0.04 * snap, lookX: 1, lookY: -1, mouth: snap > 0.05 ? "open" : "smile", fx: { fly: 1 - sat(p, 0.5, 0.52), tongue: snap, flyT: p } } } },
  frogCroak: { dur: [1400, 1800], pose: function (p) {
    var puff = Math.max(0, Math.sin(p * Math.PI * 4))
    return { sx: 1 + 0.12 * puff, sy: 1 + 0.08 * puff, eyes: puff > 0.5 ? "closed" : "open", mouth: puff > 0.5 ? "open" : "smile" } } },
  frogHop: { dur: [900, 1100], move: 1, pose: function (p) {
    var h = hopArc(p, 22); h.mouth = "smile"; return withGait(h, stride(p, Math.PI * sat(p, 0.18, 0.82), true)) } },
  // --- panda
  pandaMunch: { dur: [2600, 3400], pose: function (p) {
    return { dy: Math.abs(Math.sin(p * 16)) * 1.2, mouth: Math.sin(p * 24) > 0 ? "chew" : "flat", eyes: "happy", fx: { bamboo: 1 } } } },
  pandaWaddle: { dur: [2000, 3000], move: 1, pose: function (p) {
    return withGait({ rot: Math.sin(p * 11) * 0.08, dy: -Math.abs(Math.sin(p * 11)) * 1.5, mouth: "smile" }, stride(p, p * 11)) } },
  pandaRoll: { dur: [1600, 2000], move: 2, pose: function (p) {
    return { rot: p * Math.PI * 4, dy: -6 * env(p) - 6, eyes: "happy", mouth: "open", fx: { rollCenter: 1 } } } },
  // --- fox
  foxPounce: { dur: [1500, 1900], move: 2, pose: function (p) {
    var crouch = sat(p, 0, 0.4) * (1 - sat(p, 0.4, 0.5))
    var leap = sat(p, 0.45, 0.85)
    return { sy: 1 - 0.2 * crouch + 0.1 * env(leap), sx: 1 + 0.15 * crouch, dy: -Math.sin(Math.PI * leap) * 26,
      lookX: 1, eyes: crouch > 0.2 ? "wide" : "open", tailAmp: crouch > 0.2 ? 3.5 : 1.5, rot: -0.15 * env(leap) } } },
  foxZoom: { dur: [1800, 2400], move: 3, pose: function (p) {
    return withGait({ dy: -Math.abs(Math.sin(p * 30)) * 4, rot: -0.1, eyes: "happy", mouth: "open", tailAmp: 4.5 }, stride(p, p * 30)) } },
  foxTrot: { dur: [1800, 2600], move: 1, pose: function (p) {
    return withGait({ dy: -Math.abs(Math.sin(p * 20)) * 2.5, rot: -0.04, tailAmp: 3, mouth: "smile" }, stride(p, p * 20)) } },
  foxTilt: { dur: [1400, 2000], pose: function (p) {
    return { rot: -0.18 * env(p * 1.2), lookY: -1, eyes: "wide", mouth: "oh" } } },
  // --- dragon
  dragonFire: { dur: [1600, 2000], pose: function (p) {
    var f = sat(p, 0.3, 0.45) * (1 - sat(p, 0.7, 0.9))
    return { sy: 1 + 0.06 * f, sx: 1 - 0.03 * f, dy: -2 * f, mouth: p > 0.28 && p < 0.9 ? "open" : "smile", eyes: f > 0.2 ? "closed" : "open", wing: 0.4 * f, fx: { fire: f, shake: f } } } },
  dragonFlap: { dur: [1800, 2400], pose: function (p) {
    var lift = env(sat(p, 0, 0.2)) > 0 ? Math.min(1, sat(p, 0, 0.2)) * (1 - sat(p, 0.85, 1)) : 0
    return { dy: -16 * lift, wing: Math.sin(p * 40) * 1, eyes: "happy", mouth: "smile" } } },
  dragonStomp: { dur: [2000, 3000], move: 1, pose: function (p) {
    return withGait({ dy: -Math.abs(Math.sin(p * 12)) * 2, rot: Math.sin(p * 12) * 0.04, wing: 0.15 + Math.sin(p * 12) * 0.15, mouth: "smile" }, stride(p, p * 12)) } },
  dragonHoard: { dur: [1800, 2400], pose: function (p) {
    return { eyes: "wide", lookY: 1, mouth: "smile", tailAmp: 2.5, fx: { sparkle: 1 } } } },
  // --- penguin
  penguinWaddle: { dur: [1800, 2800], move: 1, pose: function (p) {
    return withGait({ rot: Math.sin(p * 14) * 0.14, dy: -Math.abs(Math.sin(p * 14)) * 2, wing: Math.sin(p * 14) * 0.6 }, stride(p, p * 14)) } },
  penguinSlide: { dur: [1800, 2200], move: 3, pose: function (p) {
    var down = sat(p, 0, 0.15) * (1 - sat(p, 0.85, 1))
    return { rot: Math.PI / 2 * 0.92 * down, dy: 2 * down, eyes: "happy", mouth: "open", wing: 0.6, fx: { slide: down, rollCenter: 1 } } } },
  penguinFlap: { dur: [1200, 1600], pose: function (p) {
    return { wing: Math.sin(p * 32), dy: -Math.abs(Math.sin(p * 16)) * 3, eyes: "happy", mouth: "open" } } },

  // --- reactions the scene triggers directly
  eat:     { dur: [1600, 1800], pose: function (p) {
    return { sy: 1 + 0.03 * Math.sin(p * 30), mouth: Math.sin(p * 26) > 0 ? "chew" : "open", eyes: p > 0.5 ? "happy" : "open", blush: 0.4 } } },
  love:    { dur: [1500, 2000], pose: function (p) {
    return { eyes: "love", mouth: "open", dy: -Math.abs(Math.sin(p * 9)) * 7, tailAmp: 4, blush: 1 } } },
  cheer:   { dur: [1200, 1500], pose: function (p) {
    var h = hopArc((p * 2) % 1, 14); h.eyes = "happy"; h.mouth = "open"; h.tailAmp = 3.5; return h } },
  clean:   { dur: [1400, 1600], pose: function (p) {
    return { rot: Math.sin(p * 34) * 0.1 * (1 - p), eyes: "closed", mouth: "open", fx: { suds: 1 } } } },
  nap:     { dur: [1000, 1000], pose: function (p) { return { eyes: "closed", sy: 0.97, mouth: "flat" } } },
  poke:    { dur: [500, 700], pose: function (p) {
    var e = env(p)
    return { sx: 1 + 0.12 * e, sy: 1 - 0.1 * e, eyes: "wide", mouth: "oh" } } }
}

// What each pet does when left alone, weighted. Everyone also gets the generic
// pool, so a cat that is "mostly" doing cat things still looks around and hops.
var PERSONALITY = {
  cat:     { stretch: 3, catFlick: 4, catKnead: 2, catWalk: 3, look: 3, sit: 3, yawn: 2, walk: 1, hop: 0.5 },
  dog:     { dogRun: 3, dogBark: 3, wiggle: 3, look: 2, hop: 2, walk: 2, sit: 1.5 },
  bunny:   { bunnyNibble: 3, bunnyTwitch: 3, bunnyBinky: 2, bunnyScamper: 3, hop: 3, doubleHop: 2, look: 3, sit: 1.5 },
  frog:    { frogTongue: 4, frogCroak: 3, frogHop: 3, look: 2, sit: 4, yawn: 1 },
  panda:   { pandaMunch: 4, pandaRoll: 2, pandaWaddle: 3, yawn: 3, sit: 4, stretch: 2, look: 2, walk: 1 },
  fox:     { foxPounce: 3, foxZoom: 2, foxTrot: 3, foxTilt: 3, look: 3, hop: 2, walk: 1, sit: 1.5 },
  dragon:  { dragonFire: 3, dragonFlap: 3, dragonStomp: 3, dragonHoard: 2, look: 2, stretch: 1.5, walk: 0.5, sit: 1.5, hop: 1 },
  penguin: { penguinWaddle: 4, penguinSlide: 3, penguinFlap: 3, look: 2, sit: 2, hop: 1, dance: 1 }
}

// Each mood bends the weights: a sad pet barely moves, a playful one never stops.
function weightsFor(type, mood) {
  var base = PERSONALITY[type] || {}
  var out = {}
  var k
  for (k in base) out[k] = base[k]
  out.idle = 3
  out.look = (out.look || 1)
  var active = ["hop", "doubleHop", "dance", "spin", "dogRun", "foxZoom", "foxPounce", "bunnyBinky", "penguinSlide", "frogHop", "bunnyScamper", "foxTrot", "wiggle", "dragonFlap", "pandaRoll"]
  var i
  if (mood === "playful") {
    for (i = 0; i < active.length; i++) if (out[active[i]]) out[active[i]] *= 2.2
    out.idle = 1; out.spin = (out.spin || 0) + 1; out.dance = (out.dance || 0) + 1
  } else if (mood === "sad") {
    for (k in out) out[k] = 0.15
    out.idle = 6; out.sit = 4; out.look = 1
  } else if (mood === "sleepy" || mood === "hungry") {
    for (i = 0; i < active.length; i++) if (out[active[i]]) out[active[i]] *= 0.2
    out.yawn = (out.yawn || 0) + 3; out.sit = (out.sit || 0) + 3; out.idle = 5
  }
  return out
}

// `r` is a function returning 0..1 so tests can seed it.
function pickBehavior(type, mood, r, previous) {
  var w = weightsFor(type, mood)
  var total = 0, k
  for (k in w) if (BEHAVIORS[k] && k !== previous) total += w[k]
  var roll = r() * total
  for (k in w) {
    if (!BEHAVIORS[k] || k === previous) continue
    roll -= w[k]
    if (roll <= 0) return k
  }
  return "idle"
}

function durationOf(name, r) {
  var b = BEHAVIORS[name]
  return b.dur[0] + (b.dur[1] - b.dur[0]) * r()
}

// Merge the resting pose, breathing, and the behaviour's overrides.
function composePose(name, p, t, mood) {
  var b = BEHAVIORS[name] || BEHAVIORS.idle
  var o = b.pose(p)
  var slow = mood === "sleepy" ? 0.6 : 1
  var breathe = Math.sin(t * 2.1 * slow)
  var out = {
    dx: o.dx || 0, dy: o.dy || 0,
    sx: (o.sx === undefined ? 1 : o.sx) * (1 - 0.014 * breathe),
    sy: (o.sy === undefined ? 1 : o.sy) * (1 + 0.026 * breathe),
    rot: o.rot || 0,
    eyes: o.eyes, mouth: o.mouth,
    lookX: o.lookX || 0, lookY: o.lookY || 0,
    tailAmp: o.tailAmp === undefined ? 1 : o.tailAmp,
    wing: o.wing || 0, blush: o.blush || 0, fx: o.fx || null,
    gait: o.gait === undefined ? 0 : o.gait, gaitAmt: o.gaitAmt || 0, gaitSync: !!o.gaitSync
  }
  if (mood === "sad") { out.sy *= 0.95; out.tailAmp = 0.2 }
  return out
}

// The pose while the user strokes the pet: a different happy face for each.
function strokePose(type, t) {
  switch (type) {
    case "cat":     return { eyes: "closed", mouth: "smile", dx: Math.sin(t * 55) * 0.7, sy: 0.97, tailAmp: 2, blush: 1 }
    case "dog":     return { eyes: "happy", mouth: "tongue", tailAmp: 4.6, rot: Math.sin(t * 14) * 0.03, blush: 0.7 }
    case "bunny":   return { eyes: "closed", mouth: "smile", sy: 0.92, sx: 1.06, blush: 1 }
    case "frog":    return { eyes: "closed", mouth: "smile", sx: 1 + 0.06 * Math.sin(t * 3), sy: 1 + 0.08 * Math.sin(t * 3), blush: 0.6 }
    case "panda":   return { eyes: "happy", mouth: "open", rot: Math.sin(t * 6) * 0.05, blush: 0.8 }
    case "fox":     return { eyes: "happy", mouth: "smile", tailAmp: 4.6, rot: -0.06, blush: 0.9 }
    case "dragon":  return { eyes: "closed", mouth: "smile", wing: Math.sin(t * 10) * 0.3, dy: Math.sin(t * 8) - 1, blush: 0.7, fx: { puff: 1 } }
    case "penguin": return { eyes: "happy", mouth: "open", wing: Math.sin(t * 18), blush: 0.8 }
  }
  return { eyes: "happy", mouth: "smile", blush: 0.8 }
}
