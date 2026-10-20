// Game rules for the pet: stats, time, growth, items, milestones.
//
// Pure on purpose. Nothing here touches QML, files or the clock; callers pass
// `now` in. That keeps the whole care loop testable (test/logic.test.mjs) and
// lets the same code settle the time the user spent away.

var STAT_KEYS = ["hunger", "happiness", "energy", "cleanliness", "affection"]

// Never let a pet fall to zero: it can always be cheered up again, and coming
// back from a long weekend should be a warm hello, not a punishment.
var STAT_FLOOR = 8
var MAX_AWAY_MS = 24 * 3600 * 1000
var AWAY_RATE = 0.3
var MAX_MESSES = 4

// Per-minute change while awake. Personality multiplies these.
var DECAY = { hunger: 0.8, happiness: 0.45, energy: 0.4, cleanliness: 0.3, affection: 0.25 }
var SLEEP_ENERGY_PER_SEC = 3
var SLEEP_HUNGER_FACTOR = 0.3

var PETS = {
  cat: {
    label: "Cat", emoji: "🐱", blurb: "Aloof, then clingy. Purrs when stroked.",
    favorite: "fish", likes: "fish",
    decay: { hunger: 1.0, happiness: 0.9, energy: 1.3, cleanliness: 0.8, affection: 0.6 },
    stages: ["Kitten", "Young Cat", "Tabby", "Mystic Cat"],
    voice: "meow", greetings: ["mrrp?", "purr...", "*stretch*", "hmph.", "feed me. nicely."]
  },
  dog: {
    label: "Dog", emoji: "🐶", blurb: "Loyal and loud. Needs lots of attention.",
    favorite: "bone", likes: "bone",
    decay: { hunger: 1.2, happiness: 1.2, energy: 1.0, cleanliness: 1.1, affection: 1.3 },
    stages: ["Puppy", "Young Dog", "Good Boy", "Guardian Hound"],
    voice: "woof", greetings: ["woof!", "play?? play??", "best day!", "who's a good pet? me!", "ball?"]
  },
  bunny: {
    label: "Bunny", emoji: "🐰", blurb: "Shy hopper. Loves a carrot.",
    favorite: "carrot", likes: "carrot",
    decay: { hunger: 1.0, happiness: 1.0, energy: 0.9, cleanliness: 0.9, affection: 1.0 },
    stages: ["Kit", "Young Bunny", "Hopper", "Moon Rabbit"],
    voice: "squeak", greetings: ["*nose twitch*", "hop hop!", "carrot?", "*binky!*", "so soft..."]
  },
  frog: {
    label: "Frog", emoji: "🐸", blurb: "Chill and swampy. Catches flies.",
    favorite: "fly", likes: "fly",
    decay: { hunger: 0.9, happiness: 0.8, energy: 0.8, cleanliness: 1.5, affection: 0.8 },
    stages: ["Tadpole", "Froglet", "Frog", "Prince Frog"],
    voice: "croak", greetings: ["ribbit.", "*croooak*", "so chill...", "fly spotted!", "puddle time."]
  },
  panda: {
    label: "Panda", emoji: "🐼", blurb: "Lazy foodie. Always snacking.",
    favorite: "bamboo", likes: "bamboo",
    decay: { hunger: 1.5, happiness: 0.8, energy: 1.4, cleanliness: 0.9, affection: 0.9 },
    stages: ["Cub", "Young Panda", "Panda", "Bamboo Sage"],
    voice: "hum", greetings: ["*munch*", "five more minutes...", "bamboo?", "*yawn*", "roll over!"]
  },
  fox: {
    label: "Fox", emoji: "🦊", blurb: "Clever and playful. Zoomies!",
    favorite: "berry", likes: "berry",
    decay: { hunger: 1.0, happiness: 1.2, energy: 1.1, cleanliness: 0.9, affection: 0.9 },
    stages: ["Kit", "Young Fox", "Red Fox", "Nine-Tail"],
    voice: "yip", greetings: ["*sniff sniff*", "pounce!", "what's that?", "zoom zoom!", "tricky, tricky."]
  },
  dragon: {
    label: "Baby Dragon", emoji: "🐉", blurb: "Tiny, fiery, full of energy.",
    favorite: "pepper", likes: "pepper",
    decay: { hunger: 1.3, happiness: 1.0, energy: 0.7, cleanliness: 1.0, affection: 1.0 },
    stages: ["Hatchling", "Wyrmling", "Drake", "Elder Dragon"],
    voice: "roar", greetings: ["rawr! (tiny)", "*puff*", "my hoard!", "so fierce!", "spicy?"]
  },
  penguin: {
    label: "Penguin", emoji: "🐧", blurb: "Social waddler. Loves a slide.",
    favorite: "shrimp", likes: "shrimp",
    decay: { hunger: 1.1, happiness: 1.0, energy: 1.0, cleanliness: 0.6, affection: 1.1 },
    stages: ["Chick", "Young Penguin", "Penguin", "Emperor"],
    voice: "honk", greetings: ["*waddle*", "honk!", "slide time!", "brrr... cozy!", "fish party?"]
  }
}
var PET_ORDER = ["cat", "dog", "bunny", "frog", "panda", "fox", "dragon", "penguin"]

