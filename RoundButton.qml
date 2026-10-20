// A chunky pastel action button: emoji on top, tiny label underneath.

import QtQuick
import qs.Commons

Item {
  id: btn
  property var th: null

  property string icon: ""
  property string label: ""
  property color tint: th.surfaceHi
  property bool toggled: false
  property bool alert: false
  property bool enabled2: true
  signal clicked()

  implicitWidth: 48
  implicitHeight: 54

  Rectangle {
    id: face
    anchors.fill: parent
    radius: 15
    color: btn.toggled ? Qt.darker(btn.tint, 1.06) : btn.tint
    border.width: 2
    border.color: btn.toggled ? th.accent : Qt.darker(btn.tint, 1.08)
    opacity: btn.enabled2 ? 1 : 0.5
    scale: tap.pressed ? 0.92 : (tap.containsMouse ? 1.05 : 1.0)
    Behavior on scale { NumberAnimation { duration: 110; easing.type: Easing.OutBack } }

    Column {
      anchors.centerIn: parent
      spacing: 1
      Text {
        anchors.horizontalCenter: parent.horizontalCenter
        text: btn.icon
        textFormat: Text.PlainText
        font.pixelSize: 22
        font.family: "Noto Color Emoji"
      }
      Text { font.family: Style.font.family;
        anchors.horizontalCenter: parent.horizontalCenter
        text: btn.label
        textFormat: Text.PlainText
        font.pixelSize: 9
        font.bold: true
        color: th.text
      }
    }

    Rectangle { // "needs attention" dot
      visible: btn.alert
      width: 11; height: 11; radius: 6
      color: th.bad; border.color: th.bg; border.width: 2
      anchors.right: parent.right; anchors.top: parent.top
      anchors.margins: -2
      SequentialAnimation on scale {
        running: btn.alert
        loops: Animation.Infinite
        NumberAnimation { to: 1.3; duration: 380; easing.type: Easing.InOutQuad }
        NumberAnimation { to: 0.9; duration: 380; easing.type: Easing.InOutQuad }
      }
    }
  }

  MouseArea {
    id: tap
    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: btn.clicked()
  }
}
