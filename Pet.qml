// Omarchy Pet — a pixel Tamagotchi that floats on the desktop.
//
// A `panel` plugin with keepLoaded, so the shell mounts it at startup and it
// lives for the whole session. This file is the controller: it owns the saved
// state, the clock, sound, and the floating window. Rules live in Logic.js,
// the world in PetView.qml, the pull-up panels in Sheets.qml.

import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Hyprland
import qs.Commons
import "Logic.js" as Logic

Item {
  id: root

  // Injected by the shell host.
  property var shell: null
  property var manifest: null
  property string omarchyPath: ""

  readonly property string dir: manifest && manifest.__sourceDir ? String(manifest.__sourceDir).replace(/^file:\/\//, "") : ""
  readonly property bool ready: dir !== ""
  readonly property string dataDir: Quickshell.env("HOME") + "/.local/share/omarchy-pet"
  readonly property string statePath: dataDir + "/state.json"

  // ------------------------------------------------------------- state

  property var ps: Logic.defaultState(Date.now())
  property int rev: 0               // bumped on every change so bindings refresh
  property bool loaded: false
  property bool hidden: false
  property string sheet: ""
  property bool popupOpen: false
  property real popupAnchor: 0
  property bool stroking: false
  property bool dirty: false

  function cur() { rev; return ps }
  function stat(key) { rev; return ps.stats[key] }
  function touch() { rev++; dirty = true; saveTimer.restart() }

  // ---------------------------------------------------------- persistence

  Process {
    id: mkdir
    command: ["mkdir", "-p", root.dataDir]
    onExited: store.path = root.statePath
  }
  Component.onCompleted: if (root.ready) mkdir.running = true
  onReadyChanged: if (ready && !mkdir.running && store.path === "") mkdir.running = true

  FileView {
    id: store
    path: ""
    atomicWrites: true
    printErrors: false
    onLoaded: root.restore(text())
    onLoadFailed: root.restore("")
  }

  function restore(raw) {
    var saved = null
    try { saved = raw ? JSON.parse(raw) : null } catch (e) { saved = null }
    var now = Date.now()
    var s = Logic.mergeState(saved, now)
    var away = Logic.applyAway(s, now)
    s.lastSeen = now
    root.ps = s
    root.lastTick = now
    root.loaded = true
    root.hidden = false
    root.rev++
    if (s.pet && s.pet.hatched && away >= 5) {
      welcomeTimer.away = away
      welcomeTimer.start()
    }
    root.ensureScreen()
    save()
  }

  function save() {
    if (!loaded) return
    ps.lastSeen = Date.now()
    store.setText(JSON.stringify(ps))
    dirty = false
  }
  Timer { id: saveTimer; interval: 900; onTriggered: root.save() }
  Timer { interval: 30000; repeat: true; running: root.loaded; onTriggered: root.save() }
  Component.onDestruction: save()

  Timer {
    id: welcomeTimer
    property int away: 0
    interval: 900
    onTriggered: {
      var h = Math.floor(away / 60), m = away % 60
      var span = h > 0 ? h + "h " + (m > 0 ? m + "m" : "") : m + " min"
      root.toast("Welcome back! Away " + span.trim())
      view.say(Logic.PETS[ps.pet.type].greetings[0], 2800)
      root.voice("happy")
    }
  }

  // ------------------------------------------------------------- clock

  property real lastTick: Date.now()
  property var spoken: ({})

  Timer {
    id: ticker
    interval: 1000
    repeat: true
    running: root.loaded && root.cur().pet !== null && root.cur().pet.hatched
    onTriggered: {
      var now = Date.now()
      var dt = Math.min(5, (now - root.lastTick) / 1000)
      root.lastTick = now
      var mess = ps.messes
      var wasSleeping = ps.sleeping
      Logic.step(ps, dt)
      if (wasSleeping && !ps.sleeping) { root.toast("Fully rested!"); root.voice("happy") }
      if (ps.messes > mess) { root.sfx("click"); view.say("Oops...", 1600) }
      root.checkNeeds()
      root.celebrateMilestones()
      root.rev++
      root.dirty = true
    }
  }

  // The pet says something when a need runs low, at most once per few minutes.
  function checkNeeds() {
    if (ps.sleeping) return
    var now = Date.now()
    var lines = [["hunger", 28, "I'm hungry..."], ["energy", 22, "So sleepy..."], ["cleanliness", 25, "It's messy in here"], ["affection", 22, "Pet me please?"], ["happiness", 22, "I'm sad..."]]
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]
      if (ps.stats[l[0]] < l[1] && now - (spoken[l[0]] || 0) > 5 * 60 * 1000) {
        spoken[l[0]] = now
        view.say(l[2], 3200)
        voice("sad")
        return
      }
    }
  }

  // ------------------------------------------------------------- sound

  readonly property var pool: [snd0, snd1, snd2, snd3]
  property int poolIndex: 0
  Process { id: snd0 }
  Process { id: snd1 }
  Process { id: snd2 }
  Process { id: snd3 }

  function sfx(name) {
    if (!ps.settings.sound || ps.settings.volume <= 0 || !ready) return
    var p = pool[poolIndex]
    poolIndex = (poolIndex + 1) % pool.length
    if (p.running) return
    p.command = ["pw-play", "--volume", String((ps.settings.volume / 100) * 0.8), root.dir + "/assets/sfx/" + name + ".wav"]
    p.running = true
  }
  function voice(kind) {
    if (!ps.pet) return
    sfx(Logic.PETS[ps.pet.type].voice + "_" + kind)
  }

  // ------------------------------------------------------------ toasts

  property var toastQueue: []
  property string toastText: ""
  function toast(text) {
    toastQueue.push(text)
    if (toastText === "") nextToast()
  }
  function nextToast() {
    if (toastQueue.length === 0) { toastText = ""; return }
    toastText = toastQueue.shift()
    toastTimer.restart()
  }
  Timer { id: toastTimer; interval: 2400; onTriggered: root.nextToast() }

  // ----------------------------------------------------------- actions

  function afterCare(prevLevel, prevStage) {
    var bonus = Logic.touchStreak(ps, Date.now())
    for (var i = 0; i < bonus.length; i++) toast("🔥 Day " + bonus[i].days + " streak! +" + bonus[i].coins + " 🪙")
    if (ps.level > prevLevel) {
      var stageUp = Logic.stageForLevel(ps.level) > prevStage
      view.levelUp(stageUp)
      sfx("level")
      var name = Logic.stageName(ps.pet.type, ps.level)
      toast(stageUp ? "✨ " + ps.pet.name + " grew into a " + name + "!" : "⭐ Level " + ps.level + "!")
    }
    celebrateMilestones()
    touch()
  }

  function celebrateMilestones() {
    var won = Logic.checkMilestones(ps)
    for (var i = 0; i < won.length; i++) {
      var m = Logic.MILESTONES[won[i]]
      toast("🏆 " + m.label + "  +" + m.reward + " 🪙")
      sfx("milestone")
      view.celebrate()
    }
    if (won.length) touch()
  }

  function doFeed(id) {
    var lv = ps.level, st = Logic.stageForLevel(ps.level)
    var r = Logic.feed(ps, id)
    if (!r) { toast("Shh, " + ps.pet.name + " is sleeping"); return }
    closeSheet()
    if (r.kind === "none") { toast("Out of " + Logic.FOODS[id].label.toLowerCase() + " - restock in the Shop"); return }
    if (r.kind === "full") { view.refuse(); return }
    view.eat(id, r.kind === "loved")
    afterCare(lv, st)
  }

  function stroke(amount) {
    var lv = ps.level, st = Logic.stageForLevel(ps.level)
    var r = Logic.pet(ps, amount)
    if (!r) return null
    if (ps.counters.pets % 10 === 0) Logic.addXp(ps, 2)
    if (ps.level > lv || ps.counters.pets % 10 === 0) afterCare(lv, st)
    else { rev++; dirty = true; saveTimer.restart() }
    return r
  }

  function cleanOne() {
    var lv = ps.level, st = Logic.stageForLevel(ps.level)
    var r = Logic.clean(ps, 1)
    if (r && r.removed > 0) { sfx("splash"); voice("happy"); afterCare(lv, st) }
  }

  function doClean() {
    if (!ps.pet || !ps.pet.hatched) return
    var lv = ps.level, st = Logic.stageForLevel(ps.level)
    if (ps.sleeping) { toast("Shh, " + ps.pet.name + " is sleeping"); return }
    Logic.bathe(ps)
    view.cleanUp()
    afterCare(lv, st)
  }

  function doSleep() {
    if (!ps.pet || !ps.pet.hatched) return
    if (ps.sleeping) {
      Logic.wake(ps)
      view.say("Yaaawn...", 1800)
      sfx("click")
    } else {
      if (view.gameActive) return
      Logic.startSleep(ps)
      view.goToSleep()
      sfx("sleep")
      toast("Sweet dreams, " + ps.pet.name)
    }
    closeSheet()
    touch()
  }

  function startPlay(game) {
    if (ps.sleeping) { toast("Shh, " + ps.pet.name + " is sleeping"); return }
    if (!Logic.canPlay(ps)) { toast(ps.pet.name + " is too tired to play"); sfx("nope"); return }
    closeSheet()
    stroking = false
    view.strokeMode = false
    view.startGame(game)
    sfx("click")
  }

  function finishGame(game, score) {
    var lv = ps.level, st = Logic.stageForLevel(ps.level)
    var r = Logic.playResult(ps, game, score)
    view.celebrate()
    sfx("coin")
    voice("happy")
    toast(r.score > 0 ? "🎉 " + r.score + " points  +" + r.coins + " 🪙" : "Nice try!")
    afterCare(lv, st)
  }

  function collectCoin() {
    ps.coins += 3
    sfx("coin")
    toast("Found a coin! +3 🪙")
    touch()
  }

  function toggleStroke() {
    if (ps.sleeping) { toast("Shh, " + ps.pet.name + " is sleeping"); return }
    stroking = !stroking
    view.strokeMode = stroking
    if (stroking) { toast("Stroke mode: rub or tap " + ps.pet.name); closeSheet() }
  }
  Timer { interval: 20000; running: root.stroking; onTriggered: { root.stroking = false; view.strokeMode = false } }

  function choosePet(type, name) {
    ps.pet = { type: type, name: Logic.cleanName(name), hatched: false }
    Logic.giveStarters(ps)
    ps.lastSeen = Date.now()
    sfx("click")
    touch()
    save()
    toast("Tap the egg to help it hatch!")
  }

  function hatch() {
    ps.pet.hatched = true
    ps.lastSeen = Date.now()
    lastTick = Date.now()
    Logic.touchStreak(ps, Date.now())
    touch()
    save()
    view.say(Logic.PETS[ps.pet.type].greetings[0], 2800)
    voice("happy")
    toast(ps.pet.name + " hatched! 🎉")
  }

  function rename(text) {
    var n = Logic.cleanName(text)
    if (n === "" || !ps.pet) return
    ps.pet.name = n
    touch()
  }

  function setSetting(key, value) {
    ps.settings[key] = value
    touch()
    if (key === "sound" && value) sfx("click")
  }

  function buyItem(kind, id) {
    var r = Logic.buy(ps, kind, id)
    if (r === "ok") {
      sfx("coin")
      if (kind === "hats") ps.equipped.hat = id
      var label = ({ hats: Logic.HATS, foods: Logic.FOODS, toys: Logic.TOYS })[kind][id].label
      if (kind === "foods") toast("Bought " + label + " (" + ps.pantry[id] + " left)")
      else { toast("Unlocked " + label + "!"); view.celebrate() }
      touch()
    } else {
      sfx("nope")
      toast(r === "coins" ? "Not enough coins yet" : r === "level" ? "Reach a higher level first" : "Can't buy that")
    }
  }

  function equip(slot, id) {
    if (slot === "hat") ps.equipped.hat = id
    sfx("click")
    touch()
  }

  function resetAll() {
    ps = Logic.defaultState(Date.now())
    sheet = ""
    stroking = false
    view.strokeMode = false
    touch()
    save()
    sfx("click")
  }

  function openSheet(name) { sheet = sheet === name ? "" : name; sfx("click") }
  function closeSheet() { sheet = "" }

  function togglePopup(anchorX) {
    if (popupOpen) { closePopup(); return }
    openPopupAt(anchorX)
    sfx("click")
  }
  function closePopup() { popupOpen = false; sheet = ""; stroking = false; view.strokeMode = false }

  // ------------------------------------------------ window positioning

  property var screenObj: null
  function pickScreen() {
    var screens = Quickshell.screens
    if (!screens || screens.length === 0) return null
    var focused = Hyprland.focusedMonitor
    var want = focused ? String(focused.name || "") : ""
    for (var i = 0; i < screens.length; i++) if (String(screens[i].name) === want) return screens[i]
    return screens[0]
  }

  function ensureScreen() { if (!screenObj) screenObj = pickScreen() }

  IpcHandler {
    target: "pet"
    function toggle(): string { if (root.popupOpen) root.closePopup(); else root.openPopupAt(0); return root.popupOpen ? "open" : "closed" }
    function show(): string { root.hidden = false; return "shown" }
    function hide(): string { root.hidden = true; root.closePopup(); return "hidden" }
  }

  // ================================================================= UI

  readonly property var th: theme
  readonly property bool needsSetup: loaded && cur().pet === null

  Theme { id: theme }

  // The pet itself, on the bar.
  BarPet { id: barPet; ctl: root }

  // First launch: open the picker so the user is not left with an unlabeled egg.
  onNeedsSetupChanged: if (needsSetup && !popupOpen) setupOpen.restart()
  Timer { id: setupOpen; interval: 800; onTriggered: root.openPopupAt(0) }

  function openPopupAt(x) {
    ensureScreen()
    popupAnchor = x > 0 ? x : (barPet.petX > 0 ? barPet.petX : (screenObj ? screenObj.width * 0.72 : 600))
    popupOpen = true
  }

  // The care popup, opened under the pet like any other Omarchy bar popup.
  PanelWindow {
    id: win

    readonly property int pad: 10
    readonly property bool atBottom: barPet.barPosition === "bottom"
    readonly property real wantX: root.popupAnchor - implicitWidth / 2

    screen: root.screenObj
    visible: root.loaded && root.ready && root.popupOpen && root.screenObj !== null && !barPet.vertical
    color: "transparent"

    exclusionMode: ExclusionMode.Ignore
    WlrLayershell.namespace: "omarchy-pet"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: root.popupOpen ? WlrKeyboardFocus.OnDemand : WlrKeyboardFocus.None

    anchors { top: !atBottom; bottom: atBottom; left: true }
    margins {
      left: Math.round(Math.max(4, Math.min((root.screenObj ? root.screenObj.width : 1000) - implicitWidth - 4, wantX)))
      top: atBottom ? 0 : barPet.barSize + Style.gapsOut - pad
      bottom: atBottom ? barPet.barSize + Style.gapsOut - pad : 0
    }
    implicitWidth: card.width + pad * 2
    implicitHeight: card.height + pad * 2

    mask: Region { item: card }

    HyprlandFocusGrab {
      windows: [win]
      active: root.popupOpen
      onCleared: root.closePopup()
    }

    Rectangle {  // soft shadow
      x: card.x + 1; y: card.y + 4; width: card.width; height: card.height
      radius: card.radius; color: "#000000"; opacity: 0.25
    }

    Rectangle {
      id: card
      x: win.pad; y: win.pad
      width: 340
      height: content.implicitHeight + 24
      radius: Math.max(Style.cornerRadius, 8)
      color: th.bg
      border.width: 2
      border.color: th.border

      Column {
        id: content
        x: 12; y: 12
        width: parent.width - 24
        spacing: 8

        // ---- header
        Item {
          width: parent.width; height: 44
          Column {
            anchors.left: parent.left
            anchors.verticalCenter: parent.verticalCenter
            spacing: 2
            Text {
              text: root.cur().pet ? root.cur().pet.name : "Omarchy Pet"
              textFormat: Text.PlainText
              font.family: Style.font.family
              font.pixelSize: 16; font.bold: true; color: th.text
            }
            Text {
              text: root.cur().pet ? ((root.cur().pet.hatched ? Logic.stageName(root.cur().pet.type, root.cur().level) : "Egg") + " · Lv " + root.cur().level) : "Pick a pet"
              textFormat: Text.PlainText
              font.family: Style.font.family
              font.pixelSize: 11; color: th.dim; font.bold: true
            }
          }
          Row {
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            spacing: 6
            Rectangle {
              visible: root.cur().pet !== null
              width: coins.implicitWidth + 18; height: 26; radius: 8; color: th.surface; border.color: th.line; border.width: 1
              Text { id: coins; anchors.centerIn: parent; text: "🪙 " + root.cur().coins; textFormat: Text.PlainText; font.family: Style.font.family; font.pixelSize: 12; font.bold: true; color: th.gold }
            }
            Rectangle {
              width: 26; height: 26; radius: 8; color: gearTap.containsMouse ? th.surfaceHi : th.surface
              Text { anchors.centerIn: parent; text: "⚙"; textFormat: Text.PlainText; font.pixelSize: 14; color: th.dim }
              MouseArea { id: gearTap; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: root.openSheet("settings") }
            }
            Rectangle {
              width: 26; height: 26; radius: 8; color: closeTap.containsMouse ? th.surfaceHi : th.surface
              Text { anchors.centerIn: parent; text: "✕"; textFormat: Text.PlainText; font.pixelSize: 12; font.bold: true; color: th.dim }
              MouseArea { id: closeTap; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: root.closePopup() }
            }
          }
        }

        // ---- xp bar (always laid out so the scene never shifts)
        Rectangle {
          width: parent.width; height: 6; radius: 3; color: th.surfaceHi
          opacity: root.cur().pet !== null && root.cur().pet.hatched ? 1 : 0
          Rectangle {
            height: parent.height; radius: 3; color: th.accent
            width: parent.width * (root.rev, root.ps.xp / Logic.xpForLevel(root.ps.level))
            Behavior on width { NumberAnimation { duration: 500; easing.type: Easing.OutCubic } }
          }
        }

        Item { id: scenePlaceholder; width: parent.width; height: 220 }

        // ---- needs
        Column {
          width: parent.width
          spacing: 2
          opacity: root.cur().pet && root.cur().pet.hatched ? 1 : 0.35
          StatBar { th: root.th; width: parent.width; icon: "🍎"; label: "Hunger"; value: root.stat("hunger") }
          StatBar { th: root.th; width: parent.width; icon: "😊"; label: "Happiness"; value: root.stat("happiness") }
          StatBar { th: root.th; width: parent.width; icon: "⚡"; label: "Energy"; value: root.stat("energy") }
          StatBar { th: root.th; width: parent.width; icon: "🫧"; label: "Cleanliness"; value: root.stat("cleanliness") }
          StatBar { th: root.th; width: parent.width; icon: "💗"; label: "Affection"; value: root.stat("affection") }
        }

        // ---- actions
        Row {
          width: parent.width
          spacing: (parent.width - 6 * 48) / 5
          readonly property bool awake: root.cur().pet !== null && root.cur().pet.hatched
          RoundButton { th: root.th; icon: "🍎"; label: "Feed"; tint: th.mix(th.bg, th.hue("orange"), 0.22); alert: root.stat("hunger") < 30 && !root.cur().sleeping; enabled2: parent.awake; onClicked: if (parent.awake) root.openSheet("food") }
          RoundButton { th: root.th; icon: "🎾"; label: "Play"; tint: th.mix(th.bg, th.hue("cyan"), 0.22); enabled2: parent.awake; onClicked: if (parent.awake) root.openSheet("play") }
          RoundButton { th: root.th; icon: "🤚"; label: "Pet"; tint: th.mix(th.bg, th.hue("magenta"), 0.22); toggled: root.stroking; alert: root.stat("affection") < 25 && !root.cur().sleeping; enabled2: parent.awake; onClicked: if (parent.awake) root.toggleStroke() }
          RoundButton { th: root.th; icon: root.cur().sleeping ? "☀️" : "😴"; label: root.cur().sleeping ? "Wake" : "Sleep"; tint: th.mix(th.bg, th.hue("blue"), 0.22); toggled: root.cur().sleeping; alert: root.stat("energy") < 22 && !root.cur().sleeping; enabled2: parent.awake; onClicked: if (parent.awake) root.doSleep() }
          RoundButton { th: root.th; icon: "🧼"; label: "Clean"; tint: th.mix(th.bg, th.hue("green"), 0.22); alert: root.cur().messes > 0 || root.stat("cleanliness") < 25; enabled2: parent.awake; onClicked: if (parent.awake) root.doClean() }
          RoundButton { th: root.th; icon: "🛍️"; label: "Shop"; tint: th.mix(th.bg, th.hue("yellow"), 0.22); enabled2: parent.awake; onClicked: if (parent.awake) root.openSheet("shop") }
        }
      }

      // ---- the scene the pet is in while the popup is open
      PetView {
        id: view
        ctl: root
        active: win.visible
        x: 12
        y: content.y + scenePlaceholder.y
        width: card.width - 24
        height: 220
        z: 1
      }

      // Frame hides the square corners of the canvas.
      Rectangle {
        x: view.x - 5; y: view.y - 5; width: view.width + 10; height: view.height + 10
        radius: 12; color: "transparent"; border.width: 6; border.color: th.bg; z: 2
      }
      Rectangle {
        x: view.x - 1; y: view.y - 1; width: view.width + 2; height: view.height + 2
        radius: 7; color: "transparent"; border.width: 1; border.color: th.line; z: 3
      }

      // ---- overlays on the scene
      Item {
        id: overlays
        x: view.x; y: view.y; width: view.width; height: view.height
        z: 4
        visible: root.cur().pet !== null

        Rectangle { // speech bubble
          id: speech
          visible: view.speech !== "" && view.hatched
          x: Math.max(4, Math.min(overlays.width - width - 4, view.headX - width / 2))
          y: Math.max(26, view.headY - height - 12)
          width: Math.min(overlays.width - 8, bubbleText.implicitWidth + 20)
          height: bubbleText.implicitHeight + 14
          radius: 8; color: th.bg; border.color: th.border; border.width: 1
          Text {
            id: bubbleText
            anchors.centerIn: parent
            width: Math.min(implicitWidth, overlays.width - 36)
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            text: view.speech
            textFormat: Text.PlainText
            font.family: Style.font.family
            font.pixelSize: 12; font.bold: true; color: th.text
          }
        }

        Rectangle { // thought bubble for needs
          visible: view.thought !== "" && view.speech === "" && view.hatched && !view.gameActive
          x: Math.min(overlays.width - width - 4, view.headX + 14)
          y: Math.max(26, view.headY - 30)
          width: 34; height: 30; radius: 8; color: th.bg; border.color: th.border; border.width: 1
          Text { anchors.centerIn: parent; text: view.thought; textFormat: Text.PlainText; font.pixelSize: 16; font.family: Style.font.family }
        }

        Rectangle { // toast
          visible: root.toastText !== ""
          anchors.horizontalCenter: parent.horizontalCenter
          y: 8
          width: Math.min(parent.width - 16, toastLabel.implicitWidth + 24); height: 28; radius: 8
          color: th.accent
          Text { id: toastLabel; anchors.centerIn: parent; text: root.toastText; textFormat: Text.PlainText; font.family: Style.font.family; font.pixelSize: 12; font.bold: true; color: th.onAccent; elide: Text.ElideRight; width: Math.min(implicitWidth, parent.width - 16) }
        }

        Item { // game HUD
          visible: view.gameActive
          x: 8; y: root.toastText !== "" ? 42 : 8; width: parent.width - 16; height: 24
          Rectangle { anchors.left: parent.left; anchors.right: quit.left; anchors.rightMargin: 8; anchors.verticalCenter: parent.verticalCenter; height: 8; radius: 4; color: th.surfaceHi
            Rectangle { height: parent.height; radius: 4; color: th.accent; width: parent.width * (1 - view.gameProgress) } }
          Rectangle { id: quit; anchors.right: parent.right; width: 56; height: 24; radius: 8; color: th.surfaceHi
            Text { anchors.centerIn: parent; text: "⭐ " + view.gameScore; textFormat: Text.PlainText; font.family: Style.font.family; font.pixelSize: 12; font.bold: true; color: th.text }
            MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: view.endGame(true) } }
        }
      }

      // ---- sheets and setup cover the card
      Sheets {
        id: sheets
        ctl: root
        visible: root.sheet !== ""
        x: 10; y: 58; width: card.width - 20; height: card.height - 68 - 62
        z: 7
      }

      Setup {
        visible: root.needsSetup
        ctl: root
        anchors.fill: parent
        anchors.margins: 2
        z: 8
        radius: card.radius
      }
    }
  }
}
