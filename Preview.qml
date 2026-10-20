// A tiny live preview: a pet, a pet wearing a hat, or a room.

import QtQuick
import "Sprites.js" as Sprites
import "Scenes.js" as Scenes

Canvas {
  id: pv
  property var th: null

  property string kind: "pet"       // "pet" | "hat" | "room"
  property string petType: "cat"
  property string hat: "none"
  property string room: "meadow"
  property int stage: 3
  property real zoom: 2.4
  property string eyes: "open"

  width: 56
  height: 56
  onPaint: {
    var ctx = getContext("2d")
    ctx.reset()
    if (kind === "room") {
      ctx.save()
      ctx.scale(width / 232, width / 232)
      Scenes.drawRoom(ctx, 232, height * 232 / width, room, 0, height * 232 / width * 0.7, th.roomPalette())
      ctx.restore()
      return
    }
    ctx.save()
    ctx.translate(width / 2, height - 3)
    Sprites.drawPet(ctx, { pal: th.petPalette(petType), type: petType, S: zoom, stage: stage, eyes: eyes, mouth: "smile", hat: kind === "hat" ? hat : "none", blush: 0.3, tailAmp: 1, tailPhase: 0.6 })
    ctx.restore()
  }
  Connections { target: pv.th; function onHuesChanged() { pv.requestPaint() } }
  onKindChanged: requestPaint()
  onPetTypeChanged: requestPaint()
  onHatChanged: requestPaint()
  onRoomChanged: requestPaint()
  onStageChanged: requestPaint()
  onEyesChanged: requestPaint()
  Component.onCompleted: requestPaint()
}
