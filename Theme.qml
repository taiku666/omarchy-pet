// The widget's colours, all derived from the active Omarchy theme.
//
// Surfaces and text follow OColor (what the popups use), so the card looks like
// every other Omarchy panel. The pets themselves are tinted from the theme's
// own hues (colors.toml), so a theme switch repaints them too.

import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons

QtObject {
  id: t

  // `key = "#rrggbb"` pairs from the current theme's colors.toml. Reassigned as
  // a whole so everything that reads it re-evaluates on a theme switch.
  property var hues: ({})

  readonly property color bg: OColor.popups.background
  readonly property color text: OColor.popups.text
  readonly property color border: OColor.popups.border
  readonly property color accent: OColor.accent
  readonly property color urgent: OColor.urgent

  function mix(a, b, k) {
    return Qt.rgba(a.r * (1 - k) + b.r * k, a.g * (1 - k) + b.g * k, a.b * (1 - k) + b.b * k, a.a * (1 - k) + b.a * k)
  }
  function hue(name, fallback) {
    var v = hues[name]
    return v ? Qt.color(v) : (fallback !== undefined ? fallback : accent)
  }

  readonly property color surface: mix(bg, text, 0.07)
  readonly property color surfaceHi: mix(bg, text, 0.14)
  readonly property color line: mix(bg, text, 0.24)
  readonly property color dim: mix(bg, text, 0.62)
  readonly property color good: hue("green", accent)
  readonly property color warn: hue("yellow", accent)
  readonly property color bad: hue("red", urgent)
  readonly property color love: hue("magenta", accent)
  readonly property color gold: hue("yellow", accent)
  readonly property color onAccent: mix(bg, "#000000", 0.2)

  property FileView file: FileView {
    path: OColor.currentThemePath + "/colors.toml"
    watchChanges: true
    onFileChanged: reload()
    onLoaded: {
      var out = {}
      var lines = String(text()).split("\n")
      for (var i = 0; i < lines.length; i++) {
        var m = lines[i].match(/^\s*([A-Za-z0-9_]+)\s*=\s*["']?(#[0-9A-Fa-f]{6})/)
        if (m) out[m[1].toLowerCase()] = m[2]
      }
      t.hues = out
    }
  }

  function css(c) { return String(Qt.color(c)) }
  function lum(c) { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b }

  // Which theme hue each pet wears.
  readonly property var petHue: ({
    cat: "orange", dog: "brown", bunny: "bright_foreground", frog: "green",
    panda: "bright_foreground", fox: "red", dragon: "cyan", penguin: "magenta"
  })

  function petPalette(type) {
    var fgc = hue("bright_foreground", text)
    var base = hue(petHue[type], accent)
    if (type === "dog" && !hues["brown"]) base = mix(hue("orange", accent), "#000000", 0.25)
    var black = Qt.color("#000000")
    var dark = mix(bg, fgc, 0.1)
    var p = {
      b: css(base),
      l: css(mix(base, fgc, 0.68)),
      d: css(mix(base, black, 0.25)),
      o: css(mix(base, black, 0.58)),
      p: css(mix(hue("red", urgent), fgc, 0.38)),
      a: css(mix(base, hue("yellow", accent), 0.5)),
      w: css(fgc),
      k: css(dark),
      e: css(mix(bg, black, 0.5)),
      m: css(mix(bg, black, 0.35)),
      t: css(hue("red", urgent)),
      gold: css(gold),
      cheek: Math.round(hue("red", urgent).r * 255) + "," + Math.round(hue("red", urgent).g * 255) + "," + Math.round(hue("red", urgent).b * 255),
      hat: {
        o: css(mix(bg, black, 0.3)), a: css(hue("magenta", accent)), w: css(fgc), y: css(gold),
        c: css(hue("cyan", accent)), g: css(hue("green", accent)), b: css(hue("blue", accent)),
        v: css(mix(hue("blue", accent), black, 0.45)), k: css(mix(bg, black, 0.45)),
        r: css(hue("red", urgent)), p: css(mix(hue("magenta", accent), fgc, 0.4))
      }
    }
    if (type === "panda") { p.d = css(mix(fgc, bg, 0.3)); p.l = css(fgc); p.o = css(mix(bg, black, 0.5)) }
    if (type === "penguin") { p.k = css(mix(base, black, 0.55)); p.d = css(mix(base, black, 0.7)); p.o = css(mix(base, black, 0.82)); p.a = css(hue("orange", accent)) }
    return p
  }

  // Colours the room backgrounds draw with.
  function roomPalette() {
    var fgc = hue("bright_foreground", text)
    return {
      bg: css(bg), fg: css(fgc), accent: css(accent), dim: css(dim),
      green: css(hue("green", accent)), yellow: css(hue("yellow", accent)), cyan: css(hue("cyan", accent)),
      blue: css(hue("blue", accent)), magenta: css(hue("magenta", accent)), red: css(hue("red", urgent)),
      orange: css(hue("orange", accent)), surface: css(surface), line: css(line)
    }
  }
}
