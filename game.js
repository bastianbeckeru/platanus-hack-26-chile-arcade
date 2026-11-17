// Runway — GENERATED from src/ by npm run build. Do not edit by hand.
"use strict";
(() => {
  // src/config.ts
  var CONFIG = {
    cols: 100,
    rows: 70,
    ha: 8,
    Ha: 40,
    // Always this many bikes: humans take the first slots, AI fills the rest.
    h: 4,
    lives: 3,
    // Cells per second for each funding round (Pre-seed, Seed, Serie A, Serie B).
    speeds: [13, 15, 17, 19],
    // Funding round length; speed steps up each round until Serie B.
    _a: 20,
    ua: 3,
    // Off the board after a crash, then a ghost (no trail, passes through trails).
    $a: 1,
    Ia: 1.5,
    ab: 12,
    bb: 80,
    Ja: 10,
    // START is ignored this long on the final screen so nobody skips it by accident.
    cb: 1.5,
    db: 2,
    // Boost (button 1, held): moves this many times faster and drains cash this many times faster.
    Ka: 1.6,
    eb: 3,
    // Attract mode: after this long idle on the title, an AI-only demo plays for at most demoSeconds.
    fb: 20,
    gb: 45,
    // Runway: cash drains per second on the board; a banana refills part of it.
    ia: 100,
    hb: 3.5,
    La: 30,
    ib: 3,
    jb: 2,
    kb: 4,
    // Each banana spawn may also drop an angel (one-use shield), at most this many at once.
    lb: 0.1,
    mb: 1,
    // A used shield leaves the bike a ghost this long, like after a respawn.
    nb: 1,
    // A head within this many cells (either axis) of a pickup takes it: the sprites are
    // 16-22 px wide on 8 px cells, so touching one visually means the next lane over.
    ob: 1,
    pb: 8,
    qb: 60,
    // AI: flood-fill cap per option and chance of a random turn among good options.
    rb: 300,
    sb: 0.05,
    // Below this cash the AI heads for the nearest banana when it is safe enough.
    tb: 60,
    // The AI boosts above this cash with at least this many free cells straight ahead.
    ub: 70,
    Ma: 20
  };

  // src/controls.ts
  var CABINET_KEYS = {
    P1_U: ["w"],
    P1_D: ["s"],
    P1_L: ["a"],
    P1_R: ["d"],
    P1_1: ["u"],
    P1_2: ["i"],
    P1_3: ["o"],
    P1_4: ["j"],
    P1_5: ["k"],
    P1_6: ["l"],
    P2_U: ["ArrowUp"],
    P2_D: ["ArrowDown"],
    P2_L: ["ArrowLeft"],
    P2_R: ["ArrowRight"],
    P2_1: ["r"],
    P2_2: ["t"],
    P2_3: ["y"],
    P2_4: ["f"],
    P2_5: ["g"],
    P2_6: ["h"],
    START1: ["Enter"],
    START2: ["2"]
  };
  var KEY_TO_ARCADE = {};
  for (const [code, keys] of Object.entries(CABINET_KEYS)) {
    for (const key of keys) KEY_TO_ARCADE[key.toLowerCase()] = code;
  }
  var JOYSTICK = {
    P1_U: [0, "U"],
    P1_D: [0, "D"],
    P1_L: [0, "L"],
    P1_R: [0, "R"],
    P2_U: [1, "U"],
    P2_D: [1, "D"],
    P2_L: [1, "L"],
    P2_R: [1, "R"]
  };
  var START = { START1: 0, P1_1: 0, START2: 1, P2_1: 1 };
  var PIVOT = { P1_2: 0, P2_2: 1 };
  var BOOST = ["P1_1", "P2_1"];
  function createControls() {
    const held = /* @__PURE__ */ new Set();
    let pressed = [];
    const codeOf = (e) => KEY_TO_ARCADE[e.key?.toLowerCase()];
    const onDown = (e) => {
      const code = codeOf(e);
      if (!code) return;
      if (!held.has(code)) pressed.push(code);
      held.add(code);
    };
    const onUp = (e) => {
      const code = codeOf(e);
      if (code) held.delete(code);
    };
    const onBlur = () => held.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return {
      poll() {
        const inputs = [
          { r: [], start: false },
          { r: [], start: false }
        ];
        for (const code of pressed) {
          const joy = JOYSTICK[code];
          if (joy) inputs[joy[0]].r.push(joy[1]);
          const p = START[code];
          if (p !== void 0) inputs[p].start = true;
          const v = PIVOT[code];
          if (v !== void 0) inputs[v].pivot = true;
        }
        BOOST.forEach((code, i) => inputs[i].boost = held.has(code));
        pressed = [];
        return inputs;
      },
      destroy() {
        window.removeEventListener("keydown", onDown);
        window.removeEventListener("keyup", onUp);
        window.removeEventListener("blur", onBlur);
      }
    };
  }

  // src/grid.ts
  var DIRS = ["U", "R", "D", "L"];
  var DELTA = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  var OPPOSITE = { U: "D", D: "U", L: "R", R: "L" };
  var LEFT_OF = { U: "L", L: "D", D: "R", R: "U" };
  var RIGHT_OF = { U: "R", R: "D", D: "L", L: "U" };
  function cellIndex(c, x, y) {
    return y * c.cols + x;
  }
  function inBounds(c, x, y) {
    return x >= 0 && y >= 0 && x < c.cols && y < c.rows;
  }
  function isFree(c, grid, x, y) {
    return inBounds(c, x, y) && grid[cellIndex(c, x, y)] === 0;
  }
  var seen = new Uint32Array(0);
  var stamp = 0;
  function reachable(c, grid, x, y, cap) {
    if (!isFree(c, grid, x, y)) return 0;
    if (seen.length !== grid.length) seen = new Uint32Array(grid.length);
    stamp++;
    const queue = [cellIndex(c, x, y)];
    seen[queue[0]] = stamp;
    for (let head = 0; head < queue.length && queue.length < cap; head++) {
      const cx = queue[head] % c.cols;
      const cy = (queue[head] - cx) / c.cols;
      for (const d of DIRS) {
        const nx = cx + DELTA[d][0];
        const ny = cy + DELTA[d][1];
        if (!isFree(c, grid, nx, ny)) continue;
        const i = cellIndex(c, nx, ny);
        if (seen[i] === stamp) continue;
        seen[i] = stamp;
        queue.push(i);
      }
    }
    return Math.min(queue.length, cap);
  }
  function freeRun(c, grid, x, y, dir, cap) {
    const [dx, dy] = DELTA[dir];
    let n = 0;
    while (n < cap && isFree(c, grid, x + dx * (n + 1), y + dy * (n + 1))) n++;
    return n;
  }
  function random(s) {
    let t = s.Na = s.Na + 1831565813 | 0;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function randomInt(s, n) {
    return Math.floor(random(s) * n);
  }

  // src/palette.ts
  function shade(color, f) {
    const ch = (shift) => {
      const v = color >> shift & 255;
      return Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)) << shift;
    };
    return ch(16) | ch(8) | ch(0);
  }
  var css = (color) => "#" + color.toString(16).padStart(6, "0");
  var WHITE = 16777215;
  var COLORS = {
    // Cool neutrals, darkest to lightest.
    ink: 329482,
    vb: 658964,
    line: 2042424,
    dim: 5991296,
    text: 16252888,
    danger: 16726843,
    // P1, P2, then AI bikes.
    h: [14810880, 16740039, 58879, 16747008],
    // Title only, after the cover: night sky and floor, violet horizon haze.
    night: 1448540,
    wb: 6959024,
    // One ramp for everything golden: banana, shield and halo.
    gold: { hi: 16774064, base: 16765503, mid: 13934870, low: 11039756, deep: 7031314 }
  };
  var BRAND = COLORS.h[2];
  var ACCENT = COLORS.h[1];
  var LOGO = shade(BRAND, 0.85);

  // src/pixel.ts
  var { gold: GOLD } = COLORS;
  function drawSprite(g, rows, palette, x, y, scale, alpha = 1) {
    x = Math.round(x);
    y = Math.round(y);
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; ) {
        const ch = row[rx];
        let end = rx + 1;
        while (row[end] === ch) end++;
        if (ch in palette) {
          g.fillStyle(palette[ch], alpha);
          g.fillRect(x + rx * scale, y + ry * scale, (end - rx) * scale, scale);
        }
        rx = end;
      }
    });
  }
  function spriteSize(rows, scale) {
    return [rows[0].length * scale, rows.length * scale];
  }
  var HEART = [".##.##.", "#w#####", "######d", ".####d.", "..##d..", "...#..."];
  var HEART_EMPTY = [".##.##.", "#..#..#", "#.....#", ".#...#.", "..#.#..", "...#..."];
  var SHIELD = ["#######", "#wwggg#", "#wgggd#", "#gggdd#", ".#ggd#.", "..#d#..", "...#..."];
  var SHIELD_COLORS = { "#": GOLD.low, g: GOLD.base, d: GOLD.mid, w: GOLD.hi };
  var BANANA = ["......b.", "......yo", ".....wyo", ".....yyo", "....wyo.", "..yyyo..", "byyoo...", ".oo....."];
  var BANANA_COLORS = { y: GOLD.base, o: GOLD.mid, b: GOLD.deep, w: GOLD.hi };
  var ANGEL = [
    "...ggggg...",
    "..g.....g..",
    "...ggggg...",
    ".....w.....",
    "ww..www..ww",
    "wwwwwwwwwww",
    ".wwwwwwwss.",
    "...s.s.s..."
  ];
  var CYCLE = ["...ccccccc..", ".ccdddddddc.", "cwwwwwwwwwwW", ".ccdddddddc.", "...ccccccc.."];
  function cycleSprites() {
    const down = [...CYCLE[0]].map((_, c) => CYCLE.map((row) => row[c]).join(""));
    return { R: CYCLE, L: CYCLE.map((r) => [...r].reverse().join("")), D: down, U: [...down].reverse() };
  }
  var ANGEL_COLORS = { g: GOLD.base, w: WHITE, s: shade(COLORS.dim, 0.55) };
  function addToRuns(runs, seg) {
    const last = runs[runs.length - 1];
    if (last && last[4] === seg[4]) {
      const [lx1, ly1, lx2, ly2] = sorted(last);
      const [x1, y1, x2, y2] = sorted(seg);
      const row = ly1 === ly2 && y1 === y2 && ly1 === y1 && x1 <= lx2 && lx1 <= x2;
      const col = lx1 === lx2 && x1 === x2 && lx1 === x1 && y1 <= ly2 && ly1 <= y2;
      if (row || col) {
        last.splice(0, 4, Math.min(lx1, x1), Math.min(ly1, y1), Math.max(lx2, x2), Math.max(ly2, y2));
        return;
      }
    }
    runs.push([...seg]);
  }
  function sorted(s) {
    return [Math.min(s[0], s[2]), Math.min(s[1], s[3]), Math.max(s[0], s[2]), Math.max(s[1], s[3])];
  }
  var LOGO_GLYPHS = {
    R: ["######.", "##...##", "##...##", "######.", "##.##..", "##..##.", "##...##"],
    U: ["##...##", "##...##", "##...##", "##...##", "##...##", "##...##", ".#####."],
    N: ["##...##", "###..##", "####.##", "##.####", "##..###", "##...##", "##...##"],
    W: ["##...##", "##...##", "##...##", "##.#.##", "##.#.##", "#######", ".##.##."],
    A: ["..###..", ".##.##.", "##...##", "##...##", "#######", "##...##", "##...##"],
    Y: ["##...##", "##...##", ".##.##.", "..###..", "..###..", "..###..", "..###.."]
  };
  function outlineRects(rows, x, y, scale, stroke, rect) {
    const on = (r, c) => rows[r]?.[c] === "#";
    rows.forEach(
      (row, r) => [...row].forEach((ch, c) => {
        if (ch !== "#") return;
        const [px, py] = [x + c * scale, y + r * scale];
        const far = scale - stroke;
        if (!on(r - 1, c)) rect(px, py, scale, stroke);
        if (!on(r + 1, c)) rect(px, py + far, scale, stroke);
        if (!on(r, c - 1)) rect(px, py, stroke, scale);
        if (!on(r, c + 1)) rect(px + far, py, stroke, scale);
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          if (on(r + dr, c) && on(r, c + dc) && !on(r + dr, c + dc))
            rect(px + (dc > 0 ? far : 0), py + (dr > 0 ? far : 0), stroke, stroke);
        }
      })
    );
  }
  function drawOutlined(g, rows, color, x, y, scale, stroke, fill) {
    g.fillStyle(color, fill);
    rows.forEach((row, r) => [...row].forEach((ch, c) => ch === "#" && g.fillRect(x + c * scale, y + r * scale, scale, scale)));
    g.fillStyle(color, 1);
    outlineRects(rows, x, y, scale, stroke, (rx, ry, w, h) => g.fillRect(rx, ry, w, h));
  }
  function bakeGlow(scene, key, w, h, color, blur, strength, paint) {
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    ctx.shadowColor = css(color);
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = w;
    ctx.translate(-w, 0);
    for (let i = 0; i < strength; i++) paint(ctx);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  function bakeOutlineGlow(scene, key, rows, scale, stroke, color, blur, strength) {
    const pad = blur * 2;
    const [w, h] = spriteSize(rows, scale);
    bakeGlow(
      scene,
      key,
      w + 2 * pad,
      h + 2 * pad,
      color,
      blur,
      strength,
      (ctx) => outlineRects(rows, pad, pad, scale, stroke, (x, y, rw, rh) => ctx.fillRect(x, y, rw, rh))
    );
  }
  function bakeBarGlow(scene, key, w, h, color, blur, strength) {
    const pad = blur * 2;
    bakeGlow(scene, key, w, h + 2 * pad, color, blur, strength, (ctx) => ctx.fillRect(-blur * 2, pad, w + blur * 4, h));
  }
  function bakeTextGlow(scene, key, text, size, color, blur, strength) {
    const s = size / CELL_H;
    const pad = blur * 2;
    const chars = [...text];
    const textW = chars.reduce((sum, ch) => sum + plotGlyph(ch, () => {
    }) + 1, 0) * s;
    bakeGlow(scene, key, textW + 2 * pad, size + 2 * pad, color, blur, strength, (ctx) => {
      let x = pad;
      for (const ch of chars) x += (plotGlyph(ch, (c, r) => ctx.fillRect(x + c * s, pad + r * s, s, s)) + 1) * s;
    });
  }
  function logoRows(word) {
    return Array.from({ length: 7 }, (_, r) => [...word].map((ch) => LOGO_GLYPHS[ch][r]).join("."));
  }
  var GLYPHS = {
    A: ".###./#...#/#####/#...#/#...#",
    B: "####./#...#/####./#...#/####.",
    C: ".####/#..../#..../#..../.####",
    D: "####./#...#/#...#/#...#/####.",
    E: "#####/#..../####./#..../#####",
    F: "#####/#..../####./#..../#....",
    G: ".####/#..../#..##/#...#/.####",
    H: "#...#/#...#/#####/#...#/#...#",
    I: "###/.#./.#./.#./###",
    J: "....#/....#/....#/#...#/.###.",
    K: "#...#/#..#./###../#..#./#...#",
    L: "#..../#..../#..../#..../#####",
    M: "#...#/##.##/#.#.#/#...#/#...#",
    N: "#...#/##..#/#.#.#/#..##/#...#",
    O: ".###./#...#/#...#/#...#/.###.",
    P: "####./#...#/####./#..../#....",
    Q: ".###./#...#/#...#/#..#./.##.#",
    R: "####./#...#/####./#..#./#...#",
    S: ".####/#..../.###./....#/####.",
    T: "#####/..#../..#../..#../..#..",
    U: "#...#/#...#/#...#/#...#/.###.",
    V: "#...#/#...#/#...#/.#.#./..#..",
    W: "#...#/#...#/#.#.#/##.##/#...#",
    X: "#...#/.#.#./..#../.#.#./#...#",
    Y: "#...#/.#.#./..#../..#../..#..",
    Z: "#####/...#./..#../.#.../#####",
    "0": ".###./#..##/#.#.#/##..#/.###.",
    "1": ".#./##./.#./.#./###",
    "2": "####./....#/.###./#..../#####",
    "3": "####./....#/.###./....#/####.",
    "4": "#...#/#...#/#####/....#/....#",
    "5": "#####/#..../####./....#/####.",
    "6": ".###./#..../####./#...#/.###.",
    "7": "#####/....#/...#./..#../..#..",
    "8": ".###./#...#/.###./#...#/.###.",
    "9": ".###./#...#/.####/....#/.###.",
    " ": "../../../../..",
    ".": "././././#",
    ",": "../../../../.#/#.",
    ":": "./#/./#/.",
    "!": "#/#/#/./#",
    "\xA1": "#/./#/#/#",
    "?": "####./....#/..##./...../..#..",
    "\xB7": "././#/./.",
    "-": ".../.../###/.../...",
    "+": ".../.#./###/.#./...",
    "/": "..#/..#/.#./#../#.."
  };
  var ACCENTS = { \u00C1: "A", \u00C9: "E", \u00CD: "I", \u00D3: "O", \u00DA: "U" };
  var CELL_W = 6;
  var CELL_H = 8;
  function plotGlyph(ch, plot) {
    const rows = GLYPHS[ACCENTS[ch] ?? ch].split("/");
    const w = rows[0].length;
    rows.forEach((row, r) => [...row].forEach((p, c) => p === "#" && plot(c, 2 + r)));
    if (ACCENTS[ch]) {
      plot(Math.floor(w / 2) + 1, 0);
      plot(Math.floor(w / 2), 1);
    }
    return w;
  }
  function createPixelFont(scene, key) {
    const chars = Object.keys(GLYPHS).join("") + Object.keys(ACCENTS).join("");
    const tex = scene.textures.createCanvas(key, chars.length * CELL_W, CELL_H);
    const ctx = tex.getContext();
    ctx.fillStyle = "white";
    const widths = [];
    [...chars].forEach((ch, i) => widths.push(plotGlyph(ch, (c, r) => ctx.fillRect(i * CELL_W + c, r, 1, 1))));
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const entry = Phaser.GameObjects.RetroFont.Parse(scene, {
      image: key,
      width: CELL_W,
      height: CELL_H,
      chars,
      charsPerRow: chars.length,
      "offset.x": 0,
      "offset.y": 0,
      "spacing.x": 0,
      "spacing.y": 0,
      lineSpacing: 2
    });
    const texW = chars.length * CELL_W;
    [...chars].forEach((ch, i) => {
      Object.assign(entry.data.chars[ch.charCodeAt(0)], {
        width: widths[i],
        xAdvance: widths[i] + 1,
        u1: (i * CELL_W + widths[i]) / texW
      });
    });
    entry.data.size = CELL_H;
    scene.cache.bitmapFont.add(key, entry);
  }

  // src/sfx.ts
  var FX = {
    // Turn: a tight electric snap, a falling zap with a bright tick on top.
    turn: [
      { wave: "sawtooth", from: 1300, to: 420, a: 0.07, e: 0.045, j: 5e3, k: 1200 },
      { wave: "sine", from: 2800, to: 2e3, a: 0.05, e: 0.025 },
      { wave: "noise", from: 7e3, to: 4e3, a: 0.03, e: 0.08, m: "highpass" }
    ],
    // Countdown number: impact, a hard square beep, a metal clank and a low brass stab, harder each
    // number (kvol, kcut: added per step towards GO).
    count: [
      { wave: "sine", from: 130, to: 32, a: 0.7, e: 0.4, ma: 0.1 },
      { wave: "triangle", from: 75, to: 30, a: 0.98, e: 0.16, ma: 0.04 },
      { wave: "noise", from: 900, to: 60, a: 0.42, e: 0.2, ma: 0.05, m: "lowpass" },
      { wave: "square", from: 587.33, a: 0.38, e: 0.08, j: 6e3, echo: true },
      { wave: "sine", from: 1174.659, a: 0.22, e: 0.04 },
      { wave: "square", from: 2400, to: 1100, a: 0.05, e: 0.03 },
      { wave: "noise", from: 3500, to: 2500, a: 0.12, e: 0.14 },
      { wave: "sawtooth", notes: [73.416, 146.832], a: 0.6, e: 0.03, ma: 8e-3, j: 1400, xb: 700, k: 150, detune: 14, echo: true }
    ],
    // Under the countdown, from the first number: a swell that lands on GO (dur = the countdown).
    yb: [
      { wave: "sawtooth", from: 73.416, to: 293.665, a: 3, e: 0.05, j: 200, k: 5e3, detune: 20, ja: true },
      { wave: "sawtooth", from: 110, to: 440, a: 3, e: 0.03, j: 200, k: 5e3, detune: 20, ja: true }
    ],
    // GO: the beep an octave up, a major brass hit, a crash and a sparkle.
    go: [
      { wave: "sine", from: 130, to: 32, a: 1.1, e: 0.85 },
      { wave: "triangle", from: 75, to: 30, a: 1.54, e: 0.34 },
      { wave: "noise", from: 900, to: 60, a: 0.66, e: 0.425, m: "lowpass" },
      { wave: "noise", from: 9e3, to: 3500, a: 1.8, e: 0.2, m: "highpass" },
      { wave: "noise", from: 600, to: 8e3, a: 0.5, e: 0.12 },
      { wave: "square", from: 1174.659, a: 0.9, e: 0.08, j: 7e3, echo: true },
      { wave: "square", from: 880, a: 0.9, e: 0.04, j: 5e3 },
      { wave: "sawtooth", notes: [73.416, 146.832, 184.997, 220, 293.665], a: 1.3, e: 0.04, j: 6e3, k: 400, detune: 14, echo: true },
      { wave: "sine", notes: [1174.659, 1479.978, 1760, 2349.318], gap: 0.05, a: 0.25, e: 0.05, at: 0.1, echo: true }
    ],
    // Boost: a rising whoosh.
    boost: [
      { wave: "noise", from: 400, to: 4e3, a: 0.3, e: 0.5 }
    ],
    // Banana pickup: two bright pings.
    va: [
      { wave: "sine", from: 1568, a: 0.15, e: 0.1, echo: true },
      { wave: "sine", from: 2349, a: 0.22, e: 0.08, at: 0.06, echo: true }
    ],
    // Angel pickup: a rising sparkle.
    wa: [
      { wave: "triangle", notes: [784, 1175, 1568, 2349, 3136], gap: 0.05, a: 0.2, e: 0.08, echo: true }
    ],
    // Shield: a glassy ping with a buzz and a spark.
    $: [
      { wave: "sine", from: 1700, a: 0.45, e: 0.08, echo: true },
      { wave: "square", from: 2600, to: 2300, a: 0.3, e: 0.025, j: 6e3 },
      { wave: "noise", from: 3e3, to: 6e3, a: 0.08, e: 0.2 }
    ],
    // Pivot: a falling saw zap.
    pivot: [
      { wave: "sawtooth", from: 1400, to: 180, a: 0.14, e: 0.14, j: 3500, echo: true }
    ],
    // Derezz: a hard crack, a crunching smash, a metal clang, debris rattling down (random pitch
    // and timing: spread, jit) and a low dying drone under the impact.
    xa: [
      { wave: "noise", from: 5e3, to: 1500, a: 0.09, e: 0.7, m: "highpass" },
      { wave: "noise", from: 4e3, to: 200, a: 0.35, e: 0.6, m: "lowpass" },
      { wave: "sine", from: 130, to: 32, a: 0.9, e: 0.8 },
      { wave: "triangle", from: 75, to: 30, a: 1.26, e: 0.32 },
      { wave: "noise", from: 900, to: 60, a: 0.54, e: 0.4, m: "lowpass" },
      { wave: "square", from: 347, to: 319.24, a: 0.35, e: 0.035, j: 3500, k: 600 },
      { wave: "square", from: 521, to: 479.32, a: 0.3, e: 0.035, j: 3500, k: 600 },
      { wave: "square", from: 788, to: 724.96, a: 0.25, e: 0.035, j: 3500, k: 600 },
      { wave: "square", from: 1163, to: 1069.96, a: 0.2, e: 0.035, j: 3500, k: 600 },
      { wave: "noise", from: 1200, to: 840, n: 9, every: 0.05, a: 0.04, e: 0.22, ya: -0.02, at: 0.06, Oa: 0.04, spread: 4e3 },
      { wave: "sawtooth", from: 140, to: 24, a: 0.8, e: 0.12, j: 1e3, k: 80, detune: 30 }
    ],
    // Respawn (rezz in): a filtered saw rising out of the floor.
    na: [
      { wave: "sawtooth", from: 110, to: 1760, a: 0.45, e: 0.05, j: 400, k: 8e3, echo: true },
      { wave: "sine", from: 1760, a: 0.2, e: 0.06, at: 0.4, echo: true }
    ],
    // A player joins: the respawn sound, then two pings.
    join: [
      { wave: "sine", notes: [880, 1320], gap: 0.1, a: 0.15, e: 0.08, at: 0.5, echo: true }
    ],
    // New round: a whoosh into a falling saw chord.
    round: [
      { wave: "noise", from: 400, to: 8e3, a: 0.5, e: 0.12 },
      { wave: "sawtooth", notes: [220, 262, 330, 440], a: 0.6, e: 0.05, at: 0.45, j: 4e3, k: 300, detune: 12, echo: true }
    ],
    // Victory: a snare roll into a triplet brass fanfare, a big major chord and a sparkle.
    za: [
      { wave: "noise", from: 2600, to: 1400, n: 17, every: 0.045, a: 0.05, e: 0.03, ya: 72e-4 },
      { wave: "sawtooth", notes: [220, 293.665, 369.994], n: 3, every: 0.12, a: 0.11, e: 0.035, at: 0.8, j: 5e3, k: 1500, detune: 14, echo: true },
      { wave: "sine", from: 130, to: 32, a: 1.2, e: 0.8, at: 1.2 },
      { wave: "triangle", from: 75, to: 30, a: 1.68, e: 0.32, at: 1.2 },
      { wave: "noise", from: 900, to: 60, a: 0.72, e: 0.4, at: 1.2, m: "lowpass" },
      { wave: "noise", from: 9e3, to: 3500, a: 2.2, e: 0.18, at: 1.2, m: "highpass" },
      { wave: "sawtooth", notes: [73.416, 146.832, 293.665, 369.994, 440, 587.33], a: 2.2, e: 0.035, at: 1.2, j: 7e3, k: 600, detune: 14, echo: true },
      { wave: "triangle", notes: [587.33, 739.989, 880, 1174.659, 1479.978, 1760, 2349.318], gap: 0.06, a: 0.3, e: 0.06, at: 1.3, echo: true }
    ],
    // Game over: the grid powers down, three falling brass stabs (Bb, A, Gm) with drum hits, a
    // timpani roll and a final low D minor chord with a cannon boom and a tolling bell.
    lose: [
      { wave: "sawtooth", from: 880, to: 35, a: 1.3, e: 0.1, j: 4e3, k: 150, detune: 20 },
      { wave: "sine", from: 130, to: 32, a: 1.2, e: 0.7 },
      { wave: "triangle", from: 75, to: 30, a: 1.68, e: 0.28 },
      { wave: "noise", from: 900, to: 60, a: 0.72, e: 0.35, m: "lowpass" },
      { wave: "noise", from: 9e3, to: 3500, a: 1.4, e: 0.12, m: "highpass" },
      { wave: "sawtooth", notes: [233.082, 293.665, 349.228], a: 0.38, e: 0.035, at: 0.6, j: 3500, k: 300, detune: 14, echo: true },
      { wave: "sine", from: 130, to: 32, a: 0.5, e: 0.4, at: 0.6 },
      { wave: "triangle", from: 75, to: 30, a: 0.7, e: 0.16, at: 0.6 },
      { wave: "noise", from: 900, to: 60, a: 0.3, e: 0.2, at: 0.6, m: "lowpass" },
      { wave: "sawtooth", notes: [220, 277.183, 329.628], a: 0.38, e: 0.035, at: 1.02, j: 3500, k: 300, detune: 14, echo: true },
      { wave: "sine", from: 130, to: 32, a: 0.5, e: 0.4, at: 1.02 },
      { wave: "triangle", from: 75, to: 30, a: 0.7, e: 0.16, at: 1.02 },
      { wave: "noise", from: 900, to: 60, a: 0.3, e: 0.2, at: 1.02, m: "lowpass" },
      { wave: "sawtooth", notes: [195.998, 233.082, 293.665], a: 0.38, e: 0.035, at: 1.44, j: 3500, k: 300, detune: 14, echo: true },
      { wave: "sine", from: 130, to: 32, a: 0.5, e: 0.4, at: 1.44 },
      { wave: "triangle", from: 75, to: 30, a: 0.7, e: 0.16, at: 1.44 },
      { wave: "noise", from: 900, to: 60, a: 0.3, e: 0.2, at: 1.44, m: "lowpass" },
      { wave: "sine", from: 95, to: 60, n: 8, every: 0.045, a: 0.12, e: 0.12, ya: 0.03, at: 1.6 },
      { wave: "sine", from: 130, to: 32, a: 1.8, e: 0.95, at: 2 },
      { wave: "triangle", from: 75, to: 30, a: 2.52, e: 0.38, at: 2 },
      { wave: "noise", from: 900, to: 60, a: 1.08, e: 0.475, at: 2, m: "lowpass" },
      { wave: "noise", from: 9e3, to: 3500, a: 2.6, e: 0.14, at: 2, m: "highpass" },
      { wave: "sawtooth", notes: [36.708, 73.416, 146.832, 174.614, 220, 293.665], a: 3, e: 0.04, at: 2, j: 2500, k: 100, detune: 14, echo: true },
      { wave: "sine", from: 293.6648, a: 2.6, e: 0.06, at: 2, echo: true },
      { wave: "sine", from: 810.5148, a: 2, e: 0.03, at: 2, echo: true },
      { wave: "sine", from: 1585.7897, a: 1.4, e: 0.02, at: 2, echo: true }
    ]
  };
  var ENGINE = { base: 34, perCell: 2.6, perBike: 3, sub: -1207, q: 6, j: 420, boostCutoff: 1400, e: 0.03, boostVol: 0.05 };
  var SONG = {
    // Tonic as a MIDI note (38 = D2) and each bar's root in semitones over it, in a 4-bar loop.
    key: 38,
    roots: [0, 0, -4, -2],
    // Tempo: the title, then funding rounds 1-4.
    Aa: [136, 126, 132, 138, 146],
    // Acid line per sixteenth: semitones over the root an octave up (hex digit, '.' rests),
    // accents, and slides into the next note.
    zb: "00c0fc0ac0307c53",
    accent: "x...x...x..x..x.",
    slide: "..x....x...x..x.",
    // Hook bleeps, four bars, semitones over the tonic three octaves up; '.' rests.
    hook: [
      "c..c..c.f.e.c.a.",
      "c..c..c.a.8.7...",
      "a..a..a.c.a.8.7.",
      "7..7..7.a.c.e.f."
    ]
  };
  var HAT = [0.04, 0.02, 0.08, 0.025];
  var semis = (ch) => parseInt(ch, 16);
  var TITLE_STEPS = 256;
  var STEPS = 64;
  var LOOKAHEAD = 0.15;
  var TITLE_VOL = 0.33;
  var RUN_VOL = 0.13;
  var hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
  function createSfx(ctx, onStep) {
    let noise;
    let sfxBus;
    let musicBus;
    let echoIn;
    let grit;
    let pump;
    let kickBus;
    let verbIn;
    let rumbleIn;
    let dubIn;
    let dub;
    const engines = [];
    let level = -1;
    let step2 = 0;
    let next = 0;
    let len = 15 / SONG.Aa[0];
    let prevAcid = 0;
    if (ctx) {
      const gain = (v, to) => {
        const g = ctx.createGain();
        g.gain.value = v;
        if (to) g.connect(to);
        return g;
      };
      const shaper = (k) => {
        const w = ctx.createWaveShaper();
        w.curve = new Float32Array(1024).map((_, i) => Math.tanh(k * (i / 511.5 - 1)));
        return w;
      };
      const lowpass = (f, q = 1) => {
        const b = ctx.createBiquadFilter();
        b.frequency.value = f;
        b.Q.value = q;
        return b;
      };
      const reverb = (secs, decay) => {
        const conv = ctx.createConvolver();
        const b = ctx.createBuffer(2, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
          const d = b.getChannelData(c);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** decay;
        }
        conv.buffer = b;
        return conv;
      };
      const comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      const master = gain(0.8, comp);
      sfxBus = gain(1, master);
      musicBus = gain(TITLE_VOL, master);
      echoIn = gain(1);
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.19;
      echoIn.connect(delay).connect(gain(0.38)).connect(delay);
      delay.connect(gain(0.3, master));
      pump = gain(1, musicBus);
      grit = shaper(11);
      grit.connect(gain(0.26, pump));
      kickBus = shaper(1.6);
      kickBus.connect(gain(0.9, musicBus));
      verbIn = gain(1);
      verbIn.connect(reverb(2.6, 3)).connect(lowpass(6e3)).connect(gain(0.28, pump));
      rumbleIn = gain(1);
      rumbleIn.connect(reverb(1.4, 2)).connect(lowpass(120, 0.7)).connect(gain(0.5, pump));
      dubIn = gain(1);
      dub = ctx.createDelay(1);
      dub.delayTime.value = len * 3;
      const dark = lowpass(3200);
      dubIn.connect(dub).connect(dark).connect(gain(0.38)).connect(dub);
      dark.connect(gain(0.32, pump));
    }
    const ready = () => {
      if (!ctx) return false;
      if (ctx.state === "suspended") void ctx.resume();
      return true;
    };
    const panned = (node, pan) => {
      if (!pan) return node;
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      return node.connect(p);
    };
    const out = (g, v, t0, bus, atk) => {
      const end = t0 + v.a;
      const vol = v.e ?? 0.06;
      g.gain.setValueAtTime(1e-4, t0);
      g.gain.exponentialRampToValueAtTime(vol, v.ja ? end - 0.02 : t0 + (v.Ab ?? atk));
      if (v.ja) g.gain.linearRampToValueAtTime(1e-4, end);
      else g.gain.exponentialRampToValueAtTime(1e-4, end);
      const node = panned(g, v.pan);
      node.connect(bus);
      if (v.echo) node.connect(echoIn);
      for (const [send, amount] of [[dubIn, v.Pa], [verbIn, v.ka]]) {
        if (!amount) continue;
        const s = ctx.createGain();
        s.gain.value = amount;
        node.connect(s).connect(send);
      }
    };
    const filterFor = (v, t0, type = "lowpass") => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.Q.value = v.q ?? 1;
      f.frequency.setValueAtTime(v.j ?? 18e3, t0);
      if (v.k) f.frequency.exponentialRampToValueAtTime(v.k, t0 + (v.Bb ?? v.a));
      return f;
    };
    const play2 = (v, t0, bus) => {
      const c = ctx;
      const end = t0 + v.a;
      const filter = filterFor(v, t0);
      const g = c.createGain();
      filter.connect(g);
      out(g, v, t0, bus, 5e-3);
      const pair = v.detune ? [-v.detune, v.detune] : [0];
      pair.forEach((cents, k) => {
        const o = c.createOscillator();
        o.type = v.wave ?? "square";
        o.detune.value = cents;
        o.frequency.setValueAtTime(v.from, t0);
        if (v.to) o.frequency.exponentialRampToValueAtTime(v.to, t0 + (v.Qa ?? v.a));
        panned(o, v.wide && pair.length > 1 ? k ? 0.7 : -0.7 : 0).connect(filter);
        o.start(t0);
        o.stop(end + 0.02);
      });
    };
    const hiss = (v, t0, bus = pump) => {
      if (!ready()) return;
      const c = ctx;
      if (!noise) {
        noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = c.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const filter = filterFor({ ...v, j: v.from, k: v.to ?? v.from }, t0, v.m ?? "bandpass");
      const g = c.createGain();
      src.connect(filter).connect(g);
      out(g, v, t0, bus, 1e-3);
      src.start(t0, Math.random() * 0.9);
      src.stop(t0 + v.a);
    };
    const run = (list, k = 0, len2) => {
      if (!ready()) return;
      const now = ctx.currentTime;
      for (const v of list)
        for (let r = 0; r < (v.n ?? 1); r++)
          (v.notes ?? [v.from]).forEach((p, i) => {
            const from = p + (v.spread ? Math.random() * v.spread : 0);
            const at = (v.at ?? 0) + r * (v.every ?? 0) + i * (v.gap ?? 0) + (v.Oa ? Math.random() * v.Oa : 0);
            const w = {
              ...v,
              from,
              to: v.to && v.to * from / p,
              a: len2 ?? v.a,
              e: (v.e ?? 0.06) + r * (v.ya ?? 0) + k * (v.ma ?? 0),
              j: v.j && v.j + k * (v.xb ?? 0)
            };
            (v.wave === "noise" ? hiss : play2)(w, now + at, sfxBus);
          });
    };
    const kick = (t) => {
      const body = { wave: "sine", from: 210, to: 48, Qa: 0.07, a: 0.42, e: 0.8 };
      play2(body, t, kickBus);
      play2({ ...body, a: 0.3, e: 0.48 }, t, rumbleIn);
      hiss({ a: 0.012, e: 0.25, from: 5e3, to: 3e3, m: "highpass" }, t, kickBus);
      pump.gain.setValueAtTime(0.25, t);
      pump.gain.setTargetAtTime(1, t + 0.03, 0.075);
    };
    const clap = (t) => {
      for (const d of [0, 0.011, 0.023]) hiss({ a: 0.02, e: 0.3, from: 1500, to: 1100, q: 1.6 }, t + d);
      hiss({ a: 0.22, e: 0.21, from: 1400, to: 900, q: 1.2, ka: 0.35 }, t + 0.034);
    };
    const hats = (t, s, open, shaker) => {
      hiss({ a: 0.035, e: HAT[s % 4], from: 1e4, to: 8e3, m: "highpass", pan: 0.15 }, t);
      if (open && s % 4 === 2) hiss({ a: 0.16, e: 0.08, from: 8500, to: 6500, m: "highpass", pan: -0.15 }, t);
      if (shaker) hiss({ a: 0.05, e: s % 2 ? 0.04 : 0.025, from: 6e3, to: 5e3, q: 2, pan: -0.35 }, t);
    };
    const acid = (t, root, s, cutoff, dub2) => {
      const { zb: acid2, accent, slide } = SONG;
      const acc = accent[s] === "x";
      const f = hz(root + 12 + semis(acid2[s]));
      const from = prevAcid && slide[(s + 15) % 16] === "x" ? prevAcid : f;
      prevAcid = f || 0;
      if (f) play2({
        wave: "sawtooth",
        from,
        to: f,
        Qa: 0.05,
        a: len * (slide[s] === "x" ? 1.05 : 0.7),
        e: acc ? 0.13 : 0.09,
        j: cutoff * (acc ? 2.2 : 1.3),
        k: Math.max(120, cutoff * 0.35),
        Bb: len * (acc ? 0.6 : 1),
        q: 16,
        Pa: dub2
      }, t, grit);
      if (s % 4 === 2) play2({ wave: "sine", from: hz(root), a: len * 1.6, e: 0.12 }, t, pump);
    };
    const bleep = (t, bar2, s) => {
      const note = SONG.hook[bar2 % 4][s];
      if (note !== ".") play2({ from: hz(SONG.key + 36 + semis(note)), a: len * 0.5, e: 0.03, j: 4e3, Pa: 0.7, ka: 0.2, pan: s % 2 ? 0.3 : -0.3 }, t, pump);
    };
    const snare = (t, s) => {
      const v = { a: 0.07, e: 0.05 + s * 0.012, from: 1800, to: 1200 };
      hiss(v, t);
      if (s >= 8) hiss({ ...v, a: 0.05 }, t + len / 2);
    };
    const titleStep = (n, t) => {
      const bar2 = Math.floor(n / 16);
      const s = n % 16;
      const root = SONG.key + SONG.roots[bar2 % 4];
      const build = bar2 < 4;
      const brk = bar2 === 12 || bar2 === 13;
      const groove = !build && !brk;
      const into = bar2 === 3 || bar2 === 13;
      const bus = musicBus;
      if ((bar2 === 4 || bar2 === 14) && s === 0) {
        play2({ wave: "sine", from: 140, to: 30, a: 1.1, e: 0.7 }, t, kickBus);
        hiss({ a: 2, e: 0.16, from: 9e3, to: 3500, m: "highpass", ka: 0.6 }, t, bus);
      }
      if (!brk && s % 4 === 0 && !(into && s >= 12)) kick(t);
      const sweep = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / TITLE_STEPS);
      acid(t, root, s, (build ? 180 + bar2 * 120 : 350) + sweep * 2600 + (brk ? 1200 : 0), groove ? 0.25 : brk ? 0.6 : 0);
      if (!brk || bar2 === 13) hats(t, s, bar2 >= 2 && !brk, groove);
      if (groove && s % 8 === 4 || bar2 === 3 && s === 12) clap(t);
      if (into && (s >= 8 || s % 2 === 0)) snare(t, s);
      if (bar2 >= 8 && bar2 < 12 || bar2 >= 14) bleep(t, bar2, s);
      if (bar2 === 12 && s === 0) {
        for (const i of [0, 3, 7, 12]) {
          play2({ wave: "sawtooth", from: hz(root + 24 + i), a: len * 32, e: 0.012, Ab: len * 6, j: 800, q: 2, detune: 14, wide: true, ka: 0.6 }, t, pump);
        }
      }
      if (into && s === 0) {
        hiss({ a: len * 16, e: 0.14, from: 300, to: 9e3, ja: true, ka: 0.4 }, t, bus);
        play2({ wave: "sawtooth", from: hz(root + 12), to: hz(root + 36), a: len * 16, e: 0.03, j: 400, k: 6e3, detune: 20, wide: true, ja: true }, t, bus);
      }
    };
    const playStep = (n, t) => {
      if (level === 0) return titleStep(n, t);
      const bar2 = Math.floor(n / 16) % 4;
      const s = n % 16;
      const root = SONG.key + SONG.roots[bar2];
      if (s % 4 === 0 || level >= 3 && s === 14) kick(t);
      const sweep = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / STEPS);
      acid(t, root, s, 200 + level * 250 + sweep * (300 + level * 450), level >= 3 ? 0.25 : 0);
      hats(t, s, level >= 2, level >= 3);
      if (level >= 2 && s % 8 === 4) clap(t);
      if (level === 4 || level === 3 && bar2 >= 2) bleep(t, bar2, s);
    };
    return {
      // Called every frame: schedules the next notes slightly ahead of the audio clock.
      update() {
        if (!ctx || level < 0 || ctx.state !== "running") return;
        const now = ctx.currentTime;
        const l = 15 / SONG.Aa[level];
        if (l !== len) dub.delayTime.setValueAtTime((len = l) * 3, now);
        if (next < now) next = now + 0.05;
        while (next < now + LOOKAHEAD) {
          onStep?.(step2, next);
          if (level < 0) return;
          playStep(step2, next);
          next += len;
          step2 = (step2 + 1) % (level ? STEPS : TITLE_STEPS);
        }
      },
      // -1 silences the music, 0 is the title loop, 1..4 the funding rounds (faster each).
      // `from` is the sixteenth to start on (the music editor seeks with it).
      music(l, from = 0) {
        if (l === level) return;
        if (level <= 0 || l === 0) step2 = from;
        level = l;
        len = 15 / SONG.Aa[Math.max(0, l)];
        if (ready()) {
          musicBus.gain.setValueAtTime(l > 0 ? RUN_VOL : TITLE_VOL, ctx.currentTime);
          dub.delayTime.setValueAtTime(len * 3, ctx.currentTime);
        }
      },
      // Effects and engines off during the attract-mode demo.
      mute(on) {
        if (ctx) sfxBus.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.05);
      },
      // Light-cycle hum for a cabinet side: pitch follows the speed, boost opens the filter.
      engine(i, on, cellsPerSecond, boost) {
        if (!ctx || !on && !engines[i]) return;
        const E = ENGINE;
        if (!engines[i]) {
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          gain.gain.value = 0;
          filter.connect(gain).connect(sfxBus);
          const osc = ["sawtooth", "square"].map((type) => {
            const o = ctx.createOscillator();
            o.type = type;
            o.connect(filter);
            o.start();
            return o;
          });
          engines[i] = { osc, filter, gain };
        }
        const e = engines[i];
        const t = ctx.currentTime;
        e.filter.Q.value = E.q;
        e.osc[1].detune.value = E.sub;
        e.osc.forEach((o) => o.frequency.setTargetAtTime(E.base + cellsPerSecond * E.perCell + i * E.perBike, t, 0.08));
        e.filter.frequency.setTargetAtTime(boost ? E.boostCutoff : E.j, t, 0.06);
        e.gain.gain.setTargetAtTime(on ? boost ? E.boostVol : E.e : 0, t, 0.05);
      },
      // The effects (see FX). Each countdown number is harder than the last; the first also
      // starts the riser that lands on GO.
      count: (n, first) => {
        run(FX.count, first ? 0 : 3 - n);
        if (first) run(FX.yb, 0, n);
      },
      turn: () => run(FX.turn),
      go: () => run(FX.go),
      boost: () => run(FX.boost),
      va: () => run(FX.va),
      wa: () => run(FX.wa),
      $: () => run(FX.$),
      pivot: () => run(FX.pivot),
      xa: () => run(FX.xa),
      na: () => run(FX.na),
      join: () => (run(FX.na), run(FX.join)),
      round: () => run(FX.round),
      za: () => run(FX.za),
      lose: () => run(FX.lose),
      // Any list of voices: the sfx editor plays its drafts through here.
      fx: run
    };
  }

  // src/ai.ts
  function chooseDir(s, i) {
    const c = s.config;
    const b = s.h[i];
    const options = [b.dir, LEFT_OF[b.dir], RIGHT_OF[b.dir]].map((d) => {
      const x = b.x + DELTA[d][0];
      const y = b.y + DELTA[d][1];
      if (!isFree(c, s.grid, x, y)) return { d, x, y, score: -1 };
      let score = reachable(c, s.grid, x, y, c.rb);
      if (nearOtherHead(s, i, x, y)) score *= 0.5;
      return { d, x, y, score };
    });
    const best = Math.max(...options.map((o) => o.score));
    if (best < 0) return b.dir;
    const bananas = s.u.filter((p) => p.kind === "banana");
    if (b.aa < c.tb && bananas.length) {
      const dist = (x, y) => Math.min(...bananas.map((p) => Math.abs(p.x - x) + Math.abs(p.y - y)));
      const safe = options.filter((o) => o.score >= best * 0.5);
      return safe.reduce((a, o) => dist(o.x, o.y) < dist(a.x, a.y) ? o : a).d;
    }
    const good = options.filter((o) => o.score >= best * 0.9);
    if (good.length > 1 && random(s) < c.sb) return good[randomInt(s, good.length)].d;
    return good[0].d;
  }
  function wantsBoost(s, i) {
    const c = s.config;
    const b = s.h[i];
    return b.aa > c.ub && freeRun(c, s.grid, b.x, b.y, b.dir, c.Ma) >= c.Ma;
  }
  function nearOtherHead(s, i, x, y) {
    return s.h.some(
      (o, j) => j !== i && o.alive && o.v === 0 && Math.abs(o.x - x) + Math.abs(o.y - y) <= 1
    );
  }

  // src/sim.ts
  var SIM_HZ = 60;
  var NO_INPUT = [
    { r: [], start: false },
    { r: [], start: false }
  ];
  var SLOTS = [
    [0.25, 0.25, "R"],
    [0.75, 0.75, "L"],
    [0.75, 0.25, "D"],
    [0.25, 0.75, "U"]
  ];
  function createMatch(config, seed = 1) {
    return {
      config,
      Na: seed | 0,
      phase: "title",
      ba: 0,
      grid: new Uint8Array(config.cols * config.rows),
      h: [],
      u: [],
      fa: 0,
      oa: 0,
      ca: 0,
      pa: 0,
      la: null,
      _: false
    };
  }
  function tick(s, inputs) {
    const events = [];
    const c = s.config;
    s.ba++;
    switch (s.phase) {
      case "title":
        if (inputs[0].start || inputs[1].start) startMatch(s, inputs, events);
        else if (s.ba >= seconds(c.fb)) startMatch(s, NO_INPUT, events, true);
        break;
      case "countdown":
        join(s, inputs, events);
        if (s.ba % SIM_HZ === 0) {
          const left = c.ua - s.ba / SIM_HZ;
          if (left > 0) {
            events.push({ type: "countdown", n: left });
          } else {
            enter(s, "playing");
            events.push({ type: "go" });
          }
        }
        break;
      case "playing":
        if (s._ && (inputs[0].start || inputs[1].start)) startMatch(s, inputs, events);
        else if (s._ && s.ba >= seconds(c.gb)) toTitle(s, events);
        else play(s, inputs, events);
        if (s.phase === "playing" && !s._) join(s, inputs, events);
        break;
      case "matchOver": {
        const start = inputs[0].start || inputs[1].start;
        if (start && s.ba >= seconds(c.cb) || s.ba >= seconds(c.Ja)) {
          toTitle(s, events);
        }
        break;
      }
    }
    return events;
  }
  function seconds(n) {
    return Math.round(n * SIM_HZ);
  }
  function enter(s, phase) {
    s.phase = phase;
    s.ba = 0;
  }
  function toTitle(s, events) {
    s._ = false;
    enter(s, "title");
    events.push({ type: "title" });
  }
  function startMatch(s, inputs, events, demo = false) {
    const c = s.config;
    s.grid.fill(0);
    s.h = Array.from({ length: c.h }, (_, i) => {
      const [fx, fy, dir] = SLOTS[i % SLOTS.length];
      const x = Math.floor(c.cols * fx);
      const y = Math.floor(c.rows * fy);
      s.grid[cellIndex(c, x, y)] = i + 1;
      return {
        x,
        y,
        dir,
        human: i < 2 && inputs[i].start,
        lives: c.lives,
        aa: c.ia,
        alive: true,
        Ba: 0,
        v: 0,
        r: [],
        $: false,
        qa: false,
        da: false,
        ra: 0
      };
    });
    s.u = [];
    for (let i = 0; i < c.jb; i++) spawnPickup(s, "banana");
    s.oa = 0;
    s.ca = 0;
    s.pa = 0;
    s.la = null;
    s.fa = s.h.filter((b) => b.human).length;
    s._ = demo;
    enter(s, demo ? "playing" : "countdown");
    events.push({ type: "matchStart", fa: s.fa });
    if (!demo) events.push({ type: "countdown", n: c.ua });
  }
  function join(s, inputs, events) {
    inputs.forEach((input, i) => {
      const b = s.h[i];
      if (!input.start || !b || b.human || b.lives === 0) return;
      b.human = true;
      b.r = [];
      s.fa++;
      events.push({ type: "join", bike: i });
    });
  }
  function play(s, inputs, events) {
    const c = s.config;
    s.oa++;
    const round = Math.min(Math.floor(s.oa / seconds(c._a)), c.speeds.length - 1);
    if (round !== s.ca) {
      s.ca = round;
      events.push({ type: "roundUp", round });
    }
    s.h.forEach((b, i) => {
      if (b.human && b.alive) {
        for (const d of inputs[i].r) queueTurn(b, d, c.db);
        if (inputs[i].pivot) b.qa = true;
      }
      b.da = b.alive && (b.human ? !!inputs[i].boost : wantsBoost(s, i));
      if (b.v > 0) b.v--;
      if (b.Ba > 0 && --b.Ba === 0) respawn(s, i, events);
      if (b.alive) {
        b.aa -= c.hb * (b.da ? c.eb : 1) / SIM_HZ;
        if (b.aa <= 0) crash(s, i, "cash", events);
      }
    });
    if (s.oa % seconds(c.ib) === 0) {
      if (count(s, "banana") < c.kb) spawnPickup(s, "banana");
      if (count(s, "angel") < c.mb && random(s) < c.lb) spawnPickup(s, "angel");
    }
    if (checkEnd(s, events)) return;
    const speed = c.speeds[s.ca];
    const moves = [];
    s.pa += speed;
    if (s.pa >= SIM_HZ) {
      s.pa -= SIM_HZ;
      moves.push(s.h.map((_, i) => i));
    }
    const extra = s.h.flatMap((b, i) => {
      if (!b.da) return [];
      b.ra += speed * (c.Ka - 1);
      if (b.ra < SIM_HZ) return [];
      b.ra -= SIM_HZ;
      return [i];
    });
    if (extra.length) moves.push(extra);
    for (const movers of moves) {
      if (s.phase !== "playing") break;
      step(s, movers, events);
      checkEnd(s, events);
    }
  }
  function queueTurn(b, d, max) {
    const last = b.r.length ? b.r[b.r.length - 1] : b.dir;
    if (d === last || d === OPPOSITE[last] || b.r.length >= max) return;
    b.r.push(d);
  }
  function step(s, movers, events) {
    const c = s.config;
    const active = movers.filter((i) => s.h[i].alive);
    const next = /* @__PURE__ */ new Map();
    for (const i of active) {
      const b = s.h[i];
      if (b.qa) {
        b.qa = false;
        const lane = pivot(s, b);
        if (lane) {
          next.set(i, lane);
          events.push({ type: "pivot", bike: i });
          continue;
        }
      }
      if (b.human) {
        const turn = b.r.shift();
        if (turn) {
          b.dir = turn;
          events.push({ type: "turn", bike: i });
        }
      } else {
        b.dir = chooseDir(s, i);
      }
      next.set(i, [b.x + DELTA[b.dir][0], b.y + DELTA[b.dir][1]]);
    }
    const dead = /* @__PURE__ */ new Set();
    const shielded = /* @__PURE__ */ new Set();
    for (const i of active) {
      const [x, y] = next.get(i);
      const b = s.h[i];
      if (!inBounds(c, x, y)) dead.add(i);
      else if (b.v === 0 && s.grid[cellIndex(c, x, y)] !== 0) (b.$ ? shielded : dead).add(i);
    }
    const solid = active.filter((i) => s.h[i].v === 0);
    for (const i of solid) {
      for (const j of solid) {
        const [a, b] = [next.get(i), next.get(j)];
        if (i < j && a[0] === b[0] && a[1] === b[1]) dead.add(i).add(j);
      }
    }
    for (const i of active) {
      const b = s.h[i];
      if (dead.has(i)) {
        crash(s, i, "hit", events);
        continue;
      }
      [b.x, b.y] = next.get(i);
      if (shielded.has(i)) {
        b.$ = false;
        b.v = seconds(c.nb);
        events.push({ type: "shieldUsed", bike: i, x: b.x, y: b.y });
      } else if (b.v === 0) {
        s.grid[cellIndex(c, b.x, b.y)] = i + 1;
      }
      const r = c.ob;
      const k = s.u.findIndex((p) => Math.abs(p.x - b.x) <= r && Math.abs(p.y - b.y) <= r);
      if (k >= 0) {
        const [p] = s.u.splice(k, 1);
        if (p.kind === "angel") b.$ = true;
        else b.aa = Math.min(c.ia, b.aa + c.La);
        events.push({ type: "pickup", bike: i, x: p.x, y: p.y, kind: p.kind });
      }
    }
  }
  function pivot(s, b) {
    const c = s.config;
    const lane = (d) => [b.x + DELTA[d][0], b.y + DELTA[d][1]];
    const free = ([x, y]) => inBounds(c, x, y) && (b.v > 0 || s.grid[cellIndex(c, x, y)] === 0);
    const to = [lane(LEFT_OF[b.dir]), lane(RIGHT_OF[b.dir])].find(free);
    if (to) {
      b.dir = OPPOSITE[b.dir];
      b.r = [];
    }
    return to;
  }
  function checkEnd(s, events) {
    const standing = s.h.filter((b) => b.lives > 0);
    if (s._) {
      if (standing.length > 1) return false;
      toTitle(s, events);
      return true;
    }
    if (standing.some((b) => b.human) && standing.length > 1) return false;
    s.la = standing.length === 1 ? s.h.indexOf(standing[0]) : null;
    enter(s, "matchOver");
    events.push({ type: "matchOver", la: s.la });
    return true;
  }
  function crash(s, i, cause, events) {
    const b = s.h[i];
    b.alive = false;
    b.lives--;
    b.r = [];
    b.$ = false;
    b.qa = false;
    b.da = false;
    b.ra = 0;
    s.grid.forEach((v, k) => v === i + 1 && (s.grid[k] = 0));
    if (b.lives > 0) b.Ba = seconds(s.config.$a);
    events.push({ type: "crash", bike: i, x: b.x, y: b.y, livesLeft: b.lives, cause });
  }
  function respawn(s, i, events) {
    const b = s.h[i];
    Object.assign(b, pickSpawn(s, i), {
      alive: true,
      aa: s.config.ia,
      v: seconds(s.config.Ia),
      r: []
    });
    events.push({ type: "respawn", bike: i });
  }
  function farFromHeads(s, x, y, min, except = -1) {
    return !s.h.some((o, j) => j !== except && o.alive && Math.abs(o.x - x) + Math.abs(o.y - y) < min);
  }
  function pickSpawn(s, i) {
    const c = s.config;
    const need = Math.ceil(c.speeds[c.speeds.length - 1] * c.Ia + 5);
    let best = { x: Math.floor(c.cols / 2), y: Math.floor(c.rows / 2), dir: "R" };
    let bestRun = -1;
    for (let t = 0; t < c.bb && bestRun < need; t++) {
      const x = randomInt(s, c.cols);
      const y = randomInt(s, c.rows);
      const dir = DIRS[randomInt(s, 4)];
      if (!isFree(c, s.grid, x, y) || !farFromHeads(s, x, y, c.ab, i)) continue;
      const run = freeRun(c, s.grid, x, y, dir, need);
      if (run > bestRun) [best, bestRun] = [{ x, y, dir }, run];
    }
    return best;
  }
  function count(s, kind) {
    return s.u.filter((p) => p.kind === kind).length;
  }
  function spawnPickup(s, kind) {
    const c = s.config;
    for (let t = 0; t < c.qb; t++) {
      const x = randomInt(s, c.cols);
      const y = randomInt(s, c.rows);
      if (!isFree(c, s.grid, x, y) || s.u.some((p) => p.x === x && p.y === y)) continue;
      if (!farFromHeads(s, x, y, c.pb)) continue;
      s.u.push({ x, y, kind });
      return;
    }
  }

  // src/main.ts
  var W = CONFIG.cols * CONFIG.ha;
  var H = CONFIG.Ha + CONFIG.rows * CONFIG.ha;
  var TOP = CONFIG.Ha;
  var STEP_MS = 1e3 / SIM_HZ;
  var FONT = "font";
  var ZOOM = Phaser.Math.Clamp(Math.ceil(Math.min(innerWidth / W, innerHeight / H) * devicePixelRatio), 1, 3);
  var BIKE_NAMES = ["AMARILLO", "ROSADO", "CIAN", "NARANJO"];
  var FUNDING = ["PRE-SEED", "SEED", "SERIE A", "SERIE B"];
  var LOW_CASH = 0.3;
  var GRID_ALPHA = 0.6;
  var FRAME = 2;
  var BAR_W = 120;
  var HUD_MARGIN = 12;
  var HUD_GAP = 44;
  var HUD_X = [
    HUD_MARGIN,
    HUD_MARGIN + BAR_W + HUD_GAP,
    W - HUD_MARGIN - 2 * BAR_W - HUD_GAP,
    W - HUD_MARGIN - BAR_W
  ];
  var PIXEL = 2;
  var HORIZON = 330;
  var GRID_Z = 0.6;
  var CAMERA_SPEED = 1.2;
  var CYCLE_SPEED = 1.8;
  var WALL = 0.1;
  var WALL_LIFE = 1800;
  var HEADINGS = [[0, 1], [-1, 0], [1, 0]];
  var ARROW = ["#...", "##..", "###.", "####", "###.", "##..", "#..."];
  var CYCLES = cycleSprites();
  var CYCLE_COLORS = COLORS.h.map((c) => ({ c, d: shade(c, -0.75), w: shade(c, 0.55), W: WHITE }));
  var AFTER_COLORS = COLORS.h.map((c) => ({ c: shade(c, -0.35), d: shade(c, -0.8), w: c }));
  var ALL_WHITE = { y: WHITE, o: WHITE, b: WHITE, w: WHITE, g: WHITE, s: WHITE, "#": WHITE };
  var RAMPS = [
    ...COLORS.h.map((c) => [WHITE, c, shade(c, -0.6)]),
    [WHITE, COLORS.gold.hi, COLORS.gold.base, COLORS.gold.mid]
  ];
  var GOLD2 = 4;
  var SHIELD_RING = ["..########..", ".#........#.", ...Array(8).fill("#..........#"), ".#........#.", "..########.."];
  var GHOST_RING = [
    "..##....##..",
    "............",
    "#..........#",
    "#..........#",
    ...Array(4).fill("............"),
    "#..........#",
    "#..........#",
    "............",
    "..##....##.."
  ];
  var GHOST_RING2 = [
    "...##....##.",
    "#...........",
    "#...........",
    "...........#",
    "...........#",
    "............",
    "............",
    "#...........",
    "#...........",
    "...........#",
    "...........#",
    ".##....##..."
  ];
  var RunwayScene = class extends Phaser.Scene {
    constructor() {
      super(...arguments);
      // The original single-color bursts (one per bike, then white), kept as a variant.
      this.Cb = [];
      // Per ramp: slow chunks, fast white-hot sparks and drifting dust.
      this.chunks = [];
      this.ga = [];
      this.Ca = [];
      this.acc = 0;
      // Own clock: the hit-stop freezes the sim until stopUntil.
      this.now = 0;
      this.Ra = 0;
      // One layer per bike so a crash can wipe just that bike's trail.
      this.ea = [];
      // Per bike, cell by cell for the derezz, and merged into straight runs for drawing.
      this.segs = [];
      this.runs = [];
      this.fx = [];
      this.sa = [];
      this.after = [];
      this.lines = [];
      this.ta = [];
      this.Da = [];
      this.Sa = [];
      this.Ta = [];
      // When each pickup on the board appeared, by position and kind.
      this.Ea = /* @__PURE__ */ new Map();
      // Flash messages on screen, so a new one goes below the others.
      this.stack = 0;
      this.names = [];
      // Last trail cell drawn per bike, or null when the next one starts a new line.
      this.drawn = [];
      this.Ua = 0;
      this.cameraZ = 0;
      this.cycles = [];
      // Title sky: twinkling stars [x, y, phase], and the current lightning bolt.
      this.Va = [];
      this.Fa = [];
      this.Wa = -1e9;
      this.Xa = 2e3;
      // Boost state last frame per cabinet side, for the whoosh on press.
      this.Ya = [false, false];
    }
    create() {
      this.s = createMatch(CONFIG, Date.now());
      this.controls = createControls();
      this.events.once("shutdown", () => this.controls.destroy());
      this.sfx = createSfx(this.sound instanceof Phaser.Sound.WebAudioSoundManager ? this.sound.context : void 0);
      createPixelFont(this, FONT);
      FUNDING.forEach((label) => bakeTextGlow(this, "glow-" + label, label, 64, ACCENT, 16, 2));
      this.cameras.main.setOrigin(0).setZoom(ZOOM);
      this.game.canvas.style.imageRendering = "auto";
      this.add.rectangle(W / 2, TOP / 2, W, TOP, COLORS.ink);
      this.add.rectangle(W / 2, TOP + (H - TOP) / 2, W, H - TOP, COLORS.vb);
      const floor = this.add.graphics();
      gridLines(floor.fillStyle(COLORS.line, GRID_ALPHA));
      floor.fillStyle(COLORS.line).fillRect(0, TOP, W, FRAME).fillRect(0, H - FRAME, W, FRAME);
      floor.fillRect(0, TOP, FRAME, H - TOP).fillRect(W - FRAME, TOP, FRAME, H - TOP);
      this.ea = COLORS.h.map(() => this.add.graphics());
      this.segs = COLORS.h.map(() => []);
      this.runs = COLORS.h.map(() => []);
      this.u = this.add.graphics();
      this.sa = [this.add.graphics()];
      this.heads = this.add.graphics();
      this.hudG = this.add.graphics();
      this.names = HUD_X.map((x) => this.txt(x, 6, "", 16, COLORS.text).setOrigin(0, 0));
      this.round = this.txt(W / 2, 4, "", 16, COLORS.dim).setOrigin(0.5, 0);
      this.stage = this.txt(W / 2, 20, "", 16, COLORS.text).setOrigin(0.5, 0);
      this.Db();
      this.add.graphics().fillStyle(WHITE).fillRect(0, 0, 4, 4).generateTexture("px", 4, 4).destroy();
      const burst = (cfg) => this.add.particles(0, 0, "px", { blendMode: "ADD", emitting: false, ...cfg });
      const ramp2 = (color, speed, life, scale) => burst({
        speed: { min: speed[0], max: speed[1] },
        lifespan: { min: life[0], max: life[1] },
        scale: { start: scale, end: 0 },
        color
      });
      this.Cb = [...COLORS.h, WHITE].map(
        (tint) => burst({
          speed: { min: 40, max: 280 },
          lifespan: { min: 300, max: 900 },
          scale: { start: 1.4, end: 0 },
          alpha: { start: 1, end: 0 },
          tint
        })
      );
      this.chunks = RAMPS.map((r) => ramp2(r, [40, 280], [300, 900], 1.4));
      this.ga = RAMPS.map((r) => ramp2(r, [300, 700], [120, 280], 0.6));
      this.Ca = RAMPS.map((r) => ramp2(r, [10, 60], [250, 600], 1));
      this.smoke = burst({
        speed: { min: 15, max: 60 },
        lifespan: { min: 500, max: 900 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 0.8, end: 0 },
        gravityY: -30,
        color: [COLORS.text, COLORS.dim, COLORS.line],
        blendMode: "NORMAL"
      });
      this.sa.push(this.add.graphics(), this.add.graphics());
      this.center = this.txt(W / 2, H / 2 - 20, "", 64, COLORS.text).setDropShadow(4, 4, COLORS.ink, 1);
      this.sub = this.txt(W / 2, H / 2 + 30, "", 24, COLORS.text).setOrigin(0.5, 0).setDropShadow(3, 3, COLORS.ink, 1).setCenterAlign();
      this.demoLabel = this.txt(W / 2, H - 28, "DEMO \xB7 PRESIONA START", 24, ACCENT).setDropShadow(3, 3, COLORS.ink, 1).setVisible(false);
      this.time.addEvent({ delay: 500, loop: true, callback: () => this.demoLabel.setAlpha(this.demoLabel.alpha ? 0 : 1) });
      this.sfx.music(0);
    }
    // Title, after the cover: logo, tagline and call to start over a neon city at night, with
    // the EXIT door glowing at the end of the road and light cycles racing on a TRON floor.
    Db() {
      const { ink, night, wb: dusk } = COLORS;
      const rnd = Math.random;
      const sky = this.add.graphics().fillStyle(ink).fillRect(0, 0, W, H);
      for (let y = 0; y < HORIZON; y += 6) sky.fillStyle(night, y / HORIZON * 0.9).fillRect(0, y, W, 6);
      for (let y = HORIZON; y < H; y += 6) sky.fillStyle(night, 0.75 - (y - HORIZON) / (H - HORIZON) * 0.6).fillRect(0, y, W, 6);
      for (let i = 0; i < 12; i++) sky.fillStyle(dusk, 0.025 * (i + 1)).fillRect(0, HORIZON - 96 + i * 8, W, 8);
      for (let i = 0; i < 8; i++) sky.fillStyle(BRAND, 0.012 * (i + 1)).fillRect(0, HORIZON - 64 + i * 8, W, 8);
      this.Va = Array.from({ length: 90 }, () => [rnd() * W & ~1, rnd() * (HORIZON - 40) & ~1, rnd() * 7]);
      this.skyFx = this.add.graphics();
      const city = this.add.graphics();
      for (const back of [1, 0]) {
        for (const side of [-1, 1]) {
          for (let x = back * 10; x < 330; ) {
            const w = 2 * (12 + rnd() * 22 | 0);
            const h = (30 + (1 - x / 330) * (170 + back * 50)) * (0.55 + 0.45 * rnd());
            const [bx, by] = [side < 0 ? x : W - x - w, HORIZON - h];
            city.fillStyle(shade(night, back ? -0.45 : -0.7)).fillRect(bx, by, w, h);
            city.fillStyle(BRAND, back ? 0.25 : 0.6).fillRect(bx, by, w, 2).fillRect(bx, by, 2, h).fillRect(bx + w - 2, by, 2, h);
            for (let wy = by + 6; wy < HORIZON - 6; wy += 8)
              for (let wx = bx + 6; wx < bx + w - 6; wx += 6)
                if (rnd() < 0.3) city.fillStyle(rnd() < 0.2 ? ACCENT : BRAND, (0.3 + rnd() * 0.6) / (back + 1)).fillRect(wx, wy, 2, 3);
            if (!back && w > 36 && rnd() < 0.4) {
              city.fillStyle(BRAND, 0.8).fillRect(bx + 6, by + 12, w - 12, 30);
              city.fillStyle(shade(night, -0.7)).fillRect(bx + 8, by + 14, w - 16, 26);
              for (let sy = by + 16; sy < by + 38; sy += 4) city.fillStyle(rnd() < 0.3 ? ACCENT : BRAND, 0.35).fillRect(bx + 10, sy, (w - 20) * (0.4 + 0.6 * rnd()), 2);
            }
            if (rnd() < 0.3) city.fillStyle(BRAND, 0.6).fillRect(bx + w / 2 - 1, by - 14, 2, 14).fillStyle(ACCENT).fillRect(bx + w / 2 - 2, by - 16, 4, 3);
            x += w + 2 * (rnd() * 4 | 0);
          }
        }
      }
      const road = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      for (const [top, bottom, a] of [[14, 170, 0.06], [8, 90, 0.08], [3, 30, 0.12]])
        road.fillStyle(WHITE, a).fillTriangle(W / 2 - top, HORIZON, W / 2 + top, HORIZON, W / 2 + bottom, H).fillTriangle(W / 2 - top, HORIZON, W / 2 + bottom, H, W / 2 - bottom, H);
      this.door = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      for (let i = 6; i > 0; i--) this.door.fillStyle(BRAND, 0.06).fillRect(W / 2 - 16 - i * 7, HORIZON - 44 - i * 7, 32 + i * 14, 44 + i * 7);
      this.door.fillStyle(BRAND).fillRect(W / 2 - 16, HORIZON - 44, 32, 44);
      this.door.fillStyle(WHITE).fillRect(W / 2 - 12, HORIZON - 40, 24, 40);
      const exit = this.txt(W / 2, HORIZON - 56, "EXIT", 16, COLORS.text);
      this.floor = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      const horizon = this.add.rectangle(W / 2, HORIZON, W, 2, BRAND);
      bakeBarGlow(this, "glow-horizon", W, 2, BRAND, 12, 3);
      const horizonGlow = this.add.image(W / 2, HORIZON, "glow-horizon");
      this.cycles = COLORS.h.map((_, i) => ({ x: -1.5 + i, z: 2.5 + i % 2, dir: 0, turnAt: 0, wall: [] }));
      const rows = logoRows("RUNWAY");
      const [lw, lh] = spriteSize(rows, 13);
      const logo = this.add.graphics();
      rows.forEach((row, r) => {
        logo.fillStyle(shade(BRAND, 0.5 - r / rows.length * 0.9));
        [...row].forEach((ch, c) => ch === "#" && logo.fillRect(c * 13 - lw / 2, r * 13 - lh / 2, 13, 13));
      });
      drawOutlined(logo, rows, LOGO, -lw / 2, -lh / 2, 13, 3, 0);
      bakeOutlineGlow(this, "glow-logo", rows, 13, 3, BRAND, 16, 3);
      this.logo = this.add.container(W / 2, 112, [this.add.image(0, 0, "glow-logo"), logo]);
      const tagline = this.txt(W / 2, 196, "QUEMA DINERO. NO CHOQUES. HAZ EXIT.", 24, COLORS.text);
      const [pw, ph] = [tagline.width + 32, 40];
      const plate = this.add.graphics().fillStyle(BRAND).fillRect(W / 2 - pw / 2, 196 - ph / 2, pw, ph);
      plate.fillStyle(ink, 0.92).fillRect(W / 2 - pw / 2 + 2, 196 - ph / 2 + 2, pw - 4, ph - 4);
      const label = this.txt(0, 0, "PRESIONA START", 32, ACCENT);
      bakeTextGlow(this, "glow-cta", "PRESIONA START", 32, ACCENT, 12, 2);
      const arrows = this.add.graphics();
      const ax = label.width / 2 + 18;
      drawSprite(arrows, ARROW, { "#": ACCENT }, -ax - 8, -7, PIXEL);
      drawSprite(arrows, ARROW.map((r) => [...r].reverse().join("")), { "#": ACCENT }, ax, -7, PIXEL);
      const cta = this.add.container(W / 2, 246, [this.add.image(0, 0, "glow-cta"), label, arrows]);
      this.time.addEvent({ delay: 500, loop: true, callback: () => cta.setVisible(!cta.visible) });
      const hint = this.txt(W / 2, 574, "1 O 2 JUGADORES \xB7 \xDANETE CUANDO QUIERAS CON TU START", 16, COLORS.text).setDropShadow(2, 2, COLORS.ink, 1);
      const scan = this.add.graphics().fillStyle(COLORS.ink, 0.18);
      for (let y = 0; y < H; y += 3) scan.fillRect(0, y, W, 1);
      this.title = this.add.container(0, 0, [
        sky,
        this.skyFx,
        city,
        road,
        this.door,
        exit,
        this.floor,
        horizonGlow,
        horizon,
        this.logo,
        plate,
        tagline,
        cta,
        hint,
        scan
      ]);
    }
    txt(x, y, s, size, color) {
      return this.add.bitmapText(x, y, FONT, s, size).setOrigin(0.5).setTint(color);
    }
    update(_time, delta) {
      this.now += delta;
      this.acc = this.now < this.Ra ? 0 : Math.min(this.acc + delta, 250);
      while (this.acc >= STEP_MS) {
        this.acc -= STEP_MS;
        const events = tick(this.s, this.controls.poll());
        events.forEach((e) => this.Eb(e));
        this.Fb();
      }
      const now = this.now;
      if (this.title.visible) this.Gb(now, delta);
      this.Hb(now);
      this.Ib(now);
      this.Jb(now);
      this.Kb();
      this.Lb();
    }
    Eb(e) {
      switch (e.type) {
        case "title":
          this.reset();
          this.say("", "");
          this.title.setVisible(true);
          this.Ua = this.now;
          this.demoLabel.setVisible(false);
          this.sfx.mute(false);
          this.sfx.music(0);
          break;
        case "matchStart":
          this.title.setVisible(false);
          this.reset();
          this.say("", "");
          this.demoLabel.setVisible(this.s._);
          this.sfx.mute(this.s._);
          if (!this.s._) this.sfx.music(-1);
          break;
        case "countdown":
          this.say(String(e.n), this.Za());
          this.Mb(e.n);
          this.sfx.count(e.n, e.n === CONFIG.ua);
          break;
        case "go":
          this.sfx.music(1);
          this.sfx.go();
          this.say("GO!", "");
          this.Nb();
          this.time.delayedCall(500, () => this.s.phase === "playing" && this.say("", ""));
          break;
        case "join":
          this.flash("\xA1" + name(this.s, e.bike) + " SE UNE!", e.bike);
          this.sfx.join();
          if (this.s.phase === "countdown") this.sub.setText(this.Za());
          break;
        case "crash": {
          const segs = this.segs[e.bike];
          this.segs[e.bike] = [];
          this.runs[e.bike] = [];
          this.ea[e.bike].clear();
          this.drawn[e.bike] = null;
          this.Ob(e.bike, e.x, e.y, e.cause, segs);
          this.sfx.xa();
          this.impact(e.bike, e.cause);
          if (e.livesLeft === 0) this.flash(name(this.s, e.bike) + " QUEBR\xD3", e.bike);
          else if (e.cause === "cash") this.flash(name(this.s, e.bike) + " SIN DINERO", e.bike);
          break;
        }
        case "pickup":
          this.Pb(e.kind === "angel", e.x, e.y, e.bike);
          if (e.kind === "angel") {
            this.Sa[e.bike] = this.now;
            this.sfx.wa();
          } else this.sfx.va();
          this.Ga(e.kind === "angel" ? "ESCUDO" : "+" + CONFIG.La, e.x, e.y, e.bike);
          break;
        case "shieldUsed":
          this.Qb(e.x, e.y);
          this.sfx.$();
          this.Ga("\xA1SALVADO!", e.x, e.y, e.bike);
          break;
        case "pivot":
          this.sfx.pivot();
          this.Rb(e.bike);
          this.Ga("PIVOT", this.s.h[e.bike].x, this.s.h[e.bike].y, e.bike);
          break;
        case "turn":
          this.sfx.turn();
          this.Sb(e.bike);
          break;
        case "respawn":
          this.sfx.na();
          this.Tb(e.bike);
          break;
        case "roundUp":
          this.banner(FUNDING[e.round]);
          this.Ub();
          this.sfx.round();
          this.sfx.music(e.round + 1);
          break;
        case "matchOver":
          this.sfx.music(-1);
          this.Vb(e.la);
          break;
      }
    }
    reset() {
      this.ea.forEach((g) => g.clear());
      this.segs = COLORS.h.map(() => []);
      this.runs = COLORS.h.map(() => []);
      this.drawn = COLORS.h.map(() => null);
      this.after = [];
      this.lines = [];
      this.Ea.clear();
    }
    // Who you are (when alone), how the other side joins, and the two buttons.
    Za() {
      const solo = this.s.fa === 1 ? this.s.h.findIndex((b) => b.human) : -1;
      const who = solo < 0 ? "" : "T\xDA ERES EL " + BIKE_NAMES[solo] + "\nP" + (2 - solo) + ": START PARA UNIRTE\n\n";
      return who + "MANT\xC9N BOT\xD3N 1: BOOST \xB7 BOT\xD3N 2: PIVOT";
    }
    // Engine hum per human side, plus a whoosh when a boost starts.
    Lb() {
      const s = this.s;
      this.sfx.update();
      [0, 1].forEach((i) => {
        const b = s.h[i];
        const on = s.phase === "playing" && !s._ && !!b?.human && b.alive;
        const boost = on && b.da;
        const speed = CONFIG.speeds[s.ca] * (boost ? CONFIG.Ka : 1);
        this.sfx.engine(i, on, speed, boost);
        if (boost && !this.Ya[i]) this.sfx.boost();
        this.Ya[i] = boost;
      });
    }
    Vb(winner) {
      const humans = this.s.h.flatMap((b, i) => b.human ? [i] : []);
      if (winner !== null && this.s.h[winner].human) {
        this.say(name(this.s, winner) + ": EXIT!", "", winner);
        const loser = humans.find((i) => i !== winner);
        if (loser !== void 0) this.sub.setText(name(this.s, loser) + ": CERRAMOS. GRACIAS POR EL VIAJE.");
        this.Wb(winner);
        this.sfx.za();
      } else {
        this.say("GAME OVER", "CERRAMOS. GRACIAS POR EL VIAJE.");
        this.sub.setTint(COLORS.dim);
        this.Xb();
        this.sfx.lose();
      }
    }
    say(big, small, color) {
      this.tweens.killTweensOf(this.center);
      this.center.setText(big).setTint(color === void 0 ? COLORS.text : COLORS.h[color]).setScale(1).setAlpha(1);
      this.sub.setText(small).setTint(COLORS.text).setAlpha(1);
    }
    flash(msg, bike) {
      const t = this.txt(W / 2, TOP + 40 + 28 * this.stack++, msg, 24, COLORS.h[bike]).setDropShadow(3, 3, COLORS.ink, 1);
      this.enter(t, COLORS.h[bike], 8);
      this.tweens.add({
        targets: t,
        alpha: 0,
        y: t.y - 20,
        delay: 900,
        duration: 500,
        onComplete: () => (t.destroy(), this.stack--)
      });
    }
    // White-hot for two frames, then the bike's color, sliding in from the right in two steps.
    enter(t, color, slide) {
      t.setTint(WHITE).x += slide;
      this.time.delayedCall(33, () => t.setTint(color).x -= slide / 2);
      this.time.delayedCall(66, () => t.x -= slide / 2);
    }
    // Big funding-round announcement that zooms in and fades.
    banner(label) {
      const glow = this.add.image(W / 2, H / 2, "glow-" + label).setScale(0.6);
      const t = this.txt(W / 2, H / 2, label, 64, COLORS.text).setScale(0.6).setDropShadow(4, 4, COLORS.ink, 1);
      const sub = this.txt(W / 2, H / 2 + 56, "\xA1M\xC1S R\xC1PIDO!", 24, ACCENT).setDropShadow(3, 3, COLORS.ink, 1);
      this.tweens.add({ targets: [t, glow], scale: 1, duration: 250, ease: "Back.easeOut" });
      this.tweens.add({
        targets: [t, glow, sub],
        alpha: 0,
        delay: 1100,
        duration: 400,
        onComplete: () => (t.destroy(), glow.destroy(), sub.destroy())
      });
    }
    Ga(msg, x, y, bike) {
      const [cx, cy] = cellCenter(x, y);
      const t = this.txt(cx, cy - 12, msg, 16, COLORS.h[bike]).setDropShadow(2, 2, COLORS.ink, 1);
      this.enter(t, COLORS.h[bike], 0);
      this.tweens.add({ targets: t, y: cy - 36, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }
    // ---- Effects ----
    p(d, f, l = 1, delay = 0) {
      this.fx.push({ t0: this.now + delay, d, l, f });
    }
    Kb() {
      this.sa.forEach((g) => g.clear());
      this.fx = this.fx.filter((e) => {
        const el = this.now - e.t0;
        if (el >= e.d) return false;
        if (el >= 0) e.f(this.sa[e.l], el / e.d, el);
        return true;
      });
    }
    // Derezz: a white frame and a ring at the crash, white-hot sparks over colored chunks,
    // then the trail comes apart in light from the head back to the tail.
    // Running out of cash fizzles out in smoke instead.
    Ob(i, cellX, cellY, cause, segs) {
      const [x, y] = cellCenter(cellX, cellY);
      const c = COLORS.h[i];
      if (cause === "cash") {
        const dir = this.s.h[i].dir;
        this.smoke.explode(16, x, y);
        this.ga[i].explode(4, x, y);
        this.p(300, (g, k) => drawCycle(g, i, dir, x, y, [0.8, 0.5, 0.25, 0.1][k * 4 | 0], false), 0);
      } else {
        this.p(50, (g) => g.fillStyle(WHITE).fillRect(x - 12, y - 12, 24, 24));
        this.p(350, (g, k) => ring(g, x, y, 6 + 34 * out3(k), 3 - 2 * k, k < 0.3 ? WHITE : k < 0.7 ? c : shade(c, -0.5), 1 - k / 2));
        this.ga[i].explode(14, x, y);
        this.chunks[i].explode(30, x, y);
      }
      const n = segs.length;
      if (!n) return;
      segs.reverse();
      let done = 0;
      this.p(Phaser.Math.Clamp(250 + n * 1.5, 250, 700), (g, k) => {
        const head = Math.floor(k * k * n);
        for (; done < head; done++) if (done % 3 === 0) this.Ca[i].emitParticleAt(segs[done][2], segs[done][3], 1);
        const left = [];
        for (let j = head; j < n; j++) addToRuns(left, segs[j]);
        left.forEach((run) => drawSeg(g, c, run));
        if (head < n) g.fillStyle(WHITE).fillRect(segs[head][2] - 3, segs[head][3] - 3, 6, 6);
      }, 0);
    }
    // Camera reaction. A human's crash also tints the screen and, with one human playing,
    // freezes the action for a beat. With two the freeze would jolt the other player.
    impact(i, cause) {
      const human = this.s.h[i].human && !this.s._;
      this.cameras.main.shake(human ? 180 : 120, (human ? 8e-3 : 3e-3) / ZOOM);
      if (!human) return;
      if (cause === "hit" && this.s.fa === 1) this.Ra = this.now + 70;
      this.p(120, (g, k) => g.fillStyle(COLORS.h[i], 0.25 * (1 - k)).fillRect(0, 0, W, H), 2);
    }
    // Boost start: a small ring and a puff of sparks at the tail.
    Yb(i, x, y) {
      this.p(120, (g, k) => ring(g, x, y, 4 + 12 * out3(k), 2 - k, k < 0.3 ? WHITE : COLORS.h[i], 1 - k));
      this.ga[i].explode(4, x, y);
    }
    Mb(n) {
      const t = this.center.setTint([WHITE, COLORS.text, COLORS.dim][Math.min(n, 3) - 1]).setScale(1.8).setAlpha(0);
      this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 90, ease: "Expo.easeOut" });
      this.tweens.add({ targets: t, alpha: 0, delay: 750, duration: 200 });
    }
    Nb() {
      const t = this.center.setTint(WHITE).setScale(0.6);
      this.time.delayedCall(50, () => t.setTint(ACCENT));
      this.tweens.add({ targets: t, scale: 1, duration: 220, ease: "Back.easeOut" });
    }
    // A beam drops onto the cell, then the pickup appears in a white flash.
    Zb(x, y, angel) {
      const [cx, cy] = cellCenter(x, y);
      this.p(250, (g, k) => {
        if (k < 0.6) {
          const y1 = TOP + (cy - TOP) * out3(k / 0.6);
          g.fillStyle(angel ? WHITE : BANANA_COLORS.y, 0.9).fillRect(cx - 1, TOP, 2, y1 - TOP);
          g.fillStyle(WHITE).fillRect(cx - 2, y1 - 2, 4, 4);
        } else ring(g, cx, cy, 4 + 25 * (k - 0.6), 2, WHITE, 1 - (k - 0.6) / 0.4);
      });
    }
    Pb(angel, x, y, bike) {
      const [cx, cy] = cellCenter(x, y);
      const rows = angel ? ANGEL : BANANA;
      const [w, h] = spriteSize(rows, PIXEL);
      this.chunks[GOLD2].explode(14, cx, cy);
      this.p(50, (g) => drawSprite(g, rows, ALL_WHITE, cx - w / 2, cy - h / 2, PIXEL));
      this.p(200, (g, k) => ring(g, cx, cy, w / 2 + 4 + 10 * out3(k), 2, angel ? WHITE : BANANA_COLORS.y, 1 - k));
    }
    // The shield ring shatters into gold shards.
    Qb(x, y) {
      const [cx, cy] = cellCenter(x, y);
      this.chunks[GOLD2].explode(12, cx, cy);
      this.p(50, (g) => g.fillStyle(WHITE).fillRect(cx - 8, cy - 8, 16, 16));
      this.p(300, (g, k) => {
        for (let a = 0; a < 8; a++) {
          const ang = a * Math.PI / 4 + 0.2;
          const d = 12 + 60 * out3(k) * (0.8 + a * 7 % 5 / 10);
          g.fillStyle(ramp(RAMPS[GOLD2], k), 1 - k * k);
          g.fillRect(Math.round(cx + Math.cos(ang) * d) - 2, Math.round(cy + Math.sin(ang) * d) - 1, a % 2 ? 2 : 4, a % 2 ? 4 : 2);
        }
      });
    }
    // Rezz: light streams in to the spawn point, then a ring pops.
    Tb(i) {
      const b = this.s.h[i];
      const c = COLORS.h[i];
      const [cx, cy] = cellCenter(b.x, b.y);
      const [dx, dy] = DELTA[b.dir];
      const [x, y] = [cx - 8 * dx, cy - 8 * dy];
      const cols = [c, shade(c, 0.55), WHITE];
      this.p(250, (g, k) => {
        const r = 36 * (1 - 2 ** (10 * k - 10));
        for (let j = 0; j < 12; j++) {
          const a = j * 0.52 + j * j * 0.1;
          const s = j % 3 === 2 ? 4 : 2;
          g.fillStyle(cols[j % 3]).fillRect(Math.round(x + Math.cos(a) * r - s / 2), Math.round(y + Math.sin(a) * r - s / 2), s, s);
        }
      });
      this.p(200, (g, k) => ring(g, x, y, 4 + 16 * out3(k), 2 - k, k < 0.3 ? WHITE : c, 1 - k), 1, 250);
    }
    // Funding round: the arena grid flares pink while streaks rush past.
    Ub() {
      this.p(600, (g, k) => gridLines(g.fillStyle(ACCENT, 0.8 * Math.sin(Math.PI * k))), 0);
      this.p(500, (g, k) => {
        for (let j = 0; j < 14; j++) {
          const y = TOP + 8 + j * 137 % (H - TOP - 16);
          const x = W * (1.2 - (k * 1.9 + j * 0.29) % 1.6);
          g.fillStyle(COLORS.text, 0.15).fillRect(x, y, 60 + j * 37 % 80, 1);
        }
      }, 0);
    }
    Sb(i) {
      const b = this.s.h[i];
      this.ga[i].explode(3, ...cellCenter(b.x, b.y));
    }
    Rb(i) {
      const b = this.s.h[i];
      const [x, y] = cellCenter(b.x, b.y);
      this.p(150, (g, k) => ring(g, x, y, 6 + 6 * k, 2, COLORS.h[i], 1 - k));
    }
    // Winner: four bursts in their color.
    Wb(w) {
      for (let j = 0; j < 4; j++)
        this.time.delayedCall(j * 300, () => {
          const x = W * (0.2 + 0.6 * Math.random());
          const y = TOP + (H - TOP) * (0.15 + 0.5 * Math.random());
          this.chunks[w].explode(40, x, y);
          this.ga[w].explode(14, x, y);
          this.p(400, (g, k) => ring(g, x, y, 6 + 54 * out3(k), 3 - 2 * k, k < 0.3 ? WHITE : COLORS.h[w], 1 - k));
        });
    }
    // Game over: the screen collapses to a line, the line to a dot, like an old CRT turning off.
    // It stays dark under the final text until the match-over screen ends.
    Xb() {
      this.center.setAlpha(0);
      this.sub.setAlpha(0);
      this.time.delayedCall(420, () => (this.center.setAlpha(1), this.sub.setAlpha(1)));
      this.p(CONFIG.Ja * 1e3, (g, _k, e) => {
        if (this.s.phase !== "matchOver") return;
        const k = Math.min(1, e / 260);
        const h = H / 2 * k * k;
        g.fillStyle(COLORS.ink, e < 420 ? 1 : 0.85);
        if (e < 260) {
          g.fillRect(0, 0, W, h).fillRect(0, H - h, W, h);
          if (k > 0.7) g.fillStyle(WHITE).fillRect(0, H / 2 - 1, W, 2);
        } else {
          g.fillRect(0, 0, W, H);
          const lw = W * (1 - (e - 260) / 160);
          if (lw > 0) g.fillStyle(WHITE).fillRect(W / 2 - lw / 2 - 1, H / 2 - 1, lw + 2, 2);
        }
      }, 2);
    }
    // PlayerStatusBar per bike: name and shield on the left, lives on the right, cash bar below.
    Jb(time) {
      const g = this.hudG;
      g.clear();
      const show = this.s.phase !== "title";
      this.round.setText(show ? "ROUND " + (this.s.ca + 1) : "");
      this.stage.setText(show ? FUNDING[this.s.ca] : "");
      this.s.h.forEach((b, i) => {
        const label = this.names[i];
        label.setText(show ? name(this.s, i) : "");
        if (!show) return;
        const x = HUD_X[i];
        const color = COLORS.h[i];
        const alpha = b.lives === 0 ? 0.35 : i < 2 && !b.human ? 0.6 : 1;
        label.setTint(color).setAlpha(alpha);
        if (b.$) drawSprite(g, SHIELD, SHIELD_COLORS, x + label.width + 8, 8, PIXEL, alpha);
        for (let k = CONFIG.lives - 1, hx = x + BAR_W; k >= 0; k--) {
          const full = k < b.lives;
          const rows = full ? HEART : HEART_EMPTY;
          const [w, h] = spriteSize(rows, PIXEL);
          hx -= w;
          drawSprite(g, rows, { "#": color, w: WHITE, d: shade(color, -0.35) }, hx, 15 - h / 2, PIXEL, full ? alpha : alpha * 0.7);
          hx -= 3;
        }
        const f = b.alive ? Math.max(0, b.aa) / CONFIG.ia : 0;
        const low = b.alive && f < LOW_CASH;
        g.fillStyle(COLORS.line, alpha).fillRect(x, 26, BAR_W, 6);
        if (low && Math.floor(time / 150) % 2) return;
        g.fillStyle(low ? COLORS.danger : color, alpha).fillRect(x, 26, BAR_W * f, 6);
      });
    }
    Gb(time, delta) {
      const dt = Math.min(delta, 50) / 1e3;
      this.cameraZ += CAMERA_SPEED * dt;
      const since = time - this.Ua;
      const on = Math.floor(since / 70);
      const p = since % 5300;
      const dip = p > 5230 ? 0.6 : p > 5100 && p < 5140 ? 0.8 : 1;
      this.logo.setAlpha(on < 12 ? [1, 0.1, 0.9, 0.1, 0.1, 1, 0.3, 1, 1, 0.2, 1, 1][on] : dip);
      this.door.setAlpha(0.85 + 0.15 * Math.sin(time / 300));
      const sky = this.skyFx.clear();
      for (const [x, y, p2] of this.Va) sky.fillStyle(WHITE, 0.15 + 0.35 * (1 + Math.sin(time / 500 + p2))).fillRect(x, y, 2, 2);
      if (time > this.Xa) {
        const left = Math.random() < 0.5;
        let [x, y] = [left ? Math.random() * 140 : W - Math.random() * 140, 0];
        this.Fa = [[x, y]];
        while (y < 110 + Math.random() * 90) this.Fa.push([x += (left ? -1 : 1) * (Math.random() * 30 - 8), y += 12 + Math.random() * 16]);
        this.Wa = time;
        this.Xa = time + 3e3 + Math.random() * 4e3;
      }
      const strike = time - this.Wa;
      if (strike < 200 && (strike / 50 | 0) % 2 === 0) {
        sky.fillStyle(BRAND, 0.06).fillRect(0, 0, W, HORIZON);
        for (const [width, color] of [[5, BRAND], [2, WHITE]]) {
          sky.lineStyle(width, color, width > 2 ? 0.5 : 1).beginPath();
          this.Fa.forEach(([x, y], k) => k ? sky.lineTo(x, y) : sky.moveTo(x, y));
          sky.strokePath();
        }
      }
      const g = this.floor;
      g.clear();
      g.lineStyle(1, BRAND, 0.28);
      for (let x = -12; x <= 12; x += 0.5) g.lineBetween(...project(x, 1), ...project(x, 60));
      const phase = this.cameraZ % GRID_Z;
      for (let z = 1 + GRID_Z - phase; z < 30; z += GRID_Z) {
        g.lineStyle(1, BRAND, Math.min(0.4, 0.8 / z));
        g.lineBetween(0, project(0, z)[1], W, project(0, z)[1]);
      }
      this.cycles.forEach((c, i) => {
        const color = COLORS.h[i];
        this._b(c, i, time);
        const [dx, dz] = HEADINGS[c.dir];
        c.x += dx * CYCLE_SPEED * dt;
        c.z += dz * CYCLE_SPEED * dt;
        c.wall.push({ x: c.x, z: c.z, t: time });
        c.wall = c.wall.filter((p2) => time - p2.t < WALL_LIFE && p2.z - this.cameraZ > 1);
        for (let k = 1; k < c.wall.length; k++) {
          const [a, b] = [c.wall[k - 1], c.wall[k]];
          const fade = 1 - (time - a.t) / WALL_LIFE;
          const [a0, a1, b0, b1] = [
            project(a.x, a.z - this.cameraZ),
            project(a.x, a.z - this.cameraZ, WALL),
            project(b.x, b.z - this.cameraZ),
            project(b.x, b.z - this.cameraZ, WALL)
          ];
          g.fillStyle(color, 0.35 * fade);
          g.fillTriangle(...a0, ...b0, ...b1).fillTriangle(...a0, ...b1, ...a1);
          g.lineStyle(2, color, fade).lineBetween(...a1, ...b1);
        }
        const z = c.z - this.cameraZ;
        if (z <= 1) return;
        const [hx, hy] = project(c.x, z, WALL / 2);
        const r = Math.max(2, 10 / z);
        g.fillStyle(color, 0.5).fillRect(hx - r * 1.6, hy - r * 1.6, r * 3.2, r * 3.2);
        g.fillStyle(WHITE).fillRect(hx - r / 2, hy - r / 2, r, r);
      });
    }
    // Keeps each cycle on screen: forward when it drifts too close or too wide, sideways when too far.
    _b(c, i, time) {
      const z = c.z - this.cameraZ;
      let dir = c.dir;
      if (dir > 0 && (z < 1.8 || Math.abs(c.x) > 2.6)) dir = 0;
      else if (dir === 0 && z > 6) dir = Math.random() < 0.5 ? 1 : 2;
      else if (time > c.turnAt) dir = dir > 0 ? 0 : c.x > 0 ? 1 : 2;
      if (dir === c.dir && time <= c.turnAt) return;
      if (dir !== c.dir && z > 1) this.Ca[i].explode(4, ...project(c.x, z, WALL / 2));
      c.dir = dir;
      c.turnAt = time + 500 + Math.random() * 1200;
    }
    Ib(time) {
      const g = this.u;
      g.clear();
      if (this.s.phase === "title") return;
      const pulse = 0.18 + 0.1 * Math.sin(time / 150);
      const seen2 = /* @__PURE__ */ new Map();
      for (const p of this.s.u) {
        const angel = p.kind === "angel";
        const key = p.x + "," + p.y + p.kind;
        let at = this.Ea.get(key);
        if (at === void 0) {
          at = time;
          this.Zb(p.x, p.y, angel);
        }
        seen2.set(key, at);
        const age = time - at;
        if (age < 150) continue;
        const [cx, cy] = cellCenter(p.x, p.y);
        const rows = angel ? ANGEL : BANANA;
        const [w, h] = spriteSize(rows, PIXEL);
        const y = cy + (angel ? 2 * Math.sin(time / 200) : 0);
        const [left, top] = [Math.round(cx - w / 2), Math.round(y - h / 2)];
        g.fillStyle(angel ? WHITE : BANANA_COLORS.y, pulse);
        g.fillRect(cx - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);
        drawSprite(g, rows, age < 200 ? ALL_WHITE : angel ? ANGEL_COLORS : BANANA_COLORS, left, top, PIXEL);
        const ph = (time + p.x * 97) % 1500;
        if (ph < 200) {
          const s = ph / 50 | 0;
          g.fillStyle(WHITE).fillRect(left + s * w / 4, top + s * h / 4, 2, 2);
        }
      }
      this.Ea = seen2;
    }
    // Extends each bike's line only on cells its trail actually owns.
    Fb() {
      if (this.s.phase !== "playing" && this.s.phase !== "matchOver") return;
      this.s.h.forEach((b, i) => {
        if (!b.alive || this.s.grid[cellIndex(CONFIG, b.x, b.y)] !== i + 1) {
          this.drawn[i] = null;
          return;
        }
        const prev = this.drawn[i];
        if (prev && prev[0] === b.x && prev[1] === b.y) return;
        const owned = ([x, y]) => this.s.grid[cellIndex(CONFIG, x, y)] === i + 1;
        const gap = prev ? Math.abs(prev[0] - b.x) + Math.abs(prev[1] - b.y) : 0;
        const mid = prev && gap === 2 ? [[(prev[0] + b.x) / 2, (prev[1] + b.y) / 2], [prev[0], b.y], [b.x, prev[1]]].find(
          (m) => Number.isInteger(m[0]) && Number.isInteger(m[1]) && owned(m)
        ) : void 0;
        const path = gap === 1 ? [prev, [b.x, b.y]] : mid ? [prev, mid, [b.x, b.y]] : [[b.x, b.y], [b.x, b.y]];
        for (let k = 1; k < path.length; k++) {
          const seg = [...cellCenter(...path[k - 1]), ...cellCenter(...path[k]), b.da];
          this.segs[i].push(seg);
          addToRuns(this.runs[i], seg);
        }
        this.ea[i].clear();
        this.runs[i].forEach((run) => drawSeg(this.ea[i], COLORS.h[i], run));
        this.drawn[i] = [b.x, b.y];
      });
    }
    Hb(time) {
      const g = this.heads;
      g.clear();
      if (this.s.phase === "title") return;
      this.after = this.after.filter((a) => {
        const k = (time - a.t) / 400;
        if (k >= 1) return false;
        const rows = CYCLES[a.dir];
        const [w, h] = spriteSize(rows, PIXEL);
        drawSprite(g, rows, AFTER_COLORS[a.i], a.x - w / 2, a.y - h / 2, PIXEL, k < 0.45 ? 0.55 : 1 - k);
        return true;
      });
      this.lines = this.lines.filter((l) => {
        const k = (time - l.t) / 200;
        if (k >= 1) return false;
        bar(g, l.x, l.y, -l.dx, -l.dy, l.len * (1 - 0.6 * k), COLORS.h[l.i], 1 - k);
        bar(g, l.x, l.y, -l.dx, -l.dy, 3, WHITE, 1 - k);
        return true;
      });
      this.s.h.forEach((b, i) => {
        if (!b.alive) {
          this.Da[i] = false;
          this.ta[i] = null;
          this.ea[i].setAlpha(1);
          return;
        }
        const boost = b.da;
        const ghost = b.v > 0;
        const fast = b.v < 0.3 * SIM_HZ;
        const alpha = ghost ? Math.floor(time / (fast ? 50 : 100)) % 2 ? 0.9 : 0.25 : 1;
        const [cx, cy] = cellCenter(b.x, b.y);
        const [dx, dy] = DELTA[b.dir];
        const [mx, my] = [cx - 8 * dx, cy - 8 * dy];
        const drain = 1 - b.aa / CONFIG.ia / LOW_CASH;
        const slot = Math.floor(time / 70);
        const roll = Math.sin(slot * 12.9898 + i * 78.233) * 43758.5453 % 1;
        const dim = drain > 0 && Math.abs(roll) < 0.12 + 0.4 * drain;
        this.ea[i].setAlpha(dim ? 0.3 : 1);
        if (dim && this.Ta[i] !== slot) {
          this.Ta[i] = slot;
          this.smoke.emitParticleAt(mx - 12 * dx, my - 12 * dy, 1);
        }
        drawCycle(g, i, b.dir, cx, cy, alpha, boost && Math.floor(time / 40) % 2 === 0);
        if (boost) {
          if (!this.Da[i]) this.Yb(i, mx - 15 * dx, my - 15 * dy);
          const p = this.ta[i];
          if (!p || Math.abs(p[0] - mx) + Math.abs(p[1] - my) >= 24) {
            this.after.push({ x: mx, y: my, dir: b.dir, i, t: time });
            this.ta[i] = [mx, my];
          }
          const off = (Math.floor(time / 16) % 2 ? 1 : -1) * (6 + Math.floor(time / 7) % 5);
          this.lines.push({ x: mx - 12 * dx - dy * off, y: my - 12 * dy + dx * off, dx, dy, len: 12 + Math.floor(time) % 13, i, t: time });
        } else this.ta[i] = null;
        this.Da[i] = boost;
        if (ghost) {
          const march = Math.floor(time / 120) % 2;
          drawSprite(g, march ? GHOST_RING2 : GHOST_RING, { "#": COLORS.h[i] }, mx - 12, my - 12, PIXEL, alpha * 0.6);
        }
        if (b.$) this.$b(g, i, mx, my, time);
      });
    }
    // Shield ring. New look: it snaps on in hard steps, then a spark orbits it.
    $b(g, i, mx, my, time) {
      const age = time - (this.Sa[i] ?? -1e9);
      if (age < 100) return drawSprite(g, SHIELD_RING, { "#": age < 50 ? WHITE : COLORS.gold.base }, mx - 18, my - 18, 3);
      drawSprite(g, SHIELD_RING, { "#": COLORS.gold.base }, mx - 12, my - 12, PIXEL, 0.85);
      [0, 0.04, 0.08].forEach((lag, j) => {
        const [ox, oy] = perim((time / 600 - lag) % 1, 22);
        g.fillStyle([WHITE, COLORS.gold.hi, COLORS.gold.base][j]).fillRect(mx - 13 + ox, my - 13 + oy, 4 - j, 4 - j);
      });
    }
  };
  function name(s, i) {
    if (i < 2) return "P" + (i + 1) + (s.h[i].human ? "" : "\xB7IA");
    return "IA " + (i - 1);
  }
  var out3 = (k) => 1 - (1 - k) ** 3;
  var ramp = (cols, k) => cols[Math.min(cols.length - 1, k * cols.length | 0)];
  function gridLines(g) {
    for (let x = 10; x < CONFIG.cols; x += 10) g.fillRect(x * CONFIG.ha, TOP, 1, H - TOP);
    for (let y = 10; y < CONFIG.rows; y += 10) g.fillRect(0, TOP + y * CONFIG.ha, W, 1);
  }
  function ring(g, x, y, r, w, c, a) {
    [x, y, r, w] = [Math.round(x), Math.round(y), Math.round(r), Math.max(1, Math.round(w))];
    const s = 2 * r - 2 * w;
    if (s <= 0) return;
    g.fillStyle(c, a).fillRect(x - r + w, y - r, s, w).fillRect(x - r + w, y + r - w, s, w).fillRect(x - r, y - r + w, w, s).fillRect(x + r - w, y - r + w, w, s);
  }
  function bar(g, x, y, dx, dy, len, c, a) {
    const [x2, y2] = [x + dx * len, y + dy * len];
    g.fillStyle(c, a).fillRect(Math.min(x, x2) - 1, Math.min(y, y2) - 1, Math.abs(x2 - x) + 2, Math.abs(y2 - y) + 2);
  }
  function perim(p, s) {
    const t = p * 4;
    const f = Math.round(t % 1 * s / 2) * 2;
    return [[f, 0], [s, f], [s - f, s], [0, s - f]][t | 0];
  }
  function drawSeg(g, color, s) {
    neonBar(g, color, s[0], s[1], s[2], s[3], s[4]);
  }
  function neonBar(g, color, x1, y1, x2, y2, hot = false) {
    const [ax, bx] = [Math.min(x1, x2), Math.max(x1, x2)];
    const [ay, by] = [Math.min(y1, y2), Math.max(y1, y2)];
    const layers = hot ? [[10, 0.5, color], [4, 1, color], [2, 1, WHITE]] : [[8, 0.38, color], [3, 1, color]];
    for (const [t, a, c] of layers) {
      g.fillStyle(c, a);
      g.fillRect(ax - t / 2, ay - t / 2, bx - ax + t, by - ay + t);
    }
  }
  function drawCycle(g, i, dir, cx, cy, alpha, exhaust) {
    const rows = CYCLES[dir];
    const [w, h] = spriteSize(rows, PIXEL);
    const [dx, dy] = DELTA[dir];
    const [mx, my] = [cx - 8 * dx, cy - 8 * dy];
    g.fillStyle(COLORS.h[i], 0.2 * alpha).fillRect(mx - w / 2 - 3, my - h / 2 - 3, w + 6, h + 6);
    drawSprite(g, rows, CYCLE_COLORS[i], mx - w / 2, my - h / 2, PIXEL, alpha);
    if (exhaust) {
      const [tx, ty] = [mx - 15 * dx, my - 15 * dy];
      g.fillStyle(WHITE, alpha).fillRect(tx - 3, ty - 3, 6, 6);
      g.fillStyle(COLORS.h[i], 0.6 * alpha).fillRect(tx - 3 - 6 * dx, ty - 3 - 6 * dy, 6, 6);
    }
    return [mx, my];
  }
  function project(x, z, h = 0) {
    const k = (H - HORIZON) / z;
    return [W / 2 + x * k, HORIZON + (1 - h) * k];
  }
  function cellCenter(x, y) {
    const c = CONFIG.ha;
    return [x * c + c / 2, TOP + y * c + c / 2];
  }
  new Phaser.Game({
    type: Phaser.AUTO,
    width: W * ZOOM,
    height: H * ZOOM,
    parent: "game-root",
    backgroundColor: COLORS.ink,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // Crisp textures inside the canvas and no half-pixel positions; create() smooths the final fit.
    pixelArt: true,
    roundPixels: true,
    scene: RunwayScene
  });
})();
