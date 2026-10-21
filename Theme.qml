// The widget's colours, all derived from the active Omarchy theme.
//
// Surfaces and text follow OColor (what the popups use), so the card looks like
// every other Omarchy panel. The pets themselves are tinted from the theme's
// own hues (colors.toml), so a theme switch repaints them too.

import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import "Palette.js" as Palette

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
  function solid(c) { var q = Qt.color(c); return String(Qt.rgba(q.r, q.g, q.b, 1)) }
  function lum(c) { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b }

  // The pets' colours come from Palette.js, shared with tools/gallery.mjs.
  function petPalette(type) {
    return Palette.petPalette(type, {
      bg: solid(bg), text: solid(text), accent: solid(accent), urgent: solid(urgent), hues: hues
    })
  }
}
