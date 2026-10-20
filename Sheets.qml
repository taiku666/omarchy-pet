// Pull-up panels: food, play, shop, goals and settings.

import QtQuick
import qs.Commons
import "Logic.js" as Logic

Rectangle {
  id: sheets
  readonly property var th: ctl ? ctl.th : null

  property var ctl: null
  property string tab: "hats"     // shop tab
  readonly property string kind: ctl ? ctl.sheet : ""
  function cur() { return ctl ? (ctl.rev, ctl.ps) : null }
  readonly property string petType: { var c = cur(); return c && c.pet ? c.pet.type : "cat" }

  visible: kind !== ""
  color: th.bg
  radius: 18
  border.width: 2
  border.color: th.line

  readonly property var titles: ({ food: "Feed", play: "Play", shop: "Shop", goals: "Goals", settings: "Settings" })

  MouseArea { anchors.fill: parent }   // swallow clicks so the scene stays still

  Item {
    id: head
    x: 12; y: 8; width: parent.width - 24; height: 30
    Text { font.family: Style.font.family;
      anchors.verticalCenter: parent.verticalCenter
      text: sheets.titles[sheets.kind] || ""
      textFormat: Text.PlainText
      font.pixelSize: 16; font.bold: true; color: th.text
    }
    Row {
      anchors.right: parent.right; anchors.verticalCenter: parent.verticalCenter
      spacing: 8
      Rectangle {
        visible: sheets.kind === "shop" || sheets.kind === "play"
        width: coinLabel.implicitWidth + 16; height: 24; radius: 12; color: th.surface; border.color: th.line
        Text { font.family: Style.font.family; id: coinLabel; anchors.centerIn: parent; text: "🪙 " + (sheets.cur() ? sheets.cur().coins : 0); textFormat: Text.PlainText; font.pixelSize: 12; font.bold: true; color: th.gold }
      }
      Rectangle {
        width: 26; height: 26; radius: 13; color: closeTap.containsMouse ? th.surfaceHi : th.surface
        Text { font.family: Style.font.family; anchors.centerIn: parent; text: "✕"; textFormat: Text.PlainText; font.pixelSize: 12; font.bold: true; color: th.dim }
        MouseArea { id: closeTap; anchors.fill: parent; hoverEnabled: true; cursorShape: Qt.PointingHandCursor; onClicked: ctl.closeSheet() }
      }
    }
  }

  // ------------------------------------------------------------ food
  Flickable {
    visible: sheets.kind === "food"
    x: 12; y: 44; width: parent.width - 24; height: parent.height - 52
    contentHeight: foodFlow.height; clip: true
    boundsBehavior: Flickable.StopAtBounds
    Flow {
      id: foodFlow
      width: parent.width; spacing: 6
      Repeater {
        model: sheets.kind === "food" ? Logic.FOOD_ORDER.filter(function (id) { return sheets.cur() && Logic.foodAvailable(sheets.cur(), id) }) : []
        delegate: ItemChip {
          th: sheets.th
          required property string modelData
          readonly property var food: Logic.FOODS[modelData]
          emoji: food.emoji
          title: food.label
          subtitle: "+" + food.hunger + " 🍽  +" + food.happiness + " ♥"
          badge: food.favoriteOf === sheets.petType ? "♥ fave" : ""
          onClicked: ctl.doFeed(modelData)
        }
      }
    }
  }

  // ------------------------------------------------------------ play
  Column {
    visible: sheets.kind === "play"
    x: 12; y: 44; width: parent.width - 24; spacing: 8
    Text { font.family: Style.font.family;
      width: parent.width; wrapMode: Text.WordWrap; textFormat: Text.PlainText
      text: "Games last 15 seconds. They cost a little energy and earn coins."
      font.pixelSize: 11; color: th.dim
    }
    Flow {
      width: parent.width; spacing: 6
      Repeater {
        model: sheets.kind === "play" ? Logic.TOY_ORDER : []
        delegate: ItemChip {
          th: sheets.th
          required property string modelData
          readonly property var toy: Logic.TOYS[modelData]
          readonly property bool owned: sheets.cur() && Logic.toyAvailable(sheets.cur(), modelData)
          emoji: toy.emoji
          title: toy.label
          subtitle: owned ? ({ ball: "Move the mouse", bubbles: "Click bubbles", laser: "Move the dot" })[toy.game]
                          : (sheets.cur() && sheets.cur().level < toy.level ? "Level " + toy.level : "🪙 " + toy.cost)
          badge: owned ? "" : "🔒"
          dim: !owned
          onClicked: owned ? ctl.startPlay(toy.game) : ctl.buyItem("toys", modelData)
        }
      }
    }
    Text { font.family: Style.font.family;
      width: parent.width; wrapMode: Text.WordWrap; textFormat: Text.PlainText
      visible: sheets.cur() && sheets.cur().stats.energy <= 15
      text: "Too tired to play. Let it sleep first."
      font.pixelSize: 12; font.bold: true; color: th.bad
    }
  }

  // ------------------------------------------------------------ shop
  Row {
    id: tabs
    visible: sheets.kind === "shop"
    x: 12; y: 42; spacing: 6
    Repeater {
      model: [["hats", "🎩 Hats"], ["rooms", "🏞️ Rooms"], ["foods", "🍰 Food"], ["toys", "🎾 Toys"]]
      delegate: Rectangle {
        required property var modelData
        width: 72; height: 26; radius: 13
        color: sheets.tab === modelData[0] ? th.accent : th.surface
        Text { anchors.centerIn: parent; text: modelData[1]; textFormat: Text.PlainText; font.pixelSize: 11; font.bold: true; color: sheets.tab === modelData[0] ? th.bg : th.dim; font.family: Style.font.family }
        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: { sheets.tab = modelData[0]; ctl.sfx("click") } }
      }
    }
  }
  Flickable {
    visible: sheets.kind === "shop"
    x: 12; y: 76; width: parent.width - 24; height: parent.height - 84
    contentHeight: shopFlow.height + 8; clip: true
    boundsBehavior: Flickable.StopAtBounds
    Flow {
      id: shopFlow
      width: parent.width; spacing: 6
      Repeater {
        model: {
          if (sheets.kind !== "shop") return []
          return ({ hats: Logic.HAT_ORDER, rooms: Logic.ROOM_ORDER, foods: Logic.FOOD_ORDER, toys: Logic.TOY_ORDER })[sheets.tab]
        }
        delegate: ItemChip {
          th: sheets.th
          id: shopChip
          required property string modelData
          readonly property string tabKind: sheets.tab
          readonly property var item: ({ hats: Logic.HATS, rooms: Logic.ROOMS, foods: Logic.FOODS, toys: Logic.TOYS })[tabKind][modelData]
          readonly property bool owned: sheets.cur() && sheets.cur().unlocked[tabKind].indexOf(modelData) !== -1
          readonly property bool equipped: sheets.cur() && ((tabKind === "hats" && sheets.cur().equipped.hat === modelData) || (tabKind === "rooms" && sheets.cur().equipped.room === modelData))
          readonly property int price: tabKind === "foods" ? Logic.foodPrice(sheets.cur(), modelData) : item.cost
          readonly property bool levelLocked: tabKind !== "foods" && sheets.cur() && sheets.cur().level < item.level && !owned
          emoji: tabKind === "foods" || tabKind === "toys" ? item.emoji : ""
          title: item.label
          subtitle: equipped ? "In use" : owned ? (tabKind === "hats" || tabKind === "rooms" ? "Tap to use" : "Owned")
                  : levelLocked ? "Level " + item.level : "🪙 " + price
          badge: equipped ? "✓" : owned ? "" : levelLocked ? "🔒" : ""
          highlighted: equipped
          dim: !owned && levelLocked
          preview: [
            Loader {
              anchors.centerIn: parent
              active: shopChip.tabKind === "hats" || shopChip.tabKind === "rooms"
              sourceComponent: Preview {
                th: sheets.th
                kind: shopChip.tabKind === "hats" ? "hat" : "room"
                petType: sheets.petType
                hat: shopChip.modelData
                room: shopChip.modelData
                zoom: 2.0
                width: 56; height: 50
              }
            }
          ]
          onClicked: {
            if (owned) {
              if (tabKind === "hats") ctl.equip("hat", modelData)
              else if (tabKind === "rooms") ctl.equip("room", modelData)
            } else ctl.buyItem(tabKind, modelData)
          }
        }
      }
    }
  }

  // ------------------------------------------------------------ goals
  Flickable {
    visible: sheets.kind === "goals"
    x: 12; y: 44; width: parent.width - 24; height: parent.height - 52
    contentHeight: goalCol.height + 8; clip: true
    boundsBehavior: Flickable.StopAtBounds
    Column {
      id: goalCol
      width: parent.width; spacing: 6
      Rectangle {
        width: parent.width; height: 40; radius: 12; color: th.surface; border.color: th.line
        Text { font.family: Style.font.family;
          anchors.centerIn: parent; textFormat: Text.PlainText
          text: "🔥 " + (sheets.cur() ? sheets.cur().streak.days : 0) + " day streak   ·   🥣 " + (sheets.cur() ? sheets.cur().counters.feeds : 0) + " meals   ·   🤚 " + (sheets.cur() ? sheets.cur().counters.pets : 0) + " strokes"
          font.pixelSize: 11; font.bold: true; color: th.text
        }
      }
      Repeater {
        model: Logic.MILESTONE_ORDER
        delegate: Rectangle {
          required property string modelData
          readonly property bool done: sheets.cur() && !!sheets.cur().milestones[modelData]
          width: goalCol.width; height: 38; radius: 12
          color: done ? th.mix(th.bg, th.good, 0.18) : th.surface; border.color: done ? th.good : th.line; border.width: 1
          Text { x: 10; anchors.verticalCenter: parent.verticalCenter; text: parent.done ? "🏆" : "○"; textFormat: Text.PlainText; font.pixelSize: 16; font.family: "Noto Color Emoji" }
          Column {
            x: 40; anchors.verticalCenter: parent.verticalCenter
            Text { font.family: Style.font.family; text: Logic.MILESTONES[modelData].label; textFormat: Text.PlainText; font.pixelSize: 12; font.bold: true; color: th.text }
            Text { font.family: Style.font.family; text: Logic.MILESTONES[modelData].desc; textFormat: Text.PlainText; font.pixelSize: 10; color: th.dim }
          }
          Text { font.family: Style.font.family; anchors.right: parent.right; anchors.rightMargin: 10; anchors.verticalCenter: parent.verticalCenter; text: "🪙 " + Logic.MILESTONES[modelData].reward; textFormat: Text.PlainText; font.pixelSize: 11; font.bold: true; color: parent.done ? th.good : th.dim }
        }
      }
    }
  }

  // -------------------------------------------------------- settings
  Column {
    visible: sheets.kind === "settings"
    x: 12; y: 44; width: parent.width - 24; spacing: 10

    Row {
      spacing: 10
      Text { font.family: Style.font.family; anchors.verticalCenter: parent.verticalCenter; width: 70; text: "Sound"; textFormat: Text.PlainText; font.pixelSize: 13; font.bold: true; color: th.text }
      Rectangle {
        width: 52; height: 26; radius: 13
        color: sheets.cur() && sheets.cur().settings.sound ? th.good : th.surfaceHi
        Rectangle { width: 20; height: 20; radius: 10; y: 3; x: sheets.cur() && sheets.cur().settings.sound ? 29 : 3; color: th.bg; Behavior on x { NumberAnimation { duration: 140; easing.type: Easing.OutCubic } } }
        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: ctl.setSetting("sound", !(sheets.cur() && sheets.cur().settings.sound)) }
      }
    }
    Row {
      spacing: 10
      opacity: sheets.cur() && sheets.cur().settings.sound ? 1 : 0.4
      Text { font.family: Style.font.family; anchors.verticalCenter: parent.verticalCenter; width: 70; text: "Volume"; textFormat: Text.PlainText; font.pixelSize: 13; font.bold: true; color: th.text }
      Rectangle {
        id: volTrack
        anchors.verticalCenter: parent.verticalCenter
        width: 170; height: 10; radius: 5; color: th.surfaceHi
        Rectangle { width: parent.width * (sheets.cur() ? sheets.cur().settings.volume : 0) / 100; height: parent.height; radius: 5; color: th.accent }
        Rectangle { x: parent.width * (sheets.cur() ? sheets.cur().settings.volume : 0) / 100 - 9; y: -4; width: 18; height: 18; radius: 9; color: th.bg; border.color: th.accent; border.width: 2 }
        MouseArea {
          anchors.fill: parent; anchors.margins: -8
          cursorShape: Qt.PointingHandCursor
          function setFrom(mx) { ctl.setSetting("volume", Math.max(0, Math.min(100, Math.round((mx - 8) / volTrack.width * 100)))) }
          onPressed: function (m) { setFrom(m.x) }
          onPositionChanged: function (m) { if (pressed) setFrom(m.x) }
          onReleased: ctl.sfx("click")
        }
      }
    }

    Text { font.family: Style.font.family; text: "Pet name"; textFormat: Text.PlainText; font.pixelSize: 13; font.bold: true; color: th.text }
    Rectangle {
      width: parent.width; height: 36; radius: 12; color: th.bg; border.width: 2; border.color: renameField.activeFocus ? th.accent : th.line
      TextInput {
        id: renameField
        anchors.fill: parent; anchors.leftMargin: 10; anchors.rightMargin: 10
        verticalAlignment: TextInput.AlignVCenter
        maximumLength: 14; selectByMouse: true
        font.pixelSize: 14; font.bold: true; color: th.text
        text: sheets.cur() && sheets.cur().pet ? sheets.cur().pet.name : ""
        onEditingFinished: ctl.rename(text)
        Keys.onReturnPressed: { ctl.rename(text); focus = false }
      }
      MouseArea { anchors.fill: parent; z: -1; onClicked: renameField.forceActiveFocus() }
    }

    Row {
      spacing: 8
      Rectangle {
        width: 112; height: 34; radius: 12; color: th.surface; border.color: th.line
        Text { anchors.centerIn: parent; text: "🏆 Goals"; textFormat: Text.PlainText; font.pixelSize: 12; font.bold: true; color: th.text; font.family: Style.font.family }
        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: ctl.openSheet("goals") }
      }
      Rectangle {
        id: resetBtn
        property bool armed: false
        width: 168; height: 34; radius: 12; color: armed ? th.bad : th.surface; border.color: th.line
        Text { anchors.centerIn: parent; text: resetBtn.armed ? "Really reset everything?" : "🗑️ Reset pet"; textFormat: Text.PlainText; font.pixelSize: 12; font.bold: true; color: resetBtn.armed ? th.bg : th.bad; font.family: Style.font.family }
        MouseArea {
          anchors.fill: parent; cursorShape: Qt.PointingHandCursor
          onClicked: { if (resetBtn.armed) { resetBtn.armed = false; ctl.resetAll() } else { resetBtn.armed = true; disarm.restart() } }
        }
        Timer { id: disarm; interval: 3000; onTriggered: resetBtn.armed = false }
      }
    }

    Text { font.family: Style.font.family;
      width: parent.width; wrapMode: Text.WordWrap; textFormat: Text.PlainText
      text: "Tip: drag the header to move the widget. Toggle the card from a keybinding with:\n  omarchy-shell pet toggle"
      font.pixelSize: 10; color: th.dim
    }
  }
}
