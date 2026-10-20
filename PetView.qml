// The little world the pet lives in: background, the pet itself, particles,
// messes, mini-games, and everything that answers a mouse. It owns animation
// state only; the numbers (stats, coins, xp) belong to `ctl` (Pet.qml).

import QtQuick
import "Sprites.js" as Sprites
import "Anim.js" as Anim
import "Scenes.js" as Scenes
import "Logic.js" as Logic

Item {
  id: view

  property var ctl: null
  property bool active: true          // false = not worth redrawing (hidden)
  property bool strokeMode: false     // the Pet button: stroking counts double

  readonly property var st: ctl ? ctl.ps : null
  property bool hatched: false
  property string petType: "cat"
  readonly property real art: Math.round(height / 232 * 6.5 * 2) / 2
  readonly property real floorY: height * 0.70
  readonly property real footY: height * 0.82

  // Read by Pet.qml's overlays (speech, thoughts, game HUD).
  property real headX: width / 2
  property real headY: height / 2
  property string thought: ""
  property string speech: ""
  property bool gameActive: false
  property string gameId: ""
  property int gameScore: 0
  property real gameProgress: 0
  property bool overPet: false

  // ----------------------------------------------------------- world state
  // Plain JS, not properties: these change every frame.
  property var wd: ({
    x: 0, y: 0, face: 1,
    beh: null, react: null, later: [],
    blinkAt: 0, blinkUntil: 0,
    lookX: 0, lookY: 0,
    particles: [], strokeUntil: 0, strokeDist: 0, lastPurr: 0,
    taps: 0, hatching: 0,
    mouseX: 0, mouseY: 0, pressed: false, lastFrame: 0, t0: Date.now(),
    nextRandom: 0, nextSpeech: 0, nextThought: 0,
    game: null, entity: null, nextEntity: 0, suds: 0, lastZ: 0, shake: 0,
    seed: Date.now() % 2147483647, lastMood: ""
  })

  function rnd() { wd.seed = (wd.seed * 16807) % 2147483647; return wd.seed / 2147483647 }
  function now() { return Date.now() }
  function later(ms, fn) { wd.later.push({ at: now() + ms, fn: fn }) }

  readonly property var messSlots: [0.2, 0.78, 0.38, 0.62]

  function stageOf() { return st ? Logic.stageForLevel(st.level) : 0 }
  function bodyScale() { return Logic.STAGE_SCALE[stageOf()] }
  function mouthPoint() {
    var sc = bodyScale() * art
    return { x: wd.x, y: wd.y - 8 * sc }
  }

  // ------------------------------------------------------------- particles

  function spawn(p) {
    p.age = 0
    if (wd.particles.length > 120) wd.particles.shift()
    wd.particles.push(p)
  }
  function burst(kind, x, y, n, spread) {
    for (var i = 0; i < n; i++) {
      var a = rnd() * Math.PI * 2, sp = (spread || 60) * (0.4 + rnd() * 0.8)
      var p = { type: kind, x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0.8 + rnd() * 0.6, size: 1.6 + rnd() * 1.2 }
      if (kind === "heart") { p.vx *= 0.5; p.vy = -50 - rnd() * 40; p.life = 1.2 + rnd() * 0.5; p.size = 1.4 + rnd() * 1.2 }
      if (kind === "star") p.color = [String(ctl.th.gold), String(ctl.th.accent), String(ctl.th.hue("cyan")), String(ctl.th.good)][i % 4]
      if (kind === "crumb") { p.color = ["#d9a066", "#f2c88f", "#c8915a"][i % 3]; p.grav = 260 }
      spawn(p)
    }
  }
  function floatHeart(x, y) {
    spawn({ type: "heart", x: x + (rnd() - 0.5) * 24, y: y, vx: (rnd() - 0.5) * 20, vy: -45 - rnd() * 30, life: 1.4, size: 1.6 + rnd() * 1.4 })
  }

  // -------------------------------------------------------- public actions

  function say(text, ms) {
    view.speech = text
    speechTimer.interval = ms || 2600
    speechTimer.restart()
  }

  function playReact(name, extra) {
    var b = Anim.BEHAVIORS[name]
    var dur = Anim.durationOf(name, rnd)
    wd.react = { name: name, start: now(), dur: dur, extra: extra || null }
    return dur
  }

  // Feed: the food drops into the mouth, then the eating reaction plays.
  function eat(foodId, loved) {
    var food = Logic.FOODS[foodId]
    var m = mouthPoint()
    spawn({ type: "food", emoji: food.emoji, x: m.x, y: m.y - 130 * art / 6.5, tx: m.x, ty: m.y, life: 0.55, size: 2 })
    wd.lookTarget = { x: 0, y: -1, until: now() + 600 }
    later(560, function () {
      if (!view.hatched) return
      var d = playReact("eat")
      burst("crumb", m.x, m.y, 8, 70)
      ctl.sfx("eat")
      later(d, function () {
        if (loved) {
          playReact("love"); ctl.voice("happy")
          for (var i = 0; i < 6; i++) later(i * 160, function () { floatHeart(wd.x, wd.y - 14 * view.art) })
        } else {
          playReact("cheer")
          burst("star", wd.x, wd.y - 12 * view.art, 5, 70)
        }
      })
    })
  }

  function refuse() {
    playReact("poke")
    say("I'm full!", 1800)
    ctl.sfx("nope")
  }

  function levelUp(stageChanged) {
    playReact("cheer")
    burst("star", wd.x, wd.y - 12 * art, stageChanged ? 26 : 12, 110)
    if (stageChanged) {
      wd.flash = now()
      say("I grew!", 2800)
    } else say("Level up!", 2200)
  }

  function cleanUp() {
    wd.suds = now()
    playReact("clean")
    ctl.sfx("clean")
    for (var i = 0; i < 22; i++)
      spawn({ type: "bubble", x: rnd() * width, y: footY + 10 - rnd() * 30, vx: (rnd() - 0.5) * 30, vy: -30 - rnd() * 60, life: 1.1 + rnd() * 0.6, size: 2 + rnd() * 3 })
  }

  function goToSleep() { wd.beh = null; wd.react = null }

  function celebrate() {
    playReact("cheer")
    burst("star", wd.x, wd.y - 12 * art, 18, 110)
  }

  function startGame(id) {
    wd.react = null
    wd.game = { id: id, start: now(), dur: 15000, score: 0, acc: 0, items: [], nextSpawn: now() + 400, dx: wd.x, dy: footY, done: false }
    view.gameId = id
    view.gameScore = 0
    view.gameProgress = 0
    view.gameActive = true
    say(id === "ball" ? "Catch the balls!" : id === "bubbles" ? "Pop the bubbles!" : "Chase the dot!", 1800)
  }
  function endGame(early) {
    if (!wd.game) return
    var g = wd.game
    wd.game = null
    view.gameActive = false
    wd.y = footY
    ctl.finishGame(g.id, Math.floor(g.score))
  }

  // ------------------------------------------------------------- the frame

  function setBehavior(name) {
    var b = Anim.BEHAVIORS[name]
    var start = wd.x
    var target = start
    var margin = 14 * art * bodyScale() + 6
    if (b.move) {
      var reach = [0, 70, 110, 190][b.move]
      target = start + (rnd() < 0.5 ? -1 : 1) * (reach * (0.5 + rnd() * 0.5))
      target = Math.max(margin, Math.min(width - margin, target))
      if (Math.abs(target - start) < 20) target = start + (start > width / 2 ? -1 : 1) * reach * 0.5
      wd.face = target >= start ? 1 : -1
    }
    wd.beh = { name: name, start: now(), dur: Anim.durationOf(name, rnd), startX: start, targetX: target }
  }

  function currentMood() { return st ? Logic.mood(st) : "happy" }

  function frame() {
    var t = now()
    var dt = Math.min(0.1, (t - wd.lastFrame) / 1000)
    wd.lastFrame = t
    if (!st) return
    var h0 = !!(st.pet && st.pet.hatched)
    if (h0 !== hatched) hatched = h0
    var pt0 = st.pet ? st.pet.type : "cat"
    if (pt0 !== petType) petType = pt0
    var ts = (t - wd.t0) / 1000
    var i

    if (wd.x === 0) { wd.x = width / 2; wd.y = footY }
    var edge = 13 * art * bodyScale()
    if (wd.x > width - edge) wd.x = Math.max(edge, width - edge)
    if (wd.x < edge) wd.x = Math.min(width / 2, edge)
    if (!wd.game && Math.abs(wd.y - footY) > 0.5) wd.y += (footY - wd.y) * Math.min(1, dt * 6)

    // scheduled events
    for (i = wd.later.length - 1; i >= 0; i--) {
      if (wd.later[i].at <= t) { var f = wd.later[i].fn; wd.later.splice(i, 1); f() }
    }

    var mood = hatched ? currentMood() : "happy"
    var sleeping = hatched && st.sleeping
    var pose

    if (!hatched) {
      wd.pose = null
    } else if (wd.game) {
      pose = updateGame(t, dt, ts)
    } else {
      // behaviour selection
      if (wd.react && t > wd.react.start + wd.react.dur) wd.react = null
      if (sleeping) {
        wd.beh = null
        pose = Anim.composePose("nap", 0, ts, "sleepy")
        pose.sy *= 1.0
        pose.rot = 0.0
        pose.dy = 4
        pose.eyes = "closed"; pose.mouth = "none"
        pose.tailAmp = 0.4
        if (t - wd.lastZ > 1300) { wd.lastZ = t; spawn({ type: "zzz", x: wd.x + 12 * art * bodyScale(), y: wd.y - 15 * art * bodyScale(), vx: 14, vy: -24, life: 2.2, size: 1 }) }
      } else if (wd.react) {
        pose = Anim.composePose(wd.react.name, Math.min(1, (t - wd.react.start) / wd.react.dur), ts, mood)
      } else if (t < wd.strokeUntil) {
        pose = Anim.composePose("idle", 0, ts, "happy")
        var sp = Anim.strokePose(petType, ts)
        for (var k in sp) pose[k] = sp[k]
        if (sp.sy !== undefined) pose.sy = sp.sy * (1 + 0.02 * Math.sin(ts * 2))
        if (sp.sx !== undefined) pose.sx = sp.sx
      } else {
        if (!wd.beh || t > wd.beh.start + wd.beh.dur) {
          setBehavior(Anim.pickBehavior(petType, mood, rnd, wd.beh ? wd.beh.name : ""))
        }
        var p = Math.min(1, (t - wd.beh.start) / wd.beh.dur)
        pose = Anim.composePose(wd.beh.name, p, ts, mood)
        if (Anim.BEHAVIORS[wd.beh.name].move) {
          var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
          wd.x = wd.beh.startX + (wd.beh.targetX - wd.beh.startX) * e
        }
      }
      wd.pose = pose
    }
    pose = wd.pose

    // attention: eyes follow the pointer or the butterfly
    if (pose) {
      var tx = 0, ty = 0
      if (wd.lookTarget && t < wd.lookTarget.until) { tx = wd.lookTarget.x; ty = wd.lookTarget.y }
      else if (wd.entity && wd.entity.kind === "butterfly") { tx = wd.entity.x > wd.x ? 1 : -1; ty = wd.entity.y < wd.y - 60 ? -1 : 0 }
      else if (overPet || wd.pressed) { tx = wd.mouseX > wd.x + 8 ? 1 : wd.mouseX < wd.x - 8 ? -1 : 0; ty = wd.mouseY < wd.y - 90 ? -1 : 0 }
      if (!pose.lookX) pose.lookX = tx
      if (!pose.lookY) pose.lookY = ty
    }

    // occasional extras: butterflies, coins, small talk
    if (hatched && !wd.game && !sleeping) randomEvents(t)
    updateEntity(t, dt)

    // particles
    for (i = wd.particles.length - 1; i >= 0; i--) {
      var q = wd.particles[i]
      q.age += dt
      if (q.age >= q.life) { wd.particles.splice(i, 1); continue }
      if (q.type === "food") {
        var u = q.age / q.life
        q.px = q.x + (q.tx - q.x) * u; q.py = q.y + (q.ty - q.y) * u * u
        continue
      }
      if (q.grav) q.vy += q.grav * dt
      q.x += q.vx * dt; q.y += q.vy * dt
      if (q.type === "bubble" || q.type === "zzz") q.x += Math.sin(q.age * 4 + q.y * 0.05) * 0.4
    }

    // stage-3 pets shimmer
    if (hatched && stageOf() >= 3 && !sleeping && rnd() < dt * 1.6)
      spawn({ type: "sparkle", x: wd.x + (rnd() - 0.5) * 18 * art, y: wd.y - rnd() * 18 * art, vx: 0, vy: -8, life: 0.9, size: 1.2 })

    // blinking
    if (t > wd.blinkAt) { wd.blinkUntil = t + 130; wd.blinkAt = t + 2200 + rnd() * 4200 }

    // publish what the overlays need (only when changed, to avoid churn)
    var sc = bodyScale() * art
    var hx = wd.x + (pose ? pose.dx : 0), hy = wd.y + (pose ? pose.dy : 0) - 19 * sc
    if (Math.abs(hx - headX) > 0.5) headX = hx
    if (Math.abs(hy - headY) > 0.5) headY = hy
    var th = hatched && !wd.game ? thoughtFor(mood, sleeping) : ""
    if (th !== thought) thought = th

    fg.requestPaint()
  }

  function thoughtFor(mood, sleeping) {
    if (sleeping) return ""
    var s = st.stats
    if (s.hunger < 30) return "🍎"
    if (s.energy < 25) return "💤"
    if (st.messes >= 2 || s.cleanliness < 28) return "🧼"
    if (s.affection < 25) return "💔"
    if (s.happiness < 25) return "💧"
    return ""
  }

  function randomEvents(t) {
    if (t > wd.nextRandom) {
      wd.nextRandom = t + 25000 + rnd() * 40000
      if (!wd.entity && rnd() < 0.55) {
        if (rnd() < 0.6) wd.entity = { kind: "butterfly", start: t, x: -10, y: height * 0.35, dir: rnd() < 0.5 ? 1 : -1 }
        else wd.entity = { kind: "coin", start: t, x: 30 + rnd() * (width - 60), y: floorY + 24 + rnd() * (height - floorY - 40), life: 14000 }
        if (wd.entity.kind === "butterfly" && wd.entity.dir < 0) wd.entity.x = width + 10
        if (wd.entity.kind === "coin") { burst("star", wd.entity.x, wd.entity.y, 6, 50); say("What's that shiny thing?", 2200) }
      }
    }
    if (t > wd.nextSpeech) {
      wd.nextSpeech = t + 45000 + rnd() * 60000
      var p = Logic.PETS[petType]
      if (!view.speech) say(p.greetings[Math.floor(rnd() * p.greetings.length)], 2800)
    }
  }

  function updateEntity(t, dt) {
    var e = wd.entity
    if (!e) return
    if (e.kind === "butterfly") {
      var age = (t - e.start) / 1000
      e.x += e.dir * 46 * dt
      e.y = height * 0.33 + Math.sin(age * 2.3) * 28 + Math.sin(age * 5.1) * 8
      if (e.x < -20 || e.x > width + 20) {
        wd.entity = null
        if (hatched && rnd() < 0.5) playReact("hop")
      }
    } else if (e.kind === "coin") {
      if (t - e.start > e.life) wd.entity = null
    }
  }

  // ------------------------------------------------------------ mini-games

  function updateGame(t, dt, ts) {
    var g = wd.game
    var elapsed = t - g.start
    var sc = bodyScale() * art
    var pose
    var margin = 12 * sc
    var i, it

    view.gameProgress = Math.min(1, elapsed / g.dur)

    if (g.id === "ball") {
      var target = Math.max(margin, Math.min(width - margin, wd.mouseX))
      var d = target - wd.x
      var step = 300 * dt
      var moving = Math.abs(d) > 4
      if (moving) { wd.x += Math.max(-step, Math.min(step, d)); wd.face = d > 0 ? 1 : -1 }
      pose = Anim.composePose("idle", 0, ts, "playful")
      pose.dy = moving ? -Math.abs(Math.sin(ts * 22)) * 4 : 0
      pose.eyes = "open"; pose.mouth = "open"; pose.lookY = -1; pose.tailAmp = 3
      if (t > g.nextSpawn) {
        var gold = rnd() < 0.12
        g.items.push({ x: 18 + rnd() * (width - 36), y: -10, vy: 120 + rnd() * 60 + elapsed * 0.01, gold: gold })
        g.nextSpawn = t + 520 + rnd() * 320
      }
      for (i = g.items.length - 1; i >= 0; i--) {
        it = g.items[i]
        it.y += it.vy * dt
        var hit = Math.abs(it.x - wd.x) < 11 * sc && it.y > wd.y - 18 * sc && it.y < wd.y - 4 * sc
        if (hit) {
          g.score += it.gold ? 3 : 1
          g.items.splice(i, 1)
          burst(it.gold ? "star" : "crumb", it.x, it.y, 5, 50)
          ctl.sfx("bounce")
          continue
        }
        if (it.y > wd.y + 6) {
          g.items.splice(i, 1)
          burst("crumb", it.x, wd.y + 4, 3, 30)
        }
      }
    } else if (g.id === "bubbles") {
      pose = Anim.composePose("idle", 0, ts, "playful")
      pose.eyes = "open"; pose.mouth = "smile"; pose.tailAmp = 2.5
      var near = null
      if (t > g.nextSpawn) {
        var r = 14 + rnd() * 14
        g.items.push({ x: r + rnd() * (width - 2 * r), y: height + r, r: r, vy: 26 + rnd() * 26, ph: rnd() * 6, gold: rnd() < 0.1 })
        g.nextSpawn = t + 420 + rnd() * 360
      }
      for (i = g.items.length - 1; i >= 0; i--) {
        it = g.items[i]
        it.y -= it.vy * dt
        if (!near || it.y < near.y) near = it
        if (it.y < -it.r * 2) g.items.splice(i, 1)
      }
      if (near) { pose.lookX = near.x > wd.x ? 1 : -1; pose.lookY = near.y < wd.y - 60 ? -1 : 0 }
      if (g.hopUntil && t < g.hopUntil) { var hp = 1 - (g.hopUntil - t) / 380; pose.dy = -Math.sin(Math.PI * hp) * 12; pose.mouth = "open" }
    } else { // laser
      var dotX = Math.max(10, Math.min(width - 10, wd.mouseX))
      var dotY = Math.max(floorY + 8, Math.min(height - 8, wd.mouseY))
      g.dx = dotX; g.dy = dotY
      var dx = dotX - wd.x, dy = (dotY + 6) - wd.y
      var dist = Math.sqrt(dx * dx + dy * dy)
      var spd = 170 * dt
      if (dist > 6) { wd.x += dx / dist * Math.min(spd, dist); wd.y += dy / dist * Math.min(spd * 0.6, Math.abs(dy)) * (dy > 0 ? 1 : -1); wd.face = dx > 0 ? 1 : -1 }
      var close = dist < 26
      pose = Anim.composePose(close ? "foxZoom" : "idle", close ? (ts * 3) % 1 : 0, ts, "playful")
      pose.dx = 0
      pose.dy = close ? -Math.abs(Math.sin(ts * 30)) * 5 : (dist > 6 ? -Math.abs(Math.sin(ts * 22)) * 3 : 0)
      pose.eyes = "wide"; pose.mouth = close ? "open" : "smile"; pose.lookX = dx > 0 ? 1 : -1
      g.pinned = close
      if (close) { g.score += dt * 2.2; if (rnd() < dt * 8) burst("star", dotX, dotY, 1, 30) }
    }

    view.gameScore = Math.floor(g.score)
    if (elapsed >= g.dur && !g.done) { g.done = true; later(0, function () { endGame(false) }) }
    return pose
  }

  // ------------------------------------------------------------- painting

  Canvas {
    id: bg
    anchors.fill: parent
    visible: view.active
    onPaint: {
      var ctx = getContext("2d")
      ctx.reset()
      var room = view.st ? view.st.equipped.room : "meadow"
      Scenes.drawRoom(ctx, width, height, room, (Date.now() - view.wd.t0) / 1000, view.floorY, view.ctl.th.roomPalette())
    }
    Timer { interval: 180; repeat: true; running: view.active; onTriggered: bg.requestPaint() }
    onWidthChanged: requestPaint()
    onHeightChanged: requestPaint()
  }

  Canvas {
    id: fg
    anchors.fill: parent
    visible: view.active
    onPaint: {
      var ctx = getContext("2d")
      ctx.reset()
      view.paintWorld(ctx)
    }
  }

  function paintWorld(ctx) {
    if (!st) return
    var t = now()
    var art_ = art
    var i, p
    // messes sit on the grass behind the pet
    if (hatched) for (i = 0; i < st.messes; i++) Sprites.drawPoop(ctx, width * messSlots[i], footY + 4 + (i % 2) * 10, art_ * 0.55)

    var sc = bodyScale()
    var pose = wd.pose

    // ground shadow
    var lift = pose ? Math.max(0, -pose.dy) : 0
    var sw = (hatched ? 11 * sc : 6) * art_ * (1 - Math.min(0.4, lift / 90))
    ctx.fillStyle = "rgba(60,40,30,0.18)"
    ctx.beginPath(); ctx.ellipse(wd.x - sw, wd.y - sw * 0.14, sw * 2, sw * 0.28); ctx.fill()

    if (!hatched) {
      var wob = wd.hatching ? Math.sin(t / 30) * 0.12 : Math.sin(t / 420) * 0.05 * (1 + (wd.taps ? 2 : 0))
      ctx.save()
      ctx.translate(wd.x, wd.y)
      ctx.rotate(wob)
      var th0 = ctl.th, ep = th0.petPalette(petType)
      Sprites.drawEgg(ctx, art_ * 0.9, ep.b, wd.taps, { o: th0.css(th0.line), b: th0.css(th0.mix(th0.bg, th0.text, 0.8)), k: th0.css(th0.dim) })
      ctx.restore()
    } else if (pose) {
      var moodNow = currentMood()
      var eyes = pose.eyes
      if (!eyes) eyes = moodNow === "sad" ? "sad" : moodNow === "sleepy" ? "sleepy" : "open"
      if (eyes === "open" && t < wd.blinkUntil) eyes = "closed"
      var mouth = pose.mouth
      if (!mouth) mouth = moodNow === "sad" ? "sad" : moodNow === "hungry" ? "oh" : moodNow === "sleepy" ? "flat" : "smile"
      var blush = pose.blush
      if (!blush && st.stats.affection > 80) blush = 0.35

      var fx = pose.fx || {}
      var px = wd.x + pose.dx + (fx.shake ? Math.sin(t / 25) * 2 * fx.shake : 0)
      var py = wd.y + pose.dy
      var scale = sc * art_

      ctx.save()
      ctx.translate(px, py)
      if (fx.rollCenter) { ctx.translate(0, -9 * scale); ctx.rotate(pose.rot); ctx.translate(0, 9 * scale) }
      else ctx.rotate(pose.rot)
      ctx.scale(wd.face * pose.sx, pose.sy)
      var tailPhase = t / 1000 * (pose.tailAmp > 2.5 ? 12 : 4)
      Sprites.drawPet(ctx, {
        pal: ctl.th.petPalette(petType), type: petType, S: scale, stage: stageOf(),
        tailPhase: tailPhase, tailAmp: pose.tailAmp, wing: pose.wing,
        eyes: eyes, lookX: pose.lookX, lookY: pose.lookY, tear: moodNow === "sad" ? Math.floor(t / 350) : 0,
        mouth: mouth, blush: blush, hat: st.equipped.hat, hatBob: Math.round(Math.sin(t / 400))
      })
      ctx.restore()
      paintEffects(ctx, fx, px, py, scale, t)
    }

    paintEntity(ctx, t)
    paintGame(ctx, t)

    // particles on top
    for (i = 0; i < wd.particles.length; i++) {
      p = wd.particles[i]
      var life = 1 - p.age / p.life
      ctx.globalAlpha = Math.max(0, Math.min(1, life * 1.6))
      switch (p.type) {
        case "heart": Sprites.drawHeart(ctx, p.x, p.y, p.size * 1.6, String(ctl.th.love)); break
        case "star": Sprites.drawStar(ctx, p.x, p.y, p.size * 1.6, p.color); break
        case "sparkle": Sprites.drawStar(ctx, p.x, p.y, p.size, String(ctl.th.gold)); break
        case "crumb": ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3); break
        case "food":
          ctx.globalAlpha = 1; ctx.font = "26px 'Noto Color Emoji'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          ctx.fillText(p.emoji, p.px, p.py); break
        case "zzz":
          ctx.fillStyle = String(ctl.th.text); ctx.font = "bold " + Math.round(12 + p.age * 5) + "px monospace"; ctx.textAlign = "center"
          ctx.fillText("z", p.x, p.y); break
        case "bubble":
          ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.fillStyle = "rgba(190,230,255,0.45)"; ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break
        case "fire":
          ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x / 3) * 3, Math.round(p.y / 3) * 3, 6, 6); break
        case "note":
          ctx.fillStyle = String(ctl.th.love); ctx.font = "bold 14px monospace"; ctx.fillText("♪", p.x, p.y); break
      }
      ctx.globalAlpha = 1
    }

    if (wd.flash && t - wd.flash < 600) {
      ctx.fillStyle = "rgba(255,255,255," + (0.8 * (1 - (t - wd.flash) / 600)).toFixed(2) + ")"
      ctx.fillRect(0, 0, width, height)
    }
    if (strokeMode && hatched && !wd.game && !st.sleeping) {
      ctx.font = "26px 'Noto Color Emoji'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.globalAlpha = overPet ? 1 : 0.7
      ctx.fillText("🤚", wd.mouseX + 6, wd.mouseY + 8)
      ctx.globalAlpha = 1
    }
  }

  function paintEffects(ctx, fx, px, py, scale, t) {
    var mouthY = py - 8 * scale
    var mx = px + wd.face * 2 * scale
    var i
    if (fx.tongue > 0.02) { // frog snaps at a fly on the right
      var reach = fx.tongue * 60 * art / 6.5
      ctx.fillStyle = "#ff8fa8"
      ctx.fillRect(px + 10, mouthY - reach * 0.5, reach, 4)
      ctx.fillStyle = "#ff6b8f"; ctx.fillRect(px + 10 + reach, mouthY - reach * 0.5 - 2, 6, 8)
    }
    if (fx.fly) {
      var fx0 = px + 70 * art / 6.5, fy0 = py - 28 * art / 6.5 + Math.sin(t / 90) * 4
      ctx.fillStyle = "#333"; ctx.fillRect(fx0, fy0, 5, 4)
      ctx.fillStyle = "rgba(200,230,255,0.9)"; ctx.fillRect(fx0 - 2, fy0 - 4 + Math.round(Math.sin(t / 30)) * 2, 4, 3); ctx.fillRect(fx0 + 3, fy0 - 4 + Math.round(Math.sin(t / 30)) * 2, 4, 3)
    }
    if (fx.fire > 0.05) {
      for (i = 0; i < 3; i++) {
        var a = rnd()
        spawn({ type: "fire", x: mx + wd.face * 12, y: mouthY - 2, vx: wd.face * (90 + rnd() * 90), vy: (rnd() - 0.5) * 30 - 8, life: 0.45 + rnd() * 0.25, size: 3, color: ["#ff6b3d", "#ffb13d", "#ffe27a"][Math.floor(a * 3)] })
      }
    }
    if (fx.puff) { if (rnd() < 0.12) spawn({ type: "fire", x: mx, y: mouthY - 6, vx: 6, vy: -22, life: 0.8, size: 3, color: "#dfe7ee" }) }
    if (fx.bamboo) {
      ctx.fillStyle = "#6fbf5a"; ctx.fillRect(px + wd.face * 8 * scale / 6.5 * 1.1, mouthY - 22, 7, 44)
      ctx.fillStyle = "#4f9a43"; ctx.fillRect(px + wd.face * 8 * scale / 6.5 * 1.1, mouthY - 4, 7, 3); ctx.fillRect(px + wd.face * 8 * scale / 6.5 * 1.1, mouthY + 12, 7, 3)
      ctx.fillStyle = "#8fdc6d"; ctx.fillRect(px + wd.face * 8 * scale / 6.5 * 1.1 + 7, mouthY - 22, 14, 6)
    }
    if (fx.nibble) { ctx.fillStyle = "#ff9b3d"; ctx.fillRect(px - 6, mouthY + 2, 12, 5); ctx.fillStyle = "#6fbf5a"; ctx.fillRect(px - 10, mouthY - 1, 6, 4) }
    if (fx.sparkle && rnd() < 0.2) spawn({ type: "sparkle", x: px + (rnd() - 0.5) * 70, y: py - rnd() * 40, vx: 0, vy: -10, life: 0.8, size: 1.6 })
    if (fx.bark > 0.2 && rnd() < 0.4) spawn({ type: "note", x: px + wd.face * 60, y: py - 60, vx: wd.face * 30, vy: -30, life: 0.7, size: 1 })
    if (fx.slide > 0.3 && rnd() < 0.5) spawn({ type: "bubble", x: px - wd.face * 30, y: py - 4, vx: -wd.face * 20, vy: -14, life: 0.6, size: 1.5 })
  }

  function paintEntity(ctx, t) {
    var e = wd.entity
    if (!e) return
    if (e.kind === "butterfly") {
      var f = Math.round(Math.sin(t / 50)) * 3
      ctx.fillStyle = String(ctl.th.love); ctx.fillRect(e.x - 7, e.y - 4 - f, 6, 7); ctx.fillRect(e.x + 1, e.y - 4 - f, 6, 7)
      ctx.fillStyle = String(ctl.th.hue("cyan")); ctx.fillRect(e.x - 5, e.y + 2, 4, 4); ctx.fillRect(e.x + 1, e.y + 2, 4, 4)
      ctx.fillStyle = String(ctl.th.text); ctx.fillRect(e.x - 1, e.y - 4, 2, 10)
    } else if (e.kind === "coin") {
      var b = Math.sin(t / 250) * 3
      ctx.fillStyle = String(ctl.th.gold); ctx.fillRect(e.x - 8, e.y - 8 + b, 16, 16)
      ctx.fillStyle = String(ctl.th.mix(ctl.th.gold, "#000000", 0.3)); ctx.fillRect(e.x - 8, e.y + 4 + b, 16, 4); ctx.fillRect(e.x + 4, e.y - 8 + b, 4, 16)
      ctx.fillStyle = String(ctl.th.mix(ctl.th.gold, "#ffffff", 0.6)); ctx.fillRect(e.x - 4, e.y - 4 + b, 4, 8)
    }
  }

  function paintGame(ctx, t) {
    var g = wd.game
    if (!g) return
    var i, it
    if (g.id === "ball") {
      for (i = 0; i < g.items.length; i++) {
        it = g.items[i]
        if (it.gold) { Sprites.drawStar(ctx, it.x, it.y, 4, String(ctl.th.gold)) }
        else {
          ctx.fillStyle = String(ctl.th.good); ctx.beginPath(); ctx.arc(it.x, it.y, 8, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(it.x - 9, it.y, 9, -0.9, 0.9); ctx.stroke()
        }
      }
    } else if (g.id === "bubbles") {
      for (i = 0; i < g.items.length; i++) {
        it = g.items[i]
        var wob = Math.sin(t / 400 + it.ph) * 6
        ctx.fillStyle = it.gold ? "rgba(255,230,120,0.5)" : "rgba(190,230,255,0.4)"
        ctx.strokeStyle = it.gold ? "#ffd84d" : "rgba(255,255,255,0.95)"; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(it.x + wob, it.y, it.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(it.x + wob - it.r * 0.5, it.y - it.r * 0.5, 4, 4)
      }
    } else {
      var pulse = g.pinned ? 7 : 5 + Math.sin(t / 80) * 1.5
      ctx.fillStyle = Scenes.rgba(String(ctl.th.bad), 0.3); ctx.beginPath(); ctx.arc(g.dx, g.dy, pulse * 2.4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = String(ctl.th.bad); ctx.beginPath(); ctx.arc(g.dx, g.dy, pulse, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = "#ffffff"; ctx.fillRect(g.dx - 1, g.dy - 1, 2, 2)
    }
  }

  // ---------------------------------------------------------- the mouse

  function petBox() {
    var sc = bodyScale() * art
    var w = (hatched ? 11 : 7) * sc, h = (hatched ? 18 : 15) * sc
    var pose = wd.pose
    var dx = pose ? pose.dx : 0, dy = pose ? pose.dy : 0
    return { x: wd.x + dx - w, y: wd.y + dy - h, w: w * 2, h: h }
  }
  function inBox(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h }

  MouseArea {
    id: mouse
    anchors.fill: parent
    hoverEnabled: true
    acceptedButtons: Qt.LeftButton
    cursorShape: view.gameActive ? Qt.CrossCursor
      : (view.overPet && view.strokeMode ? Qt.BlankCursor : view.overPet ? (pressed ? Qt.ClosedHandCursor : Qt.OpenHandCursor) : Qt.ArrowCursor)

    property real lastX: 0
    property real lastY: 0
    property real downX: 0
    property real downY: 0
    property bool dragged: false

    onPositionChanged: function (m) {
      view.wd.mouseX = m.x; view.wd.mouseY = m.y
      var over = inBox(view.petBox(), m.x, m.y)
      if (over !== view.overPet) view.overPet = over
      if (!pressed || view.gameActive || !view.hatched || view.st.sleeping) return
      if (Math.abs(m.x - downX) + Math.abs(m.y - downY) > 6) dragged = true
      if (!over) { lastX = m.x; lastY = m.y; return }
      var d = Math.sqrt((m.x - lastX) * (m.x - lastX) + (m.y - lastY) * (m.y - lastY))
      lastX = m.x; lastY = m.y
      view.wd.strokeUntil = view.now() + 500
      view.wd.strokeDist += d
      while (view.wd.strokeDist > 34) {
        view.wd.strokeDist -= 34
        view.strokeOnce(m.x, m.y)
      }
    }
    onExited: view.overPet = false
    onPressed: function (m) {
      view.wd.pressed = true
      view.wd.mouseX = m.x; view.wd.mouseY = m.y
      lastX = m.x; lastY = m.y; downX = m.x; downY = m.y; dragged = false
      view.onPress(m.x, m.y)
    }
    onReleased: function (m) {
      view.wd.pressed = false
      if (!dragged) view.onTap(m.x, m.y)
    }
  }

  function strokeOnce(x, y) {
    var amount = strokeMode ? 3.2 : 1.6
    var r = ctl.stroke(amount)
    if (!r) return
    floatHeart(x, y - 24)
    var t = now()
    if (t - wd.lastPurr > 900) {
      wd.lastPurr = t
      ctl.sfx(petType === "cat" ? "purr" : "heart")
    }
    if (st.counters.pets % 8 === 0) { playReact("love"); ctl.voice("happy") }
  }

  function onPress(x, y) {
    if (!hatched) return
    var g = wd.game
    if (g && g.id === "bubbles") {
      for (var i = g.items.length - 1; i >= 0; i--) {
        var it = g.items[i]
        var bx = it.x + Math.sin(now() / 400 + it.ph) * 6
        if ((x - bx) * (x - bx) + (y - it.y) * (y - it.y) <= it.r * it.r * 1.3) {
          g.score += it.gold ? 4 : (it.r < 20 ? 2 : 1)
          g.items.splice(i, 1)
          burst("star", bx, it.y, 7, 70)
          ctl.sfx("pop")
          g.hopUntil = now() + 380
          break
        }
      }
    }
  }

  function onTap(x, y) {
    if (!st) return
    var e = wd.entity
    if (!hatched) { hatchTap(); return }
    if (wd.game) return
    if (e && e.kind === "coin" && Math.abs(x - e.x) < 20 && Math.abs(y - e.y) < 20) {
      wd.entity = null
      burst("star", e.x, e.y, 10, 80)
      ctl.collectCoin()
      return
    }
    // a tap on a mess cleans just that one
    for (var i = 0; i < st.messes; i++) {
      var mx = width * messSlots[i], my = footY + 4 + (i % 2) * 10
      if (Math.abs(x - mx) < 18 && y > my - 28 && y < my + 10) {
        burst("bubble", mx, my - 8, 8, 40)
        ctl.cleanOne()
        return
      }
    }
    if (inBox(petBox(), x, y)) {
      if (st.sleeping) { say("zzz...", 1200); return }
      playReact("poke")
      ctl.sfx("click")
      if (rnd() < 0.5) ctl.voice(rnd() < 0.85 ? "happy" : "sad")
      if (strokeMode) strokeOnce(x, y)
      else ctl.stroke(0.4)
    }
  }

  // ---------------------------------------------------------- the egg

  function hatchTap() {
    if (wd.hatching) return
    wd.taps += 1
    ctl.sfx("click")
    burst("crumb", wd.x, wd.y - 40, 4, 40)
    if (wd.taps >= 5) {
      wd.hatching = now()
      ctl.sfx("hatch")
      later(900, function () {
        wd.flash = now()
        burst("star", wd.x, wd.y - 40, 30, 120)
        wd.hatching = 0
        wd.taps = 0
        ctl.hatch()
        playReact("cheer")
      })
    } else say(["", "Something moves!", "Crack!", "Almost...", ""][wd.taps] || "", 1200)
  }

  Timer { id: speechTimer; onTriggered: view.speech = "" }

  Timer {
    id: clock
    interval: 33
    repeat: true
    running: view.active && view.visible && view.width > 0
    onTriggered: view.frame()
  }
}
