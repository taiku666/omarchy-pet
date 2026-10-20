// One need: icon, animated bar, and a number. Low values pulse so a neglected
// need is visible at a glance without reading anything.

import QtQuick
import qs.Commons

Item {
  id: bar
  property var th: null

  property string icon: ""
  property string label: ""
  property real value: 0          // 0..100

  readonly property color fillColor: value >= 60 ? th.good : value >= 30 ? th.warn : th.bad
  readonly property bool low: value < 30

  implicitHeight: 18

  Text {
    id: glyph
    x: 0
    anchors.verticalCenter: parent.verticalCenter
    width: 22
    horizontalAlignment: Text.AlignHCenter
    text: bar.icon
    textFormat: Text.PlainText
    font.pixelSize: 13
    font.family: "Noto Color Emoji"
    SequentialAnimation on y {
      running: bar.low
      loops: Animation.Infinite
      NumberAnimation { to: -2; duration: 280; easing.type: Easing.OutQuad }
      NumberAnimation { to: 2; duration: 280; easing.type: Easing.InQuad }
    }
  }

  Text { font.family: Style.font.family;
    id: name
    anchors.left: glyph.right
    anchors.leftMargin: 4
    anchors.verticalCenter: parent.verticalCenter
    width: 76
    text: bar.label
    textFormat: Text.PlainText
    color: th.dim
    font.pixelSize: 11
    font.bold: true
  }

  Rectangle {
    id: track
    anchors.left: name.right
    anchors.right: num.left
    anchors.rightMargin: 8
    anchors.verticalCenter: parent.verticalCenter
    height: 10
    radius: 5
    color: th.surfaceHi
    border.color: th.line
    border.width: 1
    clip: true

    Rectangle {
      id: fill
      height: parent.height
      width: Math.max(parent.height, parent.width * Math.max(0, Math.min(100, bar.value)) / 100)
      radius: 5
      color: bar.fillColor
      Behavior on width { NumberAnimation { duration: 450; easing.type: Easing.OutCubic } }
      Behavior on color { ColorAnimation { duration: 400 } }
      opacity: 1
      SequentialAnimation on opacity {
        running: bar.low
        loops: Animation.Infinite
        NumberAnimation { to: 0.55; duration: 450 }
        NumberAnimation { to: 1.0; duration: 450 }
      }
      Rectangle { // glossy highlight
        x: 4; y: 2; height: 2; radius: 1
        width: Math.max(0, parent.width - 8)
        color: th.bg; opacity: 0.45
      }
    }
  }

  Text {
    id: num
    anchors.right: parent.right
    anchors.verticalCenter: parent.verticalCenter
    width: 30
    horizontalAlignment: Text.AlignRight
    text: bar.value >= 99.5 ? "MAX" : Math.round(bar.value)
    textFormat: Text.PlainText
    color: bar.value >= 99.5 ? th.gold : th.dim
    font.pixelSize: 10
    font.bold: true
    font.family: "monospace"
  }
}
