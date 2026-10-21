// The pet on the bar: it wanders along the strip, naps, hops, and can be
// stroked by dragging over it. A tap opens the care popup, and while that is
// open the pet is inside it instead (see PetView), so the window hides.
//
// Same trick as the navbar cat: a transparent overlay window the height of the
// bar, click-through everywhere except a box around the pet while it stands
// still, so a walking pet never swallows a click meant for a bar widget.

import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Hyprland
import "Sprites.js" as Sprites
import "Anim.js" as Anim
import "Logic.js" as Logic

Item {
  id: bp

  property var ctl: null

  readonly property var shell: ctl ? ctl.shell : null
  readonly property var bar: shell ? shell.bar : null
  readonly property string barPosition: bar ? String(bar.position) : "top"
  readonly property bool vertical: barPosition === "left" || barPosition === "right"
  readonly property int barSize: bar && bar.barSize ? bar.barSize : 26
  readonly property bool barHidden: bar ? bar.barHidden === true : false

  readonly property var st: ctl ? ctl.ps : null
  property bool hatched: false
  property string petType: "cat"

  // One pet, on the output Hyprland has focused when it was placed.
  readonly property var petScreen: ctl ? ctl.screenObj : null
  readonly property real barLength: petScreen ? petScreen.width : 0

  // Published for the popup, which opens under the pet.
  property real petX: 0
  readonly property real art: Math.max(0.8, barSize * 0.8 / 18)
  property bool maskActive: false
  property real maskX: 0
  property real maskW: 0

  property var wd: ({
    x: 0, face: 1, beh: null, later: [], pose: null,
    blinkAt: 0, blinkUntil: 0, particles: [], strokeUntil: 0, strokeDist: 0,
    lastFrame: 0, t0: Date.now(), seed: Date.now() % 2147483647, lastZ: 0,
    react: null, moving: false, lastSpoke: 0, pressX: 0, dragged: false, lastPurr: 0
  })

  function rnd() { wd.seed = (wd.seed * 16807) % 2147483647; return wd.seed / 2147483647 }
  function now() { return Date.now() }

  function stageScale() { return 0.82 + 0.06 * (st ? Logic.stageForLevel(st.level) : 0) }
  function spriteW() { return 20 * art * stageScale() }

  // The stretches of the bar covered by widgets, merged and sorted. The pet
  // may walk over them but only comes to rest outside. Plugins get no view of
  // the bar's slots, so the shell's geometry dump is polled while the pet is up.
  function occupied() { return wd.occ || [] }

  function takeGeometry(text) {
    var rows
    try { rows = JSON.parse(text) } catch (e) { return }
    var list = []
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]
      if (r && r.visible && r.width > 0 && r.height > 0) list.push({ a: r.x, b: r.x + r.width })
    }
    list.sort(function (l, r) { return l.a - r.a })
    var merged = []
    for (var j = 0; j < list.length; j++) {
      var last = merged.length ? merged[merged.length - 1] : null
      if (last && list[j].a <= last.b) last.b = Math.max(last.b, list[j].b)
      else merged.push({ a: list[j].a, b: list[j].b })
    }
    wd.occ = merged
  }

  Process {
    id: geom
    command: ["omarchy-shell", "shell", "debugBarGeometry"]
    stdout: StdioCollector { onStreamFinished: bp.takeGeometry(text) }
  }

  Timer {
    interval: 1500
    repeat: true
    running: win.visible
    triggeredOnStart: true
    onTriggered: if (!geom.running) geom.running = true
  }

  function isFree(x) {
    var half = spriteW() / 2 + 4, occ = occupied()
    for (var i = 0; i < occ.length; i++) if (x + half > occ[i].a && x - half < occ[i].b) return false
    return true
  }

  // The free spot nearest to x, or the middle of the bar when nothing fits.
  function restSpot(x) {
    var half = spriteW() / 2 + 4, occ = occupied()
    var best = -1, bestD = 1e9, lo = 0
    for (var i = 0; i <= occ.length; i++) {
      var hi = i < occ.length ? occ[i].a : barLength
      if (hi - lo >= half * 2) {
        var c = Math.max(lo + half, Math.min(hi - half, x))
        if (Math.abs(c - x) < bestD) { bestD = Math.abs(c - x); best = c }
      }
      if (i < occ.length) lo = occ[i].b
    }
    return best < 0 ? barLength / 2 : best
  }

  function setBehavior(name) {
    var b = Anim.BEHAVIORS[name]
    var forced = !b.move && !isFree(wd.x)
    if (forced) { name = "walk"; b = Anim.BEHAVIORS.walk }
    var margin = spriteW() / 2 + 6
    var target = wd.x
    if (b.move) {
      var reach = barLength * [0, 0.05, 0.1, 0.2][b.move]
      target = wd.x + (rnd() < 0.5 ? -1 : 1) * reach * (0.5 + rnd() * 0.5)
      target = Math.max(margin, Math.min(barLength - margin, target))
      if (!forced && Math.abs(target - wd.x) < 24) target = Math.max(margin, Math.min(barLength - margin, wd.x + (wd.x > barLength / 2 ? -1 : 1) * reach * 0.5))
      target = restSpot(target)
      wd.face = target >= wd.x ? 1 : -1
    }
    wd.beh = { name: name, start: now(), dur: Anim.durationOf(name, rnd), startX: wd.x, targetX: target }
  }

  function burstHeart(x, y) {
    if (wd.particles.length > 40) wd.particles.shift()
    wd.particles.push({ type: "heart", x: x + (rnd() - 0.5) * 8, y: y, vx: (rnd() - 0.5) * 8, vy: -14 - rnd() * 10, life: 1.0, age: 0 })
  }

  function strokeOnce(x) {
    var r = ctl.stroke(1.6)
    if (!r) return
    burstHeart(x, win.height - spriteW() * 0.9)
    var t = now()
    if (t - wd.lastPurr > 900) { wd.lastPurr = t; ctl.sfx(petType === "cat" ? "purr" : "heart") }
  }

  function frame() {
    var t = now()
    var dt = Math.min(0.1, (t - wd.lastFrame) / 1000)
    wd.lastFrame = t
    if (!st) return
    var h0 = !!(st.pet && st.pet.hatched)
    if (h0 !== hatched) hatched = h0
    var pt0 = st.pet ? st.pet.type : "cat"
    if (pt0 !== petType) petType = pt0
    if (barLength <= 0) return
    var ts = (t - wd.t0) / 1000
    var i
    var half = spriteW() / 2 + 4

    if (wd.x === 0) wd.x = restSpot(Math.min(barLength - half, barLength * 0.72))
    wd.x = Math.max(half, Math.min(barLength - half, wd.x))

    var pose = null
    var sleeping = hatched && st.sleeping
    var mood = hatched ? Logic.mood(st) : "happy"
    wd.moving = false

    if (hatched) {
      if (!sleeping) wd.sleepTo = undefined
      if (wd.react && t > wd.react.start + wd.react.dur) wd.react = null
      if (sleeping) {
        wd.beh = null
        if (wd.sleepTo === undefined && !isFree(wd.x)) {
          var rs = restSpot(wd.x)
          if (Math.abs(rs - wd.x) > 1) wd.sleepTo = rs
        }
        if (wd.sleepTo !== undefined) {
          // Not yet on a free spot: shuffle there before dozing off.
          var dxs = wd.sleepTo - wd.x, stp = 90 * dt
          wd.face = dxs >= 0 ? 1 : -1
          if (Math.abs(dxs) <= stp) { wd.x = wd.sleepTo; wd.sleepTo = undefined }
          else wd.x += (dxs > 0 ? 1 : -1) * stp
          wd.moving = true
          pose = Anim.composePose("walk", (ts * 0.6) % 1, ts, "sleepy")
        } else {
          pose = Anim.composePose("nap", 0, ts, "sleepy")
          pose.rot = 0; pose.eyes = "closed"; pose.mouth = "none"; pose.tailAmp = 0.4
        }
        if (!wd.moving && t - wd.lastZ > 1600) { wd.lastZ = t; wd.particles.push({ type: "zzz", x: wd.x + spriteW() * 0.45, y: win.height - spriteW() * 0.8, vx: 5, vy: -9, life: 2, age: 0 }) }
      } else if (wd.react) {
        pose = Anim.composePose(wd.react.name, Math.min(1, (t - wd.react.start) / wd.react.dur), ts, mood)
      } else if (t < wd.strokeUntil) {
        pose = Anim.composePose("idle", 0, ts, "happy")
        var sp = Anim.strokePose(petType, ts)
        for (var k in sp) pose[k] = sp[k]
      } else {
        if (!wd.beh || t > wd.beh.start + wd.beh.dur) setBehavior(Anim.pickBehavior(petType, mood, rnd, wd.beh ? wd.beh.name : ""))
        var p = Math.min(1, (t - wd.beh.start) / wd.beh.dur)
        pose = Anim.composePose(wd.beh.name, p, ts, mood)
        if (Anim.BEHAVIORS[wd.beh.name].move) {
          var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
          wd.x = wd.beh.startX + (wd.beh.targetX - wd.beh.startX) * e
          wd.moving = p < 0.97
        }
      }
      // The pose values were authored for a 130px pet; shrink the vertical
      // ones so a hop stays inside the strip.
      pose.dy *= 0.4
      pose.dx = 0
      wd.pose = pose
    }

    for (i = wd.particles.length - 1; i >= 0; i--) {
      var q = wd.particles[i]
      q.age += dt
      if (q.age >= q.life) { wd.particles.splice(i, 1); continue }
      q.x += q.vx * dt; q.y += q.vy * dt
    }
    if (t > wd.blinkAt) { wd.blinkUntil = t + 130; wd.blinkAt = t + 2200 + rnd() * 4200 }

    petX = wd.x
    var active = !wd.moving && !ctl.popupOpen
    if (active !== maskActive) maskActive = active
    if (Math.abs(maskX - (wd.x - half)) > 0.5) maskX = wd.x - half
    maskW = half * 2
    canvas.requestPaint()
  }

  function thought() {
    if (!st || !hatched || st.sleeping) return ""
    var s = st.stats
    if (s.hunger < 30) return "🍎"
    if (s.energy < 25) return "💤"
    if (st.messes >= 2 || s.cleanliness < 28) return "🧼"
    if (s.affection < 25) return "💔"
    if (s.happiness < 25) return "💧"
    return ""
  }

  PanelWindow {
    id: win

    screen: bp.petScreen
    visible: !bp.vertical && bp.petScreen !== null && !bp.barHidden && ctl && ctl.loaded && !ctl.hidden && !ctl.popupOpen
    color: "transparent"
    exclusionMode: ExclusionMode.Ignore
    WlrLayershell.namespace: "omarchy-pet-bar"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.None

    anchors {
      top: bp.barPosition !== "bottom"
      bottom: bp.barPosition === "bottom"
      left: true
      right: true
    }
    implicitHeight: bp.barSize

    mask: Region {
      x: bp.maskActive ? Math.round(bp.maskX) : 0
      y: 0
      width: bp.maskActive ? Math.round(bp.maskW) : 0
      height: bp.maskActive ? win.height : 0
    }

    Canvas {
      id: canvas
      anchors.fill: parent
      onPaint: {
        var ctx = getContext("2d")
        ctx.reset()
        bp.paint(ctx, width, height)
      }
    }

    MouseArea {
      anchors.fill: parent
      enabled: bp.maskActive
      hoverEnabled: true
      cursorShape: bp.hatched ? (pressed ? Qt.ClosedHandCursor : Qt.OpenHandCursor) : Qt.PointingHandCursor
      property real lastX: 0
      onPressed: function (m) { bp.wd.pressX = m.x; bp.wd.dragged = false; lastX = m.x }
      onPositionChanged: function (m) {
        if (!pressed || !bp.hatched || bp.st.sleeping) return
        if (Math.abs(m.x - bp.wd.pressX) > 5) bp.wd.dragged = true
        bp.wd.strokeUntil = bp.now() + 500
        bp.wd.strokeDist += Math.abs(m.x - lastX)
        lastX = m.x
        while (bp.wd.strokeDist > 16) { bp.wd.strokeDist -= 16; bp.strokeOnce(m.x) }
      }
      onReleased: function (m) { if (!bp.wd.dragged) bp.ctl.togglePopup(bp.petX) }
    }

    Timer {
      interval: bp.st && bp.st.sleeping ? 100 : 33
      repeat: true
      running: win.visible
      onTriggered: bp.frame()
    }
  }

  function paint(ctx, w, h) {
    if (!st) return
    var t = now()
    var th = ctl.th
    var pose = wd.pose
    var footY = h - 2
    var S = art * stageScale()
    var shadowW = 9 * S

    ctx.fillStyle = "rgba(0,0,0,0.22)"
    ctx.beginPath(); ctx.ellipse(wd.x - shadowW, footY - 1.5, shadowW * 2, 3); ctx.fill()

    if (!hatched) {
      ctx.save()
      ctx.translate(wd.x, footY)
      ctx.rotate(Math.sin(t / 420) * 0.08)
      var ep = th.petPalette(petType)
      Sprites.drawEgg(ctx, art * 0.9 * 0.9, ep.b, 0, { o: th.css(th.line), b: th.css(th.mix(th.bg, th.text, 0.8)), k: th.css(th.dim) })
      ctx.restore()
    } else if (pose) {
      var mood = Logic.mood(st)
      var eyes = pose.eyes || (mood === "sad" ? "sad" : mood === "sleepy" ? "sleepy" : "open")
      if (eyes === "open" && t < wd.blinkUntil) eyes = "closed"
      var mouth = pose.mouth || (mood === "sad" ? "sad" : mood === "hungry" ? "oh" : mood === "sleepy" ? "flat" : "smile")
      var blush = pose.blush || (st.stats.affection > 80 ? 0.35 : 0)
      ctx.save()
      ctx.translate(wd.x, footY + pose.dy)
      ctx.rotate(pose.rot)
      ctx.scale(wd.face * pose.sx, pose.sy)
      Sprites.drawPet(ctx, {
        pal: th.petPalette(petType), type: petType, S: S, stage: Logic.stageForLevel(st.level),
        tailPhase: t / 1000 * (pose.tailAmp > 2.5 ? 12 : 4), tailAmp: pose.tailAmp * 0.6, wing: pose.wing,
        eyes: eyes, lookX: pose.lookX, lookY: pose.lookY, tear: 0, mouth: mouth, blush: blush,
        hat: st.equipped.hat, hatBob: 0
      })
      ctx.restore()
    }

    for (var i = 0; i < wd.particles.length; i++) {
      var p = wd.particles[i]
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life)
      if (p.type === "heart") Sprites.drawHeart(ctx, p.x, p.y, 1, String(th.love))
      else if (p.type === "zzz") { ctx.fillStyle = String(th.text); ctx.font = "bold " + Math.round(h * 0.34) + "px monospace"; ctx.textAlign = "center"; ctx.fillText("z", p.x, p.y) }
      ctx.globalAlpha = 1
    }

    var tt = thought()
    if (tt !== "") {
      ctx.font = Math.round(h * 0.42) + "px 'Noto Color Emoji'"
      ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.fillText(tt, wd.x + spriteW() * 0.55, h * 0.3 + Math.sin(t / 350) * 1.5)
    }
  }
}
