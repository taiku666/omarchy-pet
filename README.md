# Omarchy Pet

A tiny pixel-art Tamagotchi that lives on your [Omarchy](https://omarchy.org/) bar.
It wanders along the bar, naps, hops and looks around on its own. Click it to open
a care card: feed it, play, stroke it, put it to bed, clean up after it, and watch
it grow. Everything is painted in your current Omarchy theme and repaints when you
switch themes.

<div align="center">
    <img src="preview.png" alt="The pet on the bar and its care card" width="360">
</div>

## Install

```sh
omarchy plugin add https://github.com/taiku666/omarchy-pet.git --enable
```

The first time, the care card opens so you can pick a pet and name it. Tap the egg
five times to hatch it.

Update with `omarchy plugin update io.github.taiku666.omarchy-pet && omarchy restart shell`.
Remove with `omarchy plugin remove io.github.taiku666.omarchy-pet`.

Sound uses `pw-play` (PipeWire), which Omarchy ships.

## The pets

| Pet | Personality |
|---|---|
| 🐱 Cat | Aloof, then clingy. Purrs when stroked, flicks its tail, kneads. Loves fish. |
| 🐶 Dog | Loyal and loud. Barks, runs, wags. Needs lots of attention. Loves bones. |
| 🐰 Bunny | Shy hopper. Nibbles, twitches, does a binky. Loves carrots. |
| 🐸 Frog | Chill and swampy. Snaps at flies, croaks. Gets dirty fast. |
| 🐼 Panda | Lazy foodie. Munches bamboo, rolls over. Always hungry. |
| 🦊 Fox | Clever and playful. Pounces, zooms, tilts its head. |
| 🐉 Baby Dragon | Tiny and fiery. Puffs fire, flaps its wings. Loves peppers. |
| 🐧 Penguin | Social waddler. Slides on its belly. Stays clean. |

Each pet has its own look, idle behaviours, stroke reaction, voice, favourite food,
and four growth stages (the adult form wears something extra).

## Using it

| Action | Result |
|---|---|
| Click the pet on the bar | Open / close the care card |
| Drag across the pet | Stroke it: hearts, affection, a pet-specific happy face |
| Feed | Pick a food; favourites make it extra happy |
| Play | 15 second mini-games: catch the ball, pop bubbles, chase the laser dot |
| Pet | Stroke mode: strokes count double |
| Sleep / Wake | A nap restores energy; sleeping pets can't be fed or played with |
| Clean | Wash the home, or click a single mess to remove it |
| Shop | Spend coins on hats, rooms, food and toys |
| ⚙ | Sound, volume, rename, goals, reset |

While the card is open the pet stays inside it, in its room. Close the card and it
walks back onto the bar.

### Needs

Hunger, happiness, energy, cleanliness and affection change gradually. A neglected
pet gets hungry, tired or sad, shown by its face and a small thought bubble, but
needs never fall to zero and a happy pet is always one cuddle away. Time you spend
away counts at a gentler rate, so coming back after a weekend is a hello rather than
a rescue.

### Progression

- XP for every kind of care, levels, and four growth stages per pet
- Coins from mini-games, a daily care streak and found coins
- Hats, rooms, foods and toys to unlock, plus goals with coin rewards
- State is saved in `~/.local/share/omarchy-pet/state.json`

## Keybinding

Toggle the care card from Hyprland:

```lua
-- ~/.config/hypr/bindings.lua
o.bind("SUPER + ALT + P", "Pet", "omarchy-shell pet toggle")
```

The IPC target is `pet`, with `toggle`, `show` and `hide` (`hide` removes the pet
from the bar until you `show` it again).

## Notes

- Works with a horizontal bar (top or bottom). With a vertical bar the pet is not
  drawn on it.
- Colours come from the active theme's `colors.toml` and the shell's popup colours,
  so there is nothing to configure.

## Development

```sh
node --test test/                 # rules, sprites, animation tables
python3 tools/make-sfx.py         # regenerate assets/sfx
node tools/preview.mjs out.svg    # contact sheet of the sprites
```

`Logic.js` holds the rules and is pure, `Sprites.js` the pixel art, `Anim.js` the
behaviours, `Scenes.js` the rooms, `Theme.qml` the colours.

## License

MIT
