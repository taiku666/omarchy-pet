// Backgrounds, drawn in chunky 4px blocks beside the pixel pets. Every colour
// is mixed from the active Omarchy theme (`pal`, from Theme.roomPalette()), so
// a room is the same place in every theme, just painted in its colours.
// `t` is seconds, used for drifting clouds, twinkling stars and falling petals.

var BLOCK = 4

function hex(c) {
  var s = String(c)
  if (s.charAt(0) !== "#") return [128, 128, 128]
  if (s.length === 9) s = "#" + s.slice(3)           // #aarrggbb
  return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
}
function mix(a, b, k) {
  var x = hex(a), y = hex(b)
  var r = Math.round(x[0] + (y[0] - x[0]) * k), g = Math.round(x[1] + (y[1] - x[1]) * k), bl = Math.round(x[2] + (y[2] - x[2]) * k)
  return "rgb(" + r + "," + g + "," + bl + ")"
}
function rgba(c, a) { var x = hex(c); return "rgba(" + x[0] + "," + x[1] + "," + x[2] + "," + a + ")" }

function band(ctx, w, y0, y1, colors) {
  var h = (y1 - y0) / colors.length
  for (var i = 0; i < colors.length; i++) {
    ctx.fillStyle = colors[i]
    ctx.fillRect(0, Math.floor(y0 + i * h), w, Math.ceil(h) + 1)
  }
}
function ramp(from, to, n) {
  var out = []
  for (var i = 0; i < n; i++) out.push(mix(from, to, n === 1 ? 0 : i / (n - 1)))
  return out
}
function blob(ctx, x, y, cols, color) {
  ctx.fillStyle = color
  for (var r = 0; r < cols.length; r++) {
    var wpx = cols[r] * BLOCK
    ctx.fillRect(Math.round(x - wpx / 2), y + r * BLOCK, wpx, BLOCK)
  }
}
function hill(ctx, w, baseY, amp, period, phase, color) {
  ctx.fillStyle = color
  for (var x = 0; x < w; x += BLOCK) {
    var top = baseY - Math.round((Math.sin(x / period + phase) * 0.5 + 0.5) * amp / BLOCK) * BLOCK
    ctx.fillRect(x, top, BLOCK, baseY - top + 400)
  }
}
function hash(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x) }
function cloud(ctx, x, y, color) { blob(ctx, x, y, [4, 7, 9, 7], color) }

