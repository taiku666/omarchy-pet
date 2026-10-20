// Dumps every pet sprite as one SVG sheet (open it in a browser) to eyeball the art.
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
const ctx = vm.createContext({});
vm.runInContext(readFileSync(new URL("../Sprites.js", import.meta.url), "utf8"), ctx);
vm.runInContext(readFileSync(new URL("../Logic.js", import.meta.url), "utf8"), ctx);
const S = 10; let out = "";
ctx.PET_ORDER.forEach((id, i) => {
  const ox = i * 230 + 10;
  for (const r of ctx.runsFor(id)) out += `<rect x="${ox + r.x * S}" y="${10 + r.y * S}" width="${r.w * S}" height="${S}" fill="${ctx.PALETTES[id][r.c]}"/>`;
  const f = ctx.FACES[id];
  for (const [x, y] of [f.eyes, f.eyeR]) out += `<rect x="${ox + x * S}" y="${10 + y * S}" width="${2 * S}" height="${2 * S}" fill="#2b2433"/>`;
});
writeFileSync(process.argv[2] || "sprites.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="1860" height="200" style="background:#cfe8ff">${out}</svg>`);
