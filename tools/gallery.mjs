// Renders every pet in a few Omarchy themes as one image, for the README.
//   node tools/gallery.mjs gallery.svg [theme ...]
// then e.g.  rsvg-convert -z 1 gallery.svg -o assets/gallery.png
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const ctx = vm.createContext({});
for (const f of ["Sprites.js", "Logic.js", "Palette.js"]) vm.runInContext(readFileSync(new URL(f, root), "utf8"), ctx);

const THEMES = process.argv.length > 3 ? process.argv.slice(3) : ["osaka-jade", "tokyo-night", "gruvbox", "catppuccin-latte"];
const THEME_DIRS = [`${process.env.HOME}/.config/omarchy/themes`, "/usr/share/omarchy/themes"];

function loadTheme(name) {
  for (const dir of THEME_DIRS) {
    try {
      const hues = {};
      for (const line of readFileSync(`${dir}/${name}/colors.toml`, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*["']?(#[0-9A-Fa-f]{6})/);
        if (m) hues[m[1].toLowerCase()] = m[2].toLowerCase();
      }
      return hues;
    } catch {}
  }
  throw new Error(`theme not found: ${name}`);
}

// Just enough of a canvas for Sprites.js: fills, save/restore, translate.
function recorder() {
  const stack = []; let tx = 0, ty = 0, out = "";
  const c = {
    fillStyle: "#000",
    save() { stack.push([tx, ty]); },
    restore() { [tx, ty] = stack.pop(); },
    translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, w, h) { out += `<rect x="${(tx + x).toFixed(2)}" y="${(ty + y).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${c.fillStyle}"/>`; },
  };
  c.svg = () => out;
  c.origin = (x, y) => { tx = x; ty = y; };
  return c;
}

const S = 5, CELL_W = 160, CELL_H = 124, LABEL = 22;
const order = ctx.PET_ORDER;
let body = "";
THEMES.forEach((name, row) => {
  const hues = loadTheme(name);
  const env = { bg: hues.background, text: hues.foreground, accent: hues.accent, urgent: hues.red, hues };
  const y0 = row * (CELL_H + LABEL);
  body += `<rect x="0" y="${y0}" width="${order.length * CELL_W}" height="${CELL_H + LABEL}" fill="${hues.background}"/>`;
  body += `<text x="12" y="${y0 + 16}" font-family="monospace" font-size="12" fill="${hues.foreground}" opacity="0.7">${name}</text>`;
  order.forEach((id, i) => {
    const g = recorder();
    g.origin(i * CELL_W + CELL_W / 2, y0 + LABEL + CELL_H - 10);
    g.fillStyle = "rgba(0,0,0,0.22)";
    ctx.drawPet(g, { type: id, S, stage: 3, pal: ctx.petPalette(id, env), eyes: "open", mouth: "smile", tailAmp: 0, wing: 0, blush: 0, hat: "none" });
    body += g.svg();
  });
});
writeFileSync(process.argv[2] || "gallery.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="${order.length * CELL_W}" height="${THEMES.length * (CELL_H + LABEL)}">${body}</svg>`);
