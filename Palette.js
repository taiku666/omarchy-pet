// Pet colours derived from a theme. Pure, so the shell (Theme.qml) and the
// gallery script (tools/gallery.mjs) paint exactly the same pets.
//
// The look is calm: every pet is a theme hue pulled toward the background, with
// one accent colour for details, so it sits in the UI instead of shouting over it.
//
// env: { bg, text, accent, urgent, hues: { name: "#rrggbb" } }, all "#rrggbb".

function palHex(c) {
  var s = "#"
  for (var i = 0; i < 3; i++) {
    var v = Math.max(0, Math.min(255, Math.round(c[i])))
    s += (v < 16 ? "0" : "") + v.toString(16)
  }
  return s
}
function palRgb(h) {
  return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]
}
function palMix(a, b, k) {
  var x = palRgb(a), y = palRgb(b)
  return palHex([x[0] * (1 - k) + y[0] * k, x[1] * (1 - k) + y[1] * k, x[2] * (1 - k) + y[2] * k])
}

var PAL_HUE = {
  cat: "orange", dog: "brown", bunny: "foreground", frog: "green",
  panda: "foreground", fox: "red", dragon: "cyan", penguin: "blue"
}

function palLum(h) { var c = palRgb(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 }

function petPalette(type, env) {
  var BLACK = "#000000", WHITE = "#ffffff"
  function hue(name, fallback) { return env.hues[name] || (fallback !== undefined ? fallback : env.accent) }
  var bg = env.bg
  var dark = palLum(bg) < 0.5
  // Shading and outlines pull toward `ink`, light areas toward `paper`; both
  // flip on a light theme so outlines stay visible and bellies stay pale.
  var ink = dark ? bg : env.text
  var paper = dark ? hue("foreground", env.text) : palMix(bg, WHITE, 0.6)
  var bright = dark ? hue("bright_foreground", env.text) : palMix(bg, WHITE, 0.8)
  var red = hue("red", env.urgent)
  var mark = palMix(env.accent, paper, 0.25)

  var base = hue(PAL_HUE[type], env.accent)
  if (type === "dog" && !env.hues.brown) base = palMix(hue("orange"), BLACK, 0.25)
  if (type === "fox") base = palMix(red, hue("orange", red), 0.5)

  var b, d, o, l, k, a, aw
  if (type === "bunny" || type === "panda") {
    b = palMix(paper, bg, 0.15)
    l = palMix(paper, bg, 0.05)
    d = palMix(paper, ink, 0.4)
    o = palMix(ink, BLACK, 0.5)
    k = type === "panda" ? palMix(ink, paper, 0.16) : palMix(paper, ink, 0.45)
    a = type === "panda" ? palMix(hue("green"), bg, 0.2) : palMix(b, red, 0.3)
  } else if (type === "penguin") {
    b = palMix(base, ink, 0.6)
    d = palMix(b, ink, 0.4)
    o = palMix(b, ink, 0.8)
    k = b
    l = palMix(paper, bg, 0.1)
    a = palMix(hue("orange"), bg, 0.2)
  } else {
    // On a dark theme the body is the widgets' text colour, tinted by the pet's hue.
    b = dark ? palMix(base, env.text, 0.6) : palMix(base, bg, 0.25)
    d = palMix(b, ink, 0.4)
    o = palMix(b, ink, 0.8)
    l = palMix(b, paper, 0.55)
    k = palMix(b, ink, 0.7)
    a = (type === "frog" || type === "dragon") ? mark : d
  }
  aw = palMix(a, bg, 0.3)
  var cheek = palRgb(palMix(b, red, 0.3))

  return {
    b: b, l: l, d: d, o: o, k: k, a: a, aw: aw,
    p: palMix(b, red, 0.4),
    w: palMix(bright, paper, 0.5),
    e: palMix(ink, BLACK, 0.5),
    m: palMix(ink, BLACK, 0.35),
    t: palMix(red, bg, 0.35),
    gold: palMix(mark, paper, 0.35),
    cheek: Math.round(cheek[0]) + "," + Math.round(cheek[1]) + "," + Math.round(cheek[2]),
    hat: {
      o: palMix(ink, BLACK, 0.3), a: hue("magenta"), w: bright, y: hue("yellow"),
      c: hue("cyan"), g: hue("green"), b: hue("blue"),
      v: palMix(hue("blue"), BLACK, 0.45), k: palMix(ink, BLACK, 0.45),
      r: red, p: palMix(hue("magenta"), bright, 0.4)
    }
  }
}
