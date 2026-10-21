// Tests for the pet's rules. Logic.js is a QML .js resource, so it is
// evaluated in a VM context instead of imported.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({});
vm.runInContext(readFileSync(join(here, "..", "Logic.js"), "utf8"), ctx);
const L = ctx;

const NOW = Date.UTC(2026, 9, 20, 12, 0, 0);
function fresh(type = "cat") {
  const s = L.defaultState(NOW);
  s.pet = { type, name: "Mochi", hatched: true };
  L.giveStarters(s);
  return s;
}

test("every pet has a favourite food that exists and is free for that pet", () => {
  for (const id of L.PET_ORDER) {
    const s = fresh(id);
    const fav = L.PETS[id].favorite;
    assert.ok(L.FOODS[fav], `${id} favourite ${fav} missing`);
    assert.equal(L.FOODS[fav].favoriteOf, id);
    assert.ok(L.foodAvailable(s, fav), `${id} cannot eat ${fav}`);
  }
});

test("stats stay within the floor and 100 after a long time", () => {
  const s = fresh();
  L.step(s, 3600 * 48, 1);
  for (const k of L.STAT_KEYS) {
    assert.ok(s.stats[k] >= L.STAT_FLOOR && s.stats[k] <= 100, `${k}=${s.stats[k]}`);
  }
});

test("time away is gentler than time awake and capped", () => {
  const awake = fresh(), away = fresh();
  L.step(awake, 4 * 3600, 1);
  away.lastSeen = NOW - 4 * 3600 * 1000;
  const minutes = L.applyAway(away, NOW);
  assert.equal(minutes, 240);
  assert.ok(away.stats.hunger > awake.stats.hunger);

  const weeks = fresh();
  weeks.lastSeen = NOW - 90 * 24 * 3600 * 1000;
  L.applyAway(weeks, NOW);
  assert.ok(weeks.stats.hunger >= L.STAT_FLOOR);
  assert.ok(weeks.messes <= 2);
});

test("short gaps are ignored", () => {
  const s = fresh();
  s.lastSeen = NOW - 30 * 1000;
  assert.equal(L.applyAway(s, NOW), 0);
  assert.equal(s.stats.hunger, 80);
});

test("sleeping restores energy and wakes at full", () => {
  const s = fresh();
  s.stats.energy = 40;
  L.startSleep(s);
  L.step(s, 10, 1);
  assert.ok(s.stats.energy > 60);
  L.step(s, 60, 1);
  assert.equal(s.sleeping, false);
  assert.equal(s.stats.energy, 100);
});

test("feeding raises hunger; favourite is better; full pet refuses", () => {
  const a = fresh("cat"), b = fresh("cat");
  a.stats.hunger = b.stats.hunger = 20;
  a.stats.happiness = b.stats.happiness = 50;
  const plain = L.feed(a, "apple");
  const loved = L.feed(b, "fish");
  assert.equal(plain.kind, "ate");
  assert.equal(loved.kind, "loved");
  assert.ok(b.stats.happiness > a.stats.happiness);
  const full = fresh();
  full.stats.hunger = 100;
  assert.equal(L.feed(full, "apple").kind, "full");
  assert.equal(full.counters.feeds, 0);
});

test("cannot feed or pet a sleeping pet", () => {
  const s = fresh();
  L.startSleep(s);
  assert.equal(L.feed(s, "apple"), null);
  assert.equal(L.pet(s, 2), null);
});

test("playing costs energy, gives coins and happiness", () => {
  const s = fresh();
  s.stats.happiness = 40;
  const e = s.stats.energy, c = s.coins;
  const r = L.playResult(s, "ball", 10);
  assert.ok(s.stats.happiness > 40);
  assert.ok(s.stats.energy < e);
  assert.ok(s.coins >= c + r.coins);
  assert.equal(s.counters.games, 1);
});

test("xp levels up and pays coins", () => {
  const s = fresh();
  const need = L.xpForLevel(1);
  const gained = L.addXp(s, need + 1);
  assert.equal(gained, 1);
  assert.equal(s.level, 2);
  assert.equal(s.xp, 1);
  assert.ok(s.coins > 20);
});

test("stage thresholds", () => {
  assert.equal(L.stageForLevel(1), 0);
  assert.equal(L.stageForLevel(3), 1);
  assert.equal(L.stageForLevel(6), 2);
  assert.equal(L.stageForLevel(10), 3);
  assert.equal(L.stageName("dragon", 10), "Elder Dragon");
});

test("cleaning removes messes and raises cleanliness", () => {
  const s = fresh();
  s.messes = 3;
  s.stats.cleanliness = 30;
  const r = L.clean(s, 1);
  assert.equal(r.removed, 1);
  assert.equal(s.messes, 2);
  assert.ok(s.stats.cleanliness > 30);
  L.bathe(s);
  assert.equal(s.messes, 0);
});

test("messes arrive over time but are capped", () => {
  const s = fresh();
  L.step(s, 3600 * 10, 1);
  assert.ok(s.messes > 0 && s.messes <= L.MAX_MESSES);
});