// hunger, happiness are the gains; `mood` is a flavour tag for the reaction.
var FOODS = {
  apple:  { label: "Apple",  emoji: "🍎", hunger: 16, happiness: 3,  cost: 0 },
  cookie: { label: "Cookie", emoji: "🍪", hunger: 10, happiness: 9,  cost: 0 },
  cake:   { label: "Cake",   emoji: "🍰", hunger: 24, happiness: 14, cost: 40 },
  fish:   { label: "Fish",   emoji: "🐟", hunger: 20, happiness: 4,  cost: 0, favoriteOf: "cat" },
  bone:   { label: "Bone",   emoji: "🦴", hunger: 18, happiness: 4,  cost: 0, favoriteOf: "dog" },
  carrot: { label: "Carrot", emoji: "🥕", hunger: 18, happiness: 4,  cost: 0, favoriteOf: "bunny" },
  fly:    { label: "Fly",    emoji: "🪰", hunger: 14, happiness: 6,  cost: 0, favoriteOf: "frog" },
  bamboo: { label: "Bamboo", emoji: "🎋", hunger: 22, happiness: 3,  cost: 0, favoriteOf: "panda" },
  berry:  { label: "Berries", emoji: "🍓", hunger: 14, happiness: 7, cost: 0, favoriteOf: "fox" },
  pepper: { label: "Pepper", emoji: "🌶️", hunger: 16, happiness: 6, cost: 0, favoriteOf: "dragon" },
  shrimp: { label: "Shrimp", emoji: "🦐", hunger: 18, happiness: 5,  cost: 0, favoriteOf: "penguin" }
}
// Everything but the pet's own favourite can be bought for others too.
var FOOD_ORDER = ["apple", "cookie", "cake", "fish", "bone", "carrot", "fly", "bamboo", "berry", "pepper", "shrimp"]
var FOOD_PRICE = 20   // price of a non-favourite, non-starter food
var STARTER_FOODS = ["apple", "cookie"]

var HATS = {
  none:     { label: "No hat",      cost: 0,   level: 1 },
  bow:      { label: "Bow",         cost: 15,  level: 1 },
  party:    { label: "Party hat",   cost: 25,  level: 1 },
  flower:   { label: "Flower",      cost: 25,  level: 2 },
  glasses:  { label: "Sunglasses",  cost: 40,  level: 2 },
  phones:   { label: "Headphones",  cost: 55,  level: 3 },
  tophat:   { label: "Top hat",     cost: 70,  level: 4 },
  wizard:   { label: "Wizard hat",  cost: 90,  level: 5 },
  halo:     { label: "Halo",        cost: 110, level: 6 },
  crown:    { label: "Crown",       cost: 150, level: 8 }
}
var HAT_ORDER = ["none", "bow", "party", "flower", "glasses", "phones", "tophat", "wizard", "halo", "crown"]

var ROOMS = {
  meadow: { label: "Meadow",     cost: 0,   level: 1 },
  night:  { label: "Starry Night", cost: 35, level: 2 },
  beach:  { label: "Beach",      cost: 50,  level: 3 },
  snow:   { label: "Snowfield",  cost: 70,  level: 4 },
  sakura: { label: "Sakura",     cost: 90,  level: 5 },
  space:  { label: "Space",      cost: 140, level: 7 }
}
var ROOM_ORDER = ["meadow", "night", "beach", "snow", "sakura", "space"]

var TOYS = {
  ball:    { label: "Catch the Ball", emoji: "🎾", cost: 0,  level: 1, game: "ball" },
  bubbles: { label: "Pop Bubbles",    emoji: "🫧", cost: 30, level: 2, game: "bubbles" },
  laser:   { label: "Laser Chase",    emoji: "🔴", cost: 60, level: 3, game: "laser" }
}
var TOY_ORDER = ["ball", "bubbles", "laser"]

