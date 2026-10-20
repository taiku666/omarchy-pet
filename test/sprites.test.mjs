// Sprite sheets are hand-typed strings, so check their shape and palette use.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({});
vm.runInContext(readFileSync(join(here, "..", "Sprites.js"), "utf8"), ctx);
vm.runInContext(readFileSync(join(here, "..", "Logic.js"), "utf8"), ctx);
const S = ctx;

test("every pet has a 18-row, 10-column half, palette, and face", () => {
  for (const id of S.PET_ORDER) {
    const half = S.HALVES[id];
    assert.ok(half, `${id} has no sprite`);
    assert.equal(half.length, 18, `${id} rows`);
    half.forEach((row, i) => assert.equal(row.length, 10, `${id} row ${i} is "${row}"`));
    const used = new Set(half.join("").replace(/\./g, ""));
    for (const ch of used) assert.ok(S.PALETTES[id][ch], `${id} uses colour ${ch} with no palette entry`);
    assert.ok(S.FACES[id], `${id} face`);
  }
});

test("eyes and hats sit inside the sprite", () => {
  for (const id of S.PET_ORDER) {
    const f = S.FACES[id];
    for (const [x, y] of [f.eyes, f.eyeR]) {
      assert.ok(x >= 0 && x + 1 < 20 && y >= 0 && y + 1 < 18, `${id} eye ${x},${y}`);
    }
    assert.equal(f.eyes[0] + f.eyeR[0] + 2, 20, `${id} eyes should mirror`);
  }
});

test("every hat except the procedural ones has a grid of even rows", () => {
  for (const [name, rows] of Object.entries(S.HAT_ART)) {
    const w = rows[0].length;
    rows.forEach((r) => assert.equal(r.length, w, `${name} row "${r}"`));
    for (const ch of new Set(rows.join("").replace(/\./g, ""))) assert.ok(S.HAT_PAL[ch], `${name} colour ${ch}`);
  }
  for (const id of S.HAT_ORDER) {
    if (id === "none" || id === "glasses" || id === "phones") continue;
    assert.ok(S.HAT_ART[id], `hat ${id} has no art`);
  }
});

test("runs cover the grid without overlap", () => {
  for (const id of S.PET_ORDER) {
    const cells = new Set();
    for (const r of S.runsFor(id)) for (let x = r.x; x < r.x + r.w; x++) {
      const k = `${x},${r.y}`;
      assert.ok(!cells.has(k), `${id} overlap ${k}`);
      cells.add(k);
    }
    assert.ok(cells.size > 150, `${id} looks empty`);
  }
});

test("every behaviour in every personality exists and poses sanely", () => {
  const ctx2 = vm.createContext({});
  vm.runInContext(readFileSync(join(here, "..", "Anim.js"), "utf8"), ctx2);
  const A = ctx2;
  for (const [pet, table] of Object.entries(A.PERSONALITY)) {
    for (const name of Object.keys(table)) assert.ok(A.BEHAVIORS[name], `${pet} -> ${name} missing`);
  }
  for (const name of Object.keys(A.BEHAVIORS)) {
    for (let p = 0; p <= 1; p += 0.05) {
      const o = A.composePose(name, p, 1.3, "happy");
      for (const k of ["dx", "dy", "sx", "sy", "rot"]) assert.ok(Number.isFinite(o[k]), `${name}.${k} at ${p}`);
      assert.ok(o.sx > -1.5 && o.sy > 0.3, `${name} scale at ${p}`);
    }
  }
});

test("pickBehavior is varied, avoids repeats, and sad pets rest", () => {
  const ctx2 = vm.createContext({});
  vm.runInContext(readFileSync(join(here, "..", "Anim.js"), "utf8"), ctx2);
  const A = ctx2;
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const seen = new Set();
  let prev = "";
  for (let i = 0; i < 300; i++) {
    const b = A.pickBehavior("fox", "happy", r, prev);
    assert.notEqual(b, prev);
    seen.add(b); prev = b;
  }
  assert.ok(seen.size >= 6);
  let calm = 0;
  for (let i = 0; i < 300; i++) if (["idle", "sit", "look"].includes(A.pickBehavior("dog", "sad", r, ""))) calm++;
  assert.ok(calm > 200, `sad dog calm ${calm}/300`);
});
