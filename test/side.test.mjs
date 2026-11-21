// Side-view pets are built from shapes, so check they stay inside the grid and
// only use colours the palette has.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({});
for (const f of ["Sprites.js", "Logic.js", "SideSprites.js"]) vm.runInContext(readFileSync(join(here, "..", f), "utf8"), ctx);
const S = ctx;

test("every pet has a side view, the penguin included", () => {
  for (const id of S.SIDE_PETS) assert.ok(S.PETS[id] && S.PALETTES[id], id);
  for (const id of S.PET_ORDER) assert.ok(S.hasSide(id), `${id} has no profile`);
  assert.equal(S.SIDE_PETS.length, 8);
});

test("side bodies fit the grid and use only palette colours", () => {
  for (const id of S.SIDE_PETS) {
    const { rows, runs } = S.bodyRuns(id);
    assert.equal(rows.length, S.SH, id);
    rows.forEach((r, i) => assert.equal(r.length, S.SW, `${id} row ${i}`));
    for (const r of runs) assert.ok(S.PALETTES[id][r.c], `${id} uses ${r.c}`);
    for (const row of S.SIDE[id].art) assert.equal(row.length, S.SW, `${id} art row "${row}"`);
    // Nothing may touch the outer edge, or the outline would be cut off.
    assert.ok(rows[0].split("").every((c) => c === "." || c === "o"), `${id} top row`);
    assert.ok(rows.every((r) => (r[0] === "." || r[0] === "o") && (r[S.SW - 1] === "." || r[S.SW - 1] === "o")), `${id} side edges`);
  }
});

test("legs and face anchors sit inside the grid", () => {
  for (const id of S.SIDE_PETS) {
    const sp = S.SIDE[id], l = sp.legs, f = sp.face;
    for (const x of [l.back, l.front]) assert.ok(x - 1 >= 0 && x + l.w + 1 <= S.SW, `${id} leg x ${x}`);
    assert.ok(l.top < S.GROUND, id);
    assert.ok(f.eye[0] >= 0 && f.eye[0] + 2 <= S.SW && f.eye[1] >= 0 && f.eye[1] + 2 <= S.SH, `${id} eye`);
    assert.ok(S.GAITS[sp.gait], `${id} gait ${sp.gait}`);
  }
});

test("a standing leg is planted and a stepping one is lifted at the half-stride", () => {
  for (const kind of Object.keys(S.GAITS)) {
    let planted = 0, lifted = 0;
    for (let i = 0; i < 4; i++) for (let ph = 0; ph < 1; ph += 0.05) {
      const s = S.legState(kind, i, ph);
      assert.ok(s.x >= -1.0001 && s.x <= 1.0001, `${kind} x ${s.x}`);
      if (s.lift === 0) planted++; else lifted++;
    }
    assert.ok(planted > 0 && lifted > 0, kind);
  }
});

test("a stride is the foot sweep over the planted share of the cycle, stretched by the cartoon factor", () => {
  for (const kind of Object.keys(S.GAITS)) {
    const g = S.GAITS[kind], air = { hop: 2.4, bound: 1.8 }[kind] || 1;
    assert.ok(Math.abs(S.strideLength(kind, 1) * g.duty / air - 2 * S.REACH * S.STRIDE_SCALE) < 1e-9, kind);
    assert.ok(S.strideLength(kind, 1) / air > 8, `${kind} stride is long enough not to flicker`);
  }
});

test("gait amount ramps from standing to full, and the turn is continuous", () => {
  assert.equal(S.gaitAmount(0), 0);
  assert.equal(S.gaitAmount(1000), 1);
  assert.ok(S.gaitAmount(35) > 0 && S.gaitAmount(35) < 1);
  assert.equal(S.turnScale(0), 1);
  assert.equal(S.turnScale(1), 1);
  assert.ok(Math.abs(S.turnScale(0.4999) - S.turnScale(0.5001)) < 0.01, "no jump at the swap");
  assert.ok(S.turnScale(0.5) < 0.3);
});

test("rolling pandas and sliding penguins stay front-on", () => {
  assert.equal(S.showsSide("panda", "pandaRoll"), false);
  assert.equal(S.showsSide("panda", "pandaWaddle"), true);
  assert.equal(S.showsSide("penguin", "penguinSlide"), false);
  assert.equal(S.showsSide("penguin", "penguinWaddle"), true);
});

test("walkers rise at most a row, hoppers rise through sideBob instead", () => {
  for (const kind of ["walk", "trot", "amble", "stomp", "waddle"]) for (let p = 0; p < 1; p += 0.05) {
    const r = S.walkLift(kind, p, 1);
    assert.ok(r >= 0 && r <= 1, `${kind} lift ${r}`);
  }
  assert.equal(S.walkLift("hop", 0.3, 1), 0);
  assert.equal(S.walkLift("walk", 0.25, 0), 0);
});

// A tiny canvas that records which sprite cells get painted.
function cells(draw) {
  const set = new Map(); let tx = 0, ty = 0; const stack = [];
  const g = { fillStyle: "", save() { stack.push([tx, ty]); }, restore() { [tx, ty] = stack.pop(); }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, w, h) { for (let i = 0; i < Math.floor(w); i++) for (let j = 0; j < Math.floor(h); j++) set.set(`${Math.round(tx + x) + i},${Math.round(ty + y) + j}`, g.fillStyle); } };
  draw(g);
  return set;
}

test("legs stay attached: every leg column reaches from the hips to the ground", () => {
  for (const id of S.SIDE_PETS) for (let ph = 0; ph < 1; ph += 0.1) {
    const pal = S.PALETTES[id];
    const painted = cells((g) => { g.translate(S.SW / 2, S.SH); S.drawSidePet(g, { lib: S, pal, type: id, S: 1, gait: ph, gaitAmt: 1, stage: 1 }); });
    const lg = S.SIDE[id].legs, bob = S.sideBob(S.SIDE[id].gait, ph, 1) + S.walkLift(S.SIDE[id].gait, ph, 1);
    // Every row between the hips and the lowest foot has some leg pixel.
    let low = 0;
    for (const k of painted.keys()) low = Math.max(low, +k.split(",")[1]);
    for (let y = lg.top - bob; y <= low; y++) {
      const any = [...painted.keys()].some((k) => +k.split(",")[1] === y);
      assert.ok(any, `${id} gap at row ${y}, phase ${ph.toFixed(1)}`);
    }
    if (bob === 0) assert.equal(low, S.GROUND, `${id} feet on the ground at phase ${ph.toFixed(1)}`);
  }
});

test("a lifted foot rises off the ground and a planted one does not", () => {
  const planted = S.legState("walk", 0, 0.1), swinging = S.legState("walk", 0, 0.8);
  assert.equal(planted.lift, 0);
  assert.ok(swinging.lift > 0.5);
  // The swing eases: slow at both ends, fast in the middle.
  const a = S.legState("walk", 0, 0.66).x, b = S.legState("walk", 0, 0.70).x, c = S.legState("walk", 0, 0.80).x, d = S.legState("walk", 0, 0.84).x;
  assert.ok(d - c > b - a, "swing is fastest mid-air");
});

test("only the penguin rocks while it walks", () => {
  assert.equal(S.waddleRock("walk", 0.25, 1), 0);
  assert.ok(Math.abs(S.waddleRock("waddle", 0.25, 1)) > 0.05);
});