var MILESTONES = {
  firstMeal:  { label: "First meal",          reward: 5,  desc: "Feed your pet once" },
  pets50:     { label: "Cuddle bug",          reward: 15, desc: "Stroke your pet 50 times" },
  pets200:    { label: "Cuddle master",       reward: 40, desc: "Stroke your pet 200 times" },
  games10:    { label: "Playmate",            reward: 20, desc: "Play 10 games" },
  clean10:    { label: "Tidy home",           reward: 15, desc: "Clean up 10 times" },
  happy100:   { label: "Pure joy",            reward: 15, desc: "Reach 100 happiness" },
  love100:    { label: "Best friends",        reward: 25, desc: "Reach 100 affection" },
  level5:     { label: "Growing up",          reward: 30, desc: "Reach level 5" },
  level10:    { label: "All grown up",        reward: 60, desc: "Reach level 10" },
  streak3:    { label: "Three-day streak",    reward: 25, desc: "Care for your pet 3 days in a row" },
  streak7:    { label: "One week together",   reward: 70, desc: "Care for your pet 7 days in a row" }
}
var MILESTONE_ORDER = ["firstMeal", "pets50", "pets200", "games10", "clean10", "happy100", "love100", "level5", "level10", "streak3", "streak7"]

// ------------------------------------------------------------------ growth

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// XP needed to go from `level` to the next.
function xpForLevel(level) { return 40 + level * 25 }

// Stage 0 is the egg; it is spent on the hatching screen, not on a level.
function stageForLevel(level) {
  if (level >= 10) return 3
  if (level >= 6) return 2
  if (level >= 3) return 1
  return 0
}
function stageName(type, level) {
  var p = PETS[type]
  return p ? p.stages[stageForLevel(level)] : ""
}
// Body scale per growth stage; babies are small and round, adults full size.
var STAGE_SCALE = [0.62, 0.78, 0.92, 1.0]

function addXp(state, amount) {
  state.xp += amount
  var gained = 0
  while (state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level)
    state.level += 1
    gained += 1
    state.coins += 10 + state.level * 2
  }
  return gained
}

// ------------------------------------------------------------------- state

function defaultState(now) {
  return {
    v: 1,
    pet: null,                      // { type, name, hatched }
    stats: { hunger: 80, happiness: 80, energy: 90, cleanliness: 90, affection: 60 },
    sleeping: false,
    messes: 0,
    level: 1, xp: 0, coins: 20,
    counters: { feeds: 0, pets: 0, games: 0, cleans: 0, sleeps: 0 },
    unlocked: { hats: ["none"], rooms: ["meadow"], foods: STARTER_FOODS.slice(), toys: ["ball"] },
    equipped: { hat: "none", room: "meadow" },
    milestones: {},
    streak: { day: "", days: 0 },
    settings: { sound: true, volume: 60 },
    ui: { x: -1, y: -1, minimized: false },
    lastSeen: now,
    messClock: 0
  }
}

// Merge a saved state over the defaults so older saves survive new fields.
function mergeState(saved, now) {
  var base = defaultState(now)
  if (!saved || typeof saved !== "object") return base
  function merge(dst, src) {
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue
      if (src[k] !== null && typeof src[k] === "object" && !Array.isArray(src[k]) &&
          dst[k] !== null && typeof dst[k] === "object" && !Array.isArray(dst[k])) merge(dst[k], src[k])
      else dst[k] = src[k]
    }
  }
  merge(base, saved)
  if (base.pet && !PETS[base.pet.type]) base.pet = null
  STAT_KEYS.forEach(function (k) { base.stats[k] = clamp(Number(base.stats[k]) || 0, 0, 100) })
  base.level = Math.max(1, Math.floor(Number(base.level) || 1))
  base.coins = Math.max(0, Math.floor(Number(base.coins) || 0))
  if (typeof base.pet === "object" && base.pet) base.pet.name = cleanName(base.pet.name)
  return base
}

function cleanName(name) {
  var n = String(name === undefined || name === null ? "" : name).replace(/[\u0000-\u001f]/g, "").trim()
  return n.slice(0, 14)
}

