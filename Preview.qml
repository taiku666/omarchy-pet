// A tiny live preview: a pet, or a pet wearing a hat.

import QtQuick
import "Sprites.js" as Sprites

Canvas {
  id: pv
  property var th: null

  property string kind: "pet"       // "pet" | "hat"
  property string petType: "cat"
  property string hat: "none"
  property int stage: 3
  property real zoom: 2.4
  property string eyes: "open"

  width: 56
  height: 56
  onPaint: {
    var ctx = getContext("2d")
    ctx.reset()
    ctx.save()
    ctx.translate(width / 2, height - 3)
    Sprites.drawPet(ctx, { pal: th.petPalette(petType), type: petType, S: zoom, stage: stage, eyes: eyes, mouth: "smile", hat: kind === "hat" ? hat : "none", blush: 0.3, tailAmp: 1, tailPhase: 0.6 })
    ctx.restore()
  }
  Connections { target: pv.th; function onHuesChanged() { pv.requestPaint() } }
  onKindChanged: requestPaint()
  onPetTypeChanged: requestPaint()
  onHatChanged: requestPaint()
  onStageChanged: requestPaint()
  onEyesChanged: requestPaint()
  Component.onCompleted: requestPaint()
}
