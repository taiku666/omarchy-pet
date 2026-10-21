// A card in the food, play and shop sheets.

import QtQuick
import qs.Commons

Rectangle {
  id: chip
  property var th: null

  property string emoji: ""
  property string title: ""
  property string subtitle: ""
  property string badge: ""
  property bool dim: false
  property bool highlighted: false
  property alias preview: slot.data
  signal clicked()

  width: 92
  height: 96
  radius: 14
  color: highlighted ? th.mix(th.bg, th.accent, 0.22) : th.surface
  border.width: 2
  border.color: highlighted ? th.accent : th.line
  scale: tap.pressed ? 0.95 : 1
  Behavior on scale { NumberAnimation { duration: 100; easing.type: Easing.OutBack } }

  Item {
    id: slot
    anchors.top: parent.top
    anchors.topMargin: 6
    anchors.horizontalCenter: parent.horizontalCenter
    width: 56; height: 50
    opacity: chip.dim ? 0.45 : 1

    Text {
      anchors.centerIn: parent
      visible: chip.emoji !== ""
      text: chip.emoji
      textFormat: Text.PlainText
      font.pixelSize: 32
      font.family: Style.font.family
    }
  }

  Text { font.family: Style.font.family;
    anchors.top: slot.bottom
    anchors.topMargin: 2
    anchors.horizontalCenter: parent.horizontalCenter
    width: parent.width - 8
    horizontalAlignment: Text.AlignHCenter
    elide: Text.ElideRight
    text: chip.title
    textFormat: Text.PlainText
    font.pixelSize: 11
    font.bold: true
    color: chip.dim ? th.dim : th.text
  }
  Text { font.family: Style.font.family;
    anchors.bottom: parent.bottom
    anchors.bottomMargin: 6
    anchors.horizontalCenter: parent.horizontalCenter
    width: parent.width - 8
    horizontalAlignment: Text.AlignHCenter
    elide: Text.ElideRight
    text: chip.subtitle
    textFormat: Text.PlainText
    font.pixelSize: 10
    color: chip.dim ? th.mix(th.dim, th.bg, 0.45) : th.dim
  }

  Rectangle {
    visible: chip.badge !== ""
    anchors.top: parent.top; anchors.right: parent.right; anchors.margins: 4
    width: badgeText.implicitWidth + 10; height: 16; radius: 8
    color: th.gold
    Text { font.family: Style.font.family;
      id: badgeText
      anchors.centerIn: parent
      text: chip.badge
      textFormat: Text.PlainText
      font.pixelSize: 9; font.bold: true; color: th.onAccent
    }
  }

  MouseArea {
    id: tap
    anchors.fill: parent
    cursorShape: Qt.PointingHandCursor
    onClicked: chip.clicked()
  }
}