// Advance the pet by `seconds` of real time. `awayFactor` slows decay while the
// user was away so a long absence leaves a sleepy, hungry pet, never a dead one.
function step(state, seconds, awayFactor) {
  if (!state.pet || !state.pet.hatched || seconds <= 0) return
  var p = PETS[state.pet.type]
  var f = (awayFactor === undefined ? 1 : awayFactor) * seconds / 60
  var s = state.stats
  var d = p.decay

  var hungerRate = DECAY.hunger * d.hunger * (state.sleeping ? SLEEP_HUNGER_FACTOR : 1)
  s.hunger -= hungerRate * f
  if (!state.sleeping) s.energy -= DECAY.energy * d.energy * f
  // A nap restores energy in real time; time away counts as a rest at the away rate.
  else s.energy += SLEEP_ENERGY_PER_SEC * seconds * (awayFactor === undefined ? 1 : awayFactor)

  s.cleanliness -= (DECAY.cleanliness * d.cleanliness + state.messes * 0.35) * f
  s.affection -= DECAY.affection * d.affection * f

  // Neglected needs drag happiness down faster.
  var low = 0
  if (s.hunger < 30) low++
  if (s.energy < 25) low++
  if (s.cleanliness < 30) low++
  if (s.affection < 25) low++
  s.happiness -= (DECAY.happiness * d.happiness + low * 0.35) * f

  // Messes arrive roughly every 25 awake minutes.
  if (!state.sleeping) {
    state.messClock += f
    while (state.messClock >= 25) {
      state.messClock -= 25
      if (state.messes < MAX_MESSES) state.messes += 1
    }
  }
  for (var i = 0; i < STAT_KEYS.length; i++) {
    var k = STAT_KEYS[i]
    s[k] = clamp(s[k], STAT_FLOOR, 100)
  }
  if (state.sleeping && s.energy >= 100) state.sleeping = false
}

// Settle the time since the last session. Returns whole minutes counted away.
function applyAway(state, now) {
  var gap = clamp(now - (state.lastSeen || now), 0, MAX_AWAY_MS)
  if (gap < 60 * 1000) return 0
  var wasSleeping = state.sleeping
  step(state, gap / 1000, AWAY_RATE)
  // Away time overrides the nap: the pet wakes up on its own.
  if (wasSleeping) state.sleeping = false
  state.messes = Math.min(state.messes, 2)
  return Math.round(gap / 60000)
}

function dayKey(now) {
  var d = new Date(now)
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()
}

// Returns an array of bonus events ({kind, ...}) for the caller to celebrate.
function touchStreak(state, now) {
  var today = dayKey(now)
  if (state.streak.day === today) return []
  var yesterday = dayKey(now - 24 * 3600 * 1000)
  state.streak.days = state.streak.day === yesterday ? state.streak.days + 1 : 1
  state.streak.day = today
  var bonus = Math.min(5 + state.streak.days * 2, 25)
  state.coins += bonus
  return [{ kind: "streak", days: state.streak.days, coins: bonus }]
}

// --------------------------------------------------------------- actions
// Each returns an `outcome` the UI turns into an animation, sound and toast.

function gain(state, key, amount) {
  state.stats[key] = clamp(state.stats[key] + amount, 0, 100)
}

function foodAvailable(state, id) {
  return state.unlocked.foods.indexOf(id) !== -1
}

function feed(state, foodId) {
  var food = FOODS[foodId]
  if (!food || !state.pet || state.sleeping) return null
  if (state.stats.hunger >= 98) return { kind: "full" }
  var fav = food.favoriteOf === state.pet.type
  gain(state, "hunger", food.hunger * (fav ? 1.25 : 1))
  gain(state, "happiness", food.happiness * (fav ? 2.5 : 1))
  state.counters.feeds += 1
  var xp = fav ? 6 : 4
  var levels = addXp(state, xp)
  return { kind: fav ? "loved" : "ate", food: foodId, xp: xp, levels: levels }
}

function pet(state, amount) {
  if (!state.pet || state.sleeping) return null
  var p = PETS[state.pet.type]
  gain(state, "affection", amount * (p.decay.affection > 1.1 ? 1.2 : 1))
  gain(state, "happiness", amount * 0.5)
  state.counters.pets += 1
  return { kind: "pet" }
}

// `score` is 0..N from the minigame; coins and happiness scale with it.
function playResult(state, game, score) {
  if (!state.pet) return null
  var coins = Math.min(Math.round(score * 1.5), 40)
  var joy = clamp(10 + score * 2, 10, 35)
  var tired = clamp(8 + score * 0.6, 8, 20)
  gain(state, "happiness", joy)
  gain(state, "energy", -tired)
  gain(state, "affection", 3)
  state.stats.energy = Math.max(state.stats.energy, STAT_FLOOR)
  state.coins += coins
  state.counters.games += 1
  var xp = 6 + Math.min(score, 12)
  var levels = addXp(state, xp)
  return { kind: "play", coins: coins, xp: xp, levels: levels, score: score }
}