test("mood priorities", () => {
  const s = fresh();
  assert.equal(L.mood(s), "playful");
  s.stats.hunger = 10;
  assert.equal(L.mood(s), "hungry");
  s.stats.happiness = 10;
  assert.equal(L.mood(s), "sad");
  L.startSleep(s);
  assert.equal(L.mood(s), "sleeping");
});

test("buying checks coins, level, ownership", () => {
  const s = fresh();
  s.coins = 5;
  assert.equal(L.buy(s, "hats", "bow"), "coins");
  s.coins = 500;
  assert.equal(L.buy(s, "hats", "crown"), "level");
  assert.equal(L.buy(s, "hats", "bow"), "ok");
  assert.equal(L.buy(s, "hats", "bow"), "owned");
  assert.equal(L.buy(s, "hats", "nope"), "unknown");
  assert.equal(L.buy(s, "foods", "cake"), "ok");
  assert.equal(s.coins, 500 - 15 - 12);
});

test("streak: consecutive days grow, gaps reset, same day is a no-op", () => {
  const s = fresh();
  assert.equal(L.touchStreak(s, NOW).length, 1);
  assert.equal(L.touchStreak(s, NOW + 1000).length, 0);
  L.touchStreak(s, NOW + 24 * 3600 * 1000);
  assert.equal(s.streak.days, 2);
  L.touchStreak(s, NOW + 5 * 24 * 3600 * 1000);
  assert.equal(s.streak.days, 1);
});

test("milestones pay once", () => {
  const s = fresh();
  s.counters.feeds = 1;
  const c = s.coins;
  assert.deepEqual(Array.from(L.checkMilestones(s)), ["firstMeal"]);
  assert.equal(s.coins, c + L.MILESTONES.firstMeal.reward);
  assert.equal(L.checkMilestones(s).length, 0);
});

test("mergeState keeps saves forward-compatible and sanitises", () => {
  const s = L.mergeState({ coins: "12.7", level: 0, pet: { type: "unicorn" }, stats: { hunger: 500 } }, NOW);
  assert.equal(s.pet, null);
  assert.equal(s.coins, 12);
  assert.equal(s.level, 1);
  assert.equal(s.stats.hunger, 100);
  assert.ok(s.unlocked.hats.includes("none"));
  assert.equal(L.cleanName("  \u0007Mochi the Magnificent!!  "), "Mochi the Magn");
});

test("food is used up, bought by the portion, and the apple never runs out", () => {
  const s = fresh("cat");
  s.stats.hunger = 20;
  assert.equal(s.pantry.fish, 3);
  assert.equal(L.feed(s, "fish").kind, "loved");
  assert.equal(s.pantry.fish, 2);
  assert.equal(L.feed(s, "cake").kind, "none");           // none bought yet
  assert.equal(s.pantry.cake, undefined);
  s.coins = 100;
  assert.equal(L.buy(s, "foods", "cake"), "ok");
  assert.equal(L.buy(s, "foods", "cake"), "ok");
  assert.equal(s.pantry.cake, 2);
  assert.equal(s.coins, 100 - 24);
  s.coins = 0;
  assert.equal(L.buy(s, "foods", "cake"), "coins");
  assert.equal(L.buy(s, "foods", "apple"), "owned");      // unlimited, nothing to buy
  for (let i = 0; i < 20; i++) { s.stats.hunger = 10; assert.equal(L.feed(s, "apple").kind, "ate"); }
  assert.equal(L.foodAvailable(s, "apple"), true);
});

test("feeding a full pet does not use up food", () => {
  const s = fresh("cat");
  s.stats.hunger = 100;
  assert.equal(L.feed(s, "fish").kind, "full");
  assert.equal(s.pantry.fish, 3);
});

test("older saves with unlocked foods start with a few portions each", () => {
  const saved = { pet: { type: "cat", name: "A", hatched: true }, unlocked: { hats: ["none"], foods: ["apple", "cookie", "cake"], toys: ["ball"] } };
  const s = L.mergeState(saved, NOW);
  assert.equal(s.pantry.cake, 3);
  assert.equal(s.pantry.cookie, 3);
  assert.equal(s.pantry.apple, undefined);
});

test("mergeState ignores prototype-polluting keys from a hostile save", () => {
  const raw = '{"__proto__":{"polluted":1},"settings":{"__proto__":{"polluted2":1},"constructor":{"x":1}}}';
  const s = L.mergeState(JSON.parse(raw), NOW);
  assert.equal(vm.runInContext("({}).polluted", ctx), undefined);
  assert.equal(vm.runInContext("({}).polluted2", ctx), undefined);
  assert.equal(s.settings.sound, true);
});

test("mergeState clamps the saved volume to 0-100", () => {
  assert.equal(L.mergeState({ settings: { volume: 900 } }, NOW).settings.volume, 100);
  assert.equal(L.mergeState({ settings: { volume: -5 } }, NOW).settings.volume, 0);
  assert.equal(L.mergeState({ settings: { volume: "--evil" } }, NOW).settings.volume, 0);
  assert.equal(L.mergeState({ settings: { volume: 40 } }, NOW).settings.volume, 40);
});
