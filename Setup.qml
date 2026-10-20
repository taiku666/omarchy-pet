// First run: choose a pet and give it a name. The egg appears afterwards.

import QtQuick
import qs.Commons
import "Logic.js" as Logic

Rectangle {
  id: setup
  readonly property var th: ctl ? ctl.th : null

  property var ctl: null
  property string chosen: ""
  property string nameText: ""

  readonly property var names: {
    "cat": ["Mochi", "Miso", "Luna", "Pixel"], "dog": ["Biscuit", "Waffles", "Buddy", "Pip"],
    "bunny": ["Clover", "Nibbles", "Bun", "Mallow"], "frog": ["Pond", "Hopper", "Kermi", "Lily"],
    "panda": ["Bao", "Dumpling", "Bamboo", "Mimi"], "fox": ["Ember", "Rusty", "Kit", "Sunny"],
    "dragon": ["Spark", "Ziggy", "Ember", "Nugget"], "penguin": ["Waddles", "Pebble", "Frost", "Noot"]
  }

  color: th.bg
  radius: 20

  function pick(id) {
    chosen = id
    var list = names[id]
    nameText = list[Math.floor(Math.random() * list.length)]
    nameField.text = nameText
  }

  Column {
    anchors.fill: parent
    anchors.margins: 14
    spacing: 8

    Text { font.family: Style.font.family;
      width: parent.width
      horizontalAlignment: Text.AlignHCenter
      text: "Choose your pet"
      textFormat: Text.PlainText
      font.pixelSize: 18; font.bold: true; color: th.text
    }
    Text { font.family: Style.font.family;
      width: parent.width
      horizontalAlignment: Text.AlignHCenter
      text: "Who will keep you company today?"
      textFormat: Text.PlainText
      font.pixelSize: 11; color: th.dim
    }

    Grid {
      id: grid
      columns: 4
      spacing: 6
      anchors.horizontalCenter: parent.horizontalCenter
      Repeater {
        model: Logic.PET_ORDER
        delegate: Rectangle {
          required property string modelData
          width: 74; height: 88; radius: 14
          color: setup.chosen === modelData ? th.mix(th.bg, th.accent, 0.22) : th.surface
          border.width: 2
          border.color: setup.chosen === modelData ? th.accent : th.line
          scale: setup.chosen === modelData ? 1.04 : (tile.containsMouse ? 1.03 : 1)
          Behavior on scale { NumberAnimation { duration: 120; easing.type: Easing.OutBack } }

          Preview {
            th: setup.th
            anchors.top: parent.top; anchors.topMargin: 6
            anchors.horizontalCenter: parent.horizontalCenter
            width: 62; height: 56
            petType: modelData
            stage: 3
            zoom: 2.8
            eyes: setup.chosen === modelData ? "happy" : "open"
          }
          Text { font.family: Style.font.family;
            anchors.bottom: parent.bottom; anchors.bottomMargin: 7
            anchors.horizontalCenter: parent.horizontalCenter
            text: Logic.PETS[modelData].label
            textFormat: Text.PlainText
            font.pixelSize: 11; font.bold: true; color: th.text
          }
          MouseArea {
            id: tile
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: { setup.pick(modelData); ctl.sfx("click") }
          }
        }
      }
    }

    Rectangle {
      width: parent.width; height: 44; radius: 12
      color: th.surface; border.color: th.line; border.width: 1
      Text { font.family: Style.font.family;
        anchors.fill: parent; anchors.margins: 8
        verticalAlignment: Text.AlignVCenter
        wrapMode: Text.WordWrap
        textFormat: Text.PlainText
        text: setup.chosen === "" ? "Tap a pet to meet it." : Logic.PETS[setup.chosen].blurb + "  Loves " + Logic.FOODS[Logic.PETS[setup.chosen].favorite].emoji
        font.pixelSize: 11; color: th.text
      }
    }

    Row {
      width: parent.width
      spacing: 8
      Rectangle {
        width: parent.width - 96; height: 38; radius: 12
        color: th.bg; border.width: 2; border.color: nameField.activeFocus ? th.accent : th.line
        TextInput {
          id: nameField
          anchors.fill: parent; anchors.leftMargin: 10; anchors.rightMargin: 10
          verticalAlignment: TextInput.AlignVCenter
          maximumLength: 14
          selectByMouse: true
          font.pixelSize: 14; font.bold: true; color: th.text
          onTextChanged: setup.nameText = text
          Keys.onReturnPressed: go.go()
          Text { font.family: Style.font.family;
            visible: nameField.text === "" && !nameField.activeFocus
            anchors.verticalCenter: parent.verticalCenter
            text: "Name your pet"
            textFormat: Text.PlainText
            color: th.dim; font.pixelSize: 14
          }
        }
        MouseArea { anchors.fill: parent; z: -1; onClicked: nameField.forceActiveFocus() }
      }
      Rectangle {
        id: go
        width: 88; height: 38; radius: 12
        color: setup.chosen === "" ? th.surfaceHi : th.accent
        function go() {
          if (setup.chosen === "") return
          var n = Logic.cleanName(setup.nameText)
          ctl.choosePet(setup.chosen, n === "" ? Logic.PETS[setup.chosen].label : n)
        }
        Text { anchors.centerIn: parent; text: "Hatch! 🥚"; textFormat: Text.PlainText; font.pixelSize: 13; font.bold: true; color: th.bg; font.family: Style.font.family }
        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: go.go() }
      }
    }
  }
}