function canPlay(state) {
  return !!state.pet && !state.sleeping && state.stats.energy > 15
}

function clean(state, count) {
  if (!state.pet) return null
  var removed = Math.min(count === undefined ? state.messes : count, state.messes)
  state.messes -= removed
  gain(state, "cleanliness", removed > 0 ? 18 + removed * 4 : 6)
  if (removed > 0) {
    gain(state, "happiness", 4)
    state.counters.cleans += 1
    addXp(state, 3)
  }
  return { kind: "clean", removed: removed }
}

function bathe(state) {
  // The sparkle wash button: always works, even with no mess to remove.
  var res = clean(state, state.messes)
  gain(state, "cleanliness", 30)
  if (res.removed === 0) { gain(state, "happiness", 2); state.counters.cleans += 1; addXp(state, 2) }
  return { kind: "clean", removed: res.removed }
}

function startSleep(state) {
  if (!state.pet || state.sleeping) return false
  state.sleeping = true
  state.counters.sleeps += 1
  return true
}
function wake(state) {
  if (!state.sleeping) return false
  state.sleeping = false
  return true
}

// -------------------------------------------------------------------- mood

// A single word for how the pet is doing, in priority order.
function mood(state) {
  var s = state.stats
  if (state.sleeping) return "sleeping"
  var avg = (s.hunger + s.happiness + s.energy + s.cleanliness + s.affection) / 5
  if (s.happiness < 25 || avg < 30) return "sad"
  if (s.hunger < 30) return "hungry"
  if (s.energy < 25) return "sleepy"
  if (s.happiness > 72 && s.energy > 50) return "playful"
  return "happy"
}

// ------------------------------------------------------------------- shop

function hatAvailable(state, id) { return state.unlocked.hats.indexOf(id) !== -1 }
function roomAvailable(state, id) { return state.unlocked.rooms.indexOf(id) !== -1 }
function toyAvailable(state, id) { return state.unlocked.toys.indexOf(id) !== -1 }

function foodPrice(state, id) {
  var f = FOODS[id]
  if (!f) return 0
  if (f.cost > 0) return f.cost
  return STARTER_FOODS.indexOf(id) !== -1 || f.favoriteOf === (state.pet && state.pet.type) ? 0 : FOOD_PRICE
}

// Returns "ok", "coins", "level", "owned" or "unknown".
function buy(state, kind, id) {
  var table = { hats: HATS, rooms: ROOMS, toys: TOYS }[kind]
  var item = kind === "foods" ? FOODS[id] : table && table[id]
  if (!item) return "unknown"
  if (state.unlocked[kind].indexOf(id) !== -1) return "owned"
  var cost = kind === "foods" ? foodPrice(state, id) : item.cost
  if (kind !== "foods" && state.level < item.level) return "level"
  if (state.coins < cost) return "coins"
  state.coins -= cost
  state.unlocked[kind].push(id)
  return "ok"
}

// Starter favourite and free items become available the moment the pet exists.
function unlockStarters(state) {
  if (!state.pet) return
  FOOD_ORDER.forEach(function (id) {
    if (foodPrice(state, id) === 0 && state.unlocked.foods.indexOf(id) === -1) state.unlocked.foods.push(id)
  })
}

// -------------------------------------------------------------- milestones

function milestoneMet(state, id) {
  var s = state.stats, c = state.counters
  switch (id) {
    case "firstMeal": return c.feeds >= 1
    case "pets50": return c.pets >= 50
    case "pets200": return c.pets >= 200
    case "games10": return c.games >= 10
    case "clean10": return c.cleans >= 10
    case "happy100": return s.happiness >= 99.5
    case "love100": return s.affection >= 99.5
    case "level5": return state.level >= 5
    case "level10": return state.level >= 10
    case "streak3": return state.streak.days >= 3
    case "streak7": return state.streak.days >= 7
  }
  return false
}

// Awards any newly met milestones; returns their ids.
function checkMilestones(state) {
  var won = []
  MILESTONE_ORDER.forEach(function (id) {
    if (state.milestones[id] || !milestoneMet(state, id)) return
    state.milestones[id] = true
    state.coins += MILESTONES[id].reward
    won.push(id)
  })
  return won
}
