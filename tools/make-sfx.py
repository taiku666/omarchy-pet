#!/usr/bin/env python3
"""Synthesises the little sound effects in assets/sfx. Run once; the WAVs are committed."""
import math, os, random, struct, wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sfx")
os.makedirs(OUT, exist_ok=True)
random.seed(4)


def osc(kind, phase):
    p = phase % 1.0
    if kind == "sine":
        return math.sin(2 * math.pi * p)
    if kind == "square":
        return 1.0 if p < 0.5 else -1.0
    if kind == "tri":
        return 4 * abs(p - 0.5) - 1
    if kind == "saw":
        return 2 * p - 1
    if kind == "noise":
        return random.uniform(-1, 1)
    return 0.0


def tone(freqs, dur, kind="square", vol=0.35, attack=0.005, release=0.6, vibrato=0.0):
    """freqs: one Hz, a (start, end) glide, or a list of Hz for an arpeggio."""
    if isinstance(freqs, (int, float)):
        freqs = [freqs]
    n = int(RATE * dur)
    out, phase = [], 0.0
    for i in range(n):
        t = i / n
        if isinstance(freqs, tuple):
            f = freqs[0] + (freqs[1] - freqs[0]) * t
        else:
            f = freqs[min(len(freqs) - 1, int(t * len(freqs)))]
        f *= 1 + vibrato * math.sin(i / RATE * 40)
        phase += f / RATE
        env = min(1.0, i / (RATE * attack + 1)) * (1 - t) ** release if release else 1
        out.append(osc(kind, phase) * vol * env)
    return out


def cat(*parts):
    r = []
    for p in parts:
        r += p
    return r


def silence(d):
    return [0.0] * int(RATE * d)


def mix(a, b):
    n = max(len(a), len(b))
    return [(a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0) for i in range(n)]


def save(name, samples):
    peak = max(0.001, max(abs(s) for s in samples))
    scale = min(1.0, 0.9 / peak)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * scale)) * 32000)) for s in samples))


# interface
save("click", tone((900, 1300), 0.05, "square", 0.25))
save("coin", cat(tone(988, 0.07, "square", 0.3), tone(1319, 0.18, "square", 0.3)))
save("pop", cat(tone((1200, 300), 0.09, "sine", 0.5, release=1.2)))
save("nope", cat(tone(220, 0.09, "square", 0.3), tone(165, 0.14, "square", 0.3)))
save("level", cat(*[tone(f, 0.11, "square", 0.3) for f in (523, 659, 784, 1047)], tone(1047, 0.3, "square", 0.3)))
save("milestone", cat(tone(659, 0.1, "tri", 0.5), tone(880, 0.1, "tri", 0.5), tone(1175, 0.3, "tri", 0.5)))
save("hatch", cat(tone(300, 0.05, "square", 0.3), silence(0.05), tone(300, 0.05, "square", 0.3), silence(0.05),
                  tone([523, 659, 784, 1047, 1319], 0.5, "square", 0.3)))
save("eat", cat(*[cat(tone((500, 300), 0.06, "noise", 0.4, release=1), silence(0.05)) for _ in range(4)]))
save("clean", cat(*[tone((2500, 5000), 0.05, "noise", 0.25, release=0.5) for _ in range(8)]))
save("sleep", cat(tone([392, 330, 262], 0.9, "sine", 0.4, release=0.3, vibrato=0.01)))
save("purr", cat(*[tone(55 + (i % 2) * 5, 0.08, "saw", 0.5, release=0.2) for i in range(12)]))
save("heart", tone((700, 1500), 0.14, "sine", 0.35))
save("bounce", tone((400, 700), 0.08, "sine", 0.4))
save("splash", tone((3000, 800), 0.25, "noise", 0.3, release=1.5))

# one happy and one sad voice per pet, each with its own timbre
VOICES = {
    "meow":   dict(kind="tri",    happy=((600, 1000, 700), 0.35), sad=((700, 380), 0.45)),
    "woof":   dict(kind="square", happy=((300, 200), 0.1),        sad=((350, 180), 0.4)),
    "squeak": dict(kind="sine",   happy=((1400, 1900), 0.07),     sad=((1500, 900), 0.25)),
    "croak":  dict(kind="saw",    happy=((120, 90), 0.12),        sad=((140, 70), 0.35)),
    "hum":    dict(kind="sine",   happy=((220, 260, 240), 0.4),   sad=((260, 160), 0.5)),
    "yip":    dict(kind="square", happy=((900, 1500), 0.08),      sad=((900, 500), 0.35)),
    "roar":   dict(kind="saw",    happy=((200, 400, 150), 0.3),   sad=((250, 120), 0.4)),
    "honk":   dict(kind="square", happy=((520, 480), 0.14),       sad=((480, 240), 0.35)),
}
for name, v in VOICES.items():
    for mood in ("happy", "sad"):
        f, d = v[mood]
        if len(f) == 3:
            half = d / 2
            s = cat(tone((f[0], f[1]), half, v["kind"], 0.3, vibrato=0.02), tone((f[1], f[2]), half, v["kind"], 0.3, vibrato=0.02))
        else:
            s = tone(f, d, v["kind"], 0.3, vibrato=0.02)
        if name in ("woof", "squeak", "yip") and mood == "happy":
            s = cat(s, silence(0.04), s)
        save(f"{name}_{mood}", s)
print("wrote", len(os.listdir(OUT)), "sounds to", os.path.abspath(OUT))
