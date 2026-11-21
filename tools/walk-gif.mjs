// Renders every pet's walk cycle as one looping GIF, for the README.
//   node tools/walk-gif.mjs assets/walk.gif [theme]
// Needs rsvg-convert and ImageMagick (magick). Each pet walks in place while
// the ground scrolls under it at its stride length, so the loop is seamless.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const ctx = vm.createContext({});
for (const f of ["Sprites.js", "Logic.js", "Palette.js", "SideSprites.js"]) vm.runInContext(readFileSync(new URL(f, root), "utf8"), ctx);

const out = process.argv[2] || "walk.gif";
const theme = process.argv[3] || "tokyo-night";
const hues = {};
for (const dir of [`${process.env.HOME}/.config/omarchy/themes`, "/usr/share/omarchy/themes"]) {
  try {
    for (const line of readFileSync(`${dir}/${theme}/colors.toml`, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*["']?(#[0-9A-Fa-f]{6})/);
      if (m) hues[m[1].toLowerCase()] = m[2].toLowerCase();
    }
    break;
  } catch {}
}
if (!hues.background) throw new Error(`theme not found: ${theme}`);
const env = { bg: hues.background, text: hues.foreground, accent: hues.accent, urgent: hues.red, hues };

// Just enough of a canvas for the sprite files: fills, save/restore, translate.
function recorder() {
  const stack = []; let tx = 0, ty = 0, out = "";
  const c = {
    fillStyle: "#000",
    save() { stack.push([tx, ty]); }, restore() { [tx, ty] = stack.pop(); }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, w, h) { out += `<rect x="${(tx + x).toFixed(2)}" y="${(ty + y).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${c.fillStyle}"/>`; },
  };
  c.svg = () => out; c.origin = (x, y) => { tx = x; ty = y; };
  return c;
}

const S = 5, COLS = 4, CW = 36 * S, CH = 24 * S, FRAMES = 16;
const pets = ctx.PET_ORDER;
const rows = Math.ceil(pets.length / COLS);
const W = COLS * CW, H = rows * CH;
const dir = mkdtempSync(join(tmpdir(), "pet-walk-"));
const pngs = [];
try {
  for (let f = 0; f < FRAMES; f++) {
    const ph = f / FRAMES;
    let body = `<rect width="${W}" height="${H}" fill="${hues.background}"/>`;
    pets.forEach((id, i) => {
      const cx = (i % COLS) * CW + CW / 2, gy = Math.floor(i / COLS) * CH + CH - 3 * S;
      const kind = ctx.SIDE[id].gait;
      // Pebbles scroll back by one stride per cycle.
      const stride = ctx.strideLength(kind, S);
      for (let k = -2; k < 6; k++) {
        const x = cx - CW / 2 + (((k * 23 * S) / 3 - ph * stride) % CW + CW) % CW;
        body += `<rect x="${x.toFixed(1)}" y="${gy + S}" width="${S}" height="${S}" fill="${hues.foreground}" opacity="0.25"/>`;
      }
      body += `<rect x="${cx - CW / 2 + 2 * S}" y="${gy}" width="${CW - 4 * S}" height="1" fill="${hues.foreground}" opacity="0.15"/>`;
      const g = recorder();
      g.origin(cx + 3 * S, gy);
      ctx.drawSidePet(g, {
        lib: ctx, pal: ctx.petPalette(id, env), type: id, S, stage: 2,
        gait: ph, gaitAmt: 1, eyes: "open", lookX: 1, mouth: "smile", blush: 0.4,
        tailPhase: ph * Math.PI * 4, tailAmp: 9, wing: Math.sin(ph * Math.PI * 4), hat: "none",
      });
      body += g.svg();
    });
    const svg = join(dir, `f${f}.svg`), png = join(dir, `f${String(f).padStart(2, "0")}.png`);
    writeFileSync(svg, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" shape-rendering="crispEdges">${body}</svg>`);
    execFileSync("rsvg-convert", [svg, "-o", png]);
    pngs.push(png);
  }
  execFileSync("magick", ["-delay", "7", "-loop", "0", ...pngs, "-layers", "Optimize", out]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`wrote ${out} (${W}x${H}, ${FRAMES} frames)`);
