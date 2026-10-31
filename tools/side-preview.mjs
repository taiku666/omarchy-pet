// Renders the side-view pets: standing plus four phases of their walk.
//   node tools/side-preview.mjs side.svg && rsvg-convert -z 1 side.svg -o side.png
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
const root = new URL("../", import.meta.url);
const ctx = vm.createContext({});
for (const f of ["Sprites.js", "Logic.js", "SideSprites.js"]) vm.runInContext(readFileSync(new URL(f, root), "utf8"), ctx);

function recorder() {
  const stack = []; let tx = 0, ty = 0, out = "";
  const c = { fillStyle: "#000",
    save() { stack.push([tx, ty]); }, restore() { [tx, ty] = stack.pop(); }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, w, h) { out += `<rect x="${(tx + x).toFixed(2)}" y="${(ty + y).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${c.fillStyle}"/>`; } };
  c.svg = () => out; c.origin = (x, y) => { tx = x; ty = y; };
  return c;
}
const S = 7, CW = 34 * S, CH = 18 * S + 30;
const cols = [0, 0.125, 0.375, 0.625, 0.875];
let body = "";
ctx.SIDE_PETS.forEach((id, row) => {
  cols.forEach((ph, col) => {
    const c = recorder(); c.origin(col * CW + CW / 2 + 5 * S, row * CH + 18 * S + 6);
    ctx.drawSidePet(c, { lib: ctx, pal: ctx.PALETTES[id], type: id, S, gait: ph, gaitAmt: col === 0 ? 0 : 1, tailPhase: ph * 6.28, tailAmp: 8, lookX: 1, blush: 0.5, stage: col === 4 ? 3 : 1, wing: Math.sin(ph * 6.28), hat: ["none", "party", "glasses", "phones", "crown"][col] });
    body += c.svg();
  });
});
writeFileSync(process.argv[2] || "side.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="${CW * cols.length}" height="${CH * ctx.SIDE_PETS.length}"><rect width="100%" height="100%" fill="#cfe8ff"/>${body}</svg>`);