function drawRoom(ctx, w, h, room, t, floorY, pal) {
  var i, x, y, c
  var bg = pal.bg, fg = pal.fg
  switch (room) {
    case "night": {
      band(ctx, w, 0, floorY, ramp(mix(bg, "#000000", 0.35), mix(bg, pal.blue, 0.35), 6))
      for (i = 0; i < 40; i++) {
        x = Math.floor(hash(i) * w / BLOCK) * BLOCK; y = Math.floor(hash(i + 50) * (floorY - 40) / BLOCK) * BLOCK
        c = 0.5 + 0.5 * Math.sin(t * (1 + hash(i + 9) * 2) + i)
        ctx.fillStyle = rgba(fg, (0.3 + 0.7 * c).toFixed(2))
        ctx.fillRect(x, y, BLOCK / (i % 5 === 0 ? 1 : 2), BLOCK / (i % 5 === 0 ? 1 : 2))
      }
      blob(ctx, w - 64, 26, [3, 5, 5, 5, 3], mix(fg, pal.yellow, 0.4))
      ctx.fillStyle = mix(bg, pal.blue, 0.2); ctx.fillRect(w - 64, 26, 12, 20)
      hill(ctx, w, floorY, 36, 55, 1.2, mix(bg, pal.blue, 0.3)); hill(ctx, w, floorY + 8, 22, 38, 3, mix(bg, pal.green, 0.28))
      ctx.fillStyle = mix(bg, pal.green, 0.38); ctx.fillRect(0, floorY + 20, w, h)
      for (i = 0; i < 7; i++) {
        x = (hash(i + 100) * w + Math.sin(t * 0.7 + i) * 18 + w) % w
        y = floorY - 10 + Math.sin(t * 0.9 + i * 2) * 26
        ctx.fillStyle = rgba(pal.yellow, (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))).toFixed(2))
        ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 4, 4)
      }
      break
    }
    case "beach": {
      band(ctx, w, 0, floorY - 36, ramp(mix(bg, pal.cyan, 0.3), mix(bg, pal.cyan, 0.5), 4))
      blob(ctx, 62, 30, [3, 5, 5, 5, 3], pal.yellow)
      cloud(ctx, ((t * 6) % (w + 80)) - 40, 34, rgba(fg, 0.85))
      band(ctx, w, floorY - 36, floorY - 4, ramp(mix(bg, pal.blue, 0.55), mix(bg, pal.cyan, 0.7), 4))
      for (i = 0; i < 9; i++) {
        x = ((i * 44 + t * 14) % (w + 40)) - 20
        ctx.fillStyle = rgba(fg, 0.55); ctx.fillRect(Math.round(x / 4) * 4, floorY - 36 + (i % 4) * 8, 16, 4)
      }
      ctx.fillStyle = mix(bg, pal.yellow, 0.55); ctx.fillRect(0, floorY - 4, w, h)
      ctx.fillStyle = mix(bg, pal.yellow, 0.42)
      for (i = 0; i < 20; i++) ctx.fillRect(Math.floor(hash(i + 7) * w / 4) * 4, floorY + 6 + Math.floor(hash(i + 3) * 8) * 4, 4, 4)
      ctx.fillStyle = pal.red; ctx.fillRect(40, floorY + 28, 8, 8); ctx.fillStyle = fg; ctx.fillRect(44, floorY + 28, 4, 4)
      break
    }
    case "snow": {
      band(ctx, w, 0, floorY, ramp(mix(bg, fg, 0.12), mix(bg, fg, 0.34), 5))
      hill(ctx, w, floorY, 30, 60, 0.4, mix(bg, fg, 0.42)); hill(ctx, w, floorY + 6, 18, 40, 2.2, mix(bg, fg, 0.6))
      ctx.fillStyle = mix(bg, fg, 0.78); ctx.fillRect(0, floorY + 18, w, h)
      for (i = 0; i < 2; i++) {
        x = 36 + i * 250; y = floorY - 8
        var pine = mix(bg, pal.green, 0.55)
        blob(ctx, x, y - 40, [2, 4, 6], pine); blob(ctx, x, y - 28, [4, 6, 8], pine); blob(ctx, x, y - 12, [6, 8, 10], pine)
        ctx.fillStyle = mix(bg, pal.orange, 0.3); ctx.fillRect(x - 4, y + 8, 8, 12)
        ctx.fillStyle = fg; ctx.fillRect(x - 4, y - 44, 8, 4)
      }
      for (i = 0; i < 36; i++) {
        x = (hash(i) * w + Math.sin(t + i) * 10 + w) % w
        y = ((hash(i + 40) * h + t * (18 + hash(i + 9) * 22)) % h)
        ctx.fillStyle = rgba(fg, 0.9); ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 4, 4)
      }
      break
    }
    case "sakura": {
      band(ctx, w, 0, floorY, ramp(mix(bg, pal.magenta, 0.2), mix(bg, pal.magenta, 0.42), 5))
      var wood = mix(bg, pal.orange, 0.45)
      ctx.fillStyle = wood; ctx.fillRect(20, floorY - 90, 12, 100); ctx.fillRect(28, floorY - 60, 24, 8); ctx.fillRect(48, floorY - 76, 8, 20)
      blob(ctx, 30, floorY - 118, [8, 12, 14, 12, 8], mix(pal.magenta, pal.red, 0.35)); blob(ctx, 62, floorY - 94, [6, 10, 10, 6], mix(pal.magenta, fg, 0.2)); blob(ctx, 8, floorY - 86, [6, 8, 6], mix(pal.magenta, pal.red, 0.15))
      hill(ctx, w, floorY, 20, 50, 0.9, mix(bg, pal.green, 0.4))
      ctx.fillStyle = mix(bg, pal.green, 0.5); ctx.fillRect(0, floorY + 18, w, h)
      for (i = 0; i < 24; i++) {
        x = (hash(i) * w + t * 16 + Math.sin(t * 1.3 + i) * 14) % w
        y = ((hash(i + 40) * h + t * (14 + hash(i + 9) * 16)) % h)
        ctx.fillStyle = i % 3 ? mix(pal.magenta, fg, 0.3) : pal.red; ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 4, 4)
      }
      break
    }
    case "space": {
      band(ctx, w, 0, floorY, ramp(mix(bg, "#000000", 0.5), mix(bg, pal.magenta, 0.35), 6))
      for (i = 0; i < 60; i++) {
        x = Math.floor(hash(i) * w / 2) * 2; y = Math.floor(hash(i + 60) * floorY / 2) * 2
        c = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + hash(i + 3)) + i))
        ctx.fillStyle = rgba(fg, c.toFixed(2)); ctx.fillRect(x, y, i % 7 === 0 ? 4 : 2, i % 7 === 0 ? 4 : 2)
      }
      blob(ctx, w - 70, 56, [4, 8, 10, 12, 12, 10, 8, 4], pal.orange)
      ctx.fillStyle = mix(pal.orange, fg, 0.4); ctx.fillRect(w - 94, 56, 48, 4); ctx.fillStyle = fg; ctx.fillRect(w - 94, 60, 80, 4)
      blob(ctx, 56, 44, [3, 5, 5, 3], pal.cyan)
      ctx.fillStyle = mix(bg, fg, 0.18); ctx.fillRect(0, floorY, w, h)
      ctx.fillStyle = mix(bg, fg, 0.3); ctx.fillRect(0, floorY, w, 4)
      for (i = 0; i < 5; i++) blob(ctx, 40 + i * 70, floorY + 28 + (i % 2) * 14, [3, 5, 3], mix(bg, fg, 0.1))
      break
    }
    default: { // meadow
      band(ctx, w, 0, floorY, ramp(mix(bg, pal.cyan, 0.4), mix(bg, pal.cyan, 0.72), 5))
      blob(ctx, w - 58, 30, [3, 5, 5, 5, 3], pal.yellow)
      cloud(ctx, ((t * 5) % (w + 90)) - 45, 30, rgba(fg, 0.85)); cloud(ctx, ((t * 3 + 160) % (w + 90)) - 45, 62, rgba(fg, 0.6))
      hill(ctx, w, floorY, 34, 60, 0.3, mix(bg, pal.green, 0.5)); hill(ctx, w, floorY + 8, 22, 40, 2.4, mix(bg, pal.green, 0.65))
      ctx.fillStyle = mix(bg, pal.green, 0.6); ctx.fillRect(0, floorY + 20, w, h)
      ctx.fillStyle = mix(bg, pal.green, 0.42)
      for (i = 0; i < 26; i++) ctx.fillRect(Math.floor(hash(i + 11) * w / 4) * 4, floorY + 24 + Math.floor(hash(i + 5) * 12) * 4, 4, 8)
      var flowers = [pal.red, pal.yellow, fg, pal.magenta]
      for (i = 0; i < 9; i++) {
        x = Math.floor(hash(i + 21) * w / 4) * 4; y = floorY + 26 + Math.floor(hash(i + 31) * 10) * 4
        ctx.fillStyle = flowers[i % 4]; ctx.fillRect(x, y, 4, 4); ctx.fillStyle = pal.yellow; ctx.fillRect(x + 1, y + 1, 2, 2)
      }
    }
  }
}
