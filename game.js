'use strict';
/* ============================================================
   STRØMBALLETTEN
   Hold det norske kraftsystemet i balanse ved å skru
   husholdningsapparater av og på. Inspirert av
   "Norsk sluttstrøm" (Uti vår hage).
   ============================================================ */

const VW = 320, VH = 240;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------------- PIKSELFONT (4x5) ---------------- */
const GLYPHS = {
  'A': ['0110','1001','1111','1001','1001'],
  'B': ['1110','1001','1110','1001','1110'],
  'C': ['0111','1000','1000','1000','0111'],
  'D': ['1110','1001','1001','1001','1110'],
  'E': ['1111','1000','1110','1000','1111'],
  'F': ['1111','1000','1110','1000','1000'],
  'G': ['0111','1000','1011','1001','0111'],
  'H': ['1001','1001','1111','1001','1001'],
  'I': ['0111','0010','0010','0010','0111'],
  'J': ['0011','0001','0001','1001','0110'],
  'K': ['1001','1010','1100','1010','1001'],
  'L': ['1000','1000','1000','1000','1111'],
  'M': ['1001','1111','1111','1001','1001'],
  'N': ['1001','1101','1011','1001','1001'],
  'O': ['0110','1001','1001','1001','0110'],
  'P': ['1110','1001','1110','1000','1000'],
  'Q': ['0110','1001','1001','1010','0101'],
  'R': ['1110','1001','1110','1010','1001'],
  'S': ['0111','1000','0110','0001','1110'],
  'T': ['1111','0100','0100','0100','0100'],
  'U': ['1001','1001','1001','1001','0110'],
  'V': ['1001','1001','1001','1010','0100'],
  'W': ['1001','1001','1111','1111','1001'],
  'X': ['1001','1001','0110','1001','1001'],
  'Y': ['1001','1001','0110','0100','0100'],
  'Z': ['1111','0001','0110','1000','1111'],
  'Æ': ['0111','1100','1111','1100','1111'],
  'Ø': ['0110','1011','1111','1101','0110'],
  'Å': ['0110','0000','0110','1001','1111'],
  '0': ['0110','1001','1001','1001','0110'],
  '1': ['0010','0110','0010','0010','0111'],
  '2': ['1110','0001','0110','1000','1111'],
  '3': ['1110','0001','0110','0001','1110'],
  '4': ['1001','1001','1111','0001','0001'],
  '5': ['1111','1000','1110','0001','1110'],
  '6': ['0111','1000','1110','1001','0110'],
  '7': ['1111','0001','0010','0100','0100'],
  '8': ['0110','1001','0110','1001','0110'],
  '9': ['0110','1001','0111','0001','1110'],
  ' ': ['0000','0000','0000','0000','0000'],
  ':': ['0000','0100','0000','0100','0000'],
  '.': ['0000','0000','0000','0000','0100'],
  ',': ['0000','0000','0000','0100','1000'],
  '!': ['0100','0100','0100','0000','0100'],
  '?': ['1110','0001','0110','0000','0100'],
  '-': ['0000','0000','1111','0000','0000'],
  '+': ['0000','0100','1110','0100','0000'],
  '/': ['0001','0010','0100','1000','0000'],
  '[': ['0110','0100','0100','0100','0110'],
  ']': ['0110','0010','0010','0010','0110'],
  '(': ['0010','0100','0100','0100','0010'],
  ')': ['0100','0010','0010','0010','0100'],
};

function drawText(s, x, y, col, sc, align) {
  sc = sc || 1;
  s = String(s).toUpperCase();
  if (align === 'center') x -= Math.floor(textW(s, sc) / 2);
  else if (align === 'right') x -= textW(s, sc);
  ctx.fillStyle = col;
  for (let i = 0; i < s.length; i++) {
    const g = GLYPHS[s[i]];
    if (g) {
      for (let r = 0; r < 5; r++) {
        const row = g[r];
        for (let c = 0; c < 4; c++) {
          if (row[c] === '1') ctx.fillRect(x + c * sc, y + r * sc, sc, sc);
        }
      }
    }
    x += 5 * sc;
  }
}
function textW(s, sc) { return s.length * 5 * (sc || 1) - (sc || 1); }

/* ---------------- LYD ---------------- */
let actx = null;
let muted = false;
function audioInit() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume();
}
function tone(freq, dur, type, vol, delay, slideTo) {
  if (muted || !actx) return;
  const t0 = actx.currentTime + (delay || 0);
  const osc = actx.createOscillator();
  const g = actx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol || 0.12, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g); g.connect(actx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}
const SFX = {
  on:      () => { tone(520, 0.06, 'square', 0.10); tone(780, 0.08, 'square', 0.10, 0.05); },
  off:     () => { tone(480, 0.06, 'square', 0.10); tone(300, 0.09, 'square', 0.10, 0.05); },
  denied:  () => { tone(130, 0.14, 'sawtooth', 0.12); },
  warn:    () => { tone(880, 0.08, 'square', 0.09); },
  change:  () => { tone(660, 0.09, 'square', 0.11); tone(440, 0.12, 'square', 0.11, 0.08); },
  perfekt: () => { tone(523, 0.07, 'square', 0.11); tone(659, 0.07, 'square', 0.11, 0.07); tone(784, 0.07, 'square', 0.11, 0.14); tone(1047, 0.14, 'square', 0.11, 0.21); },
  spark:   () => { tone(1300, 0.05, 'sawtooth', 0.07); },
  jam:     () => { tone(160, 0.5, 'sawtooth', 0.14, 0, 70); },
  surge:   () => { tone(1200, 0.3, 'sawtooth', 0.12, 0, 200); },
  levelup: () => { tone(392, 0.08, 'square', 0.11); tone(523, 0.08, 'square', 0.11, 0.08); tone(659, 0.08, 'square', 0.11, 0.16); tone(784, 0.18, 'square', 0.11, 0.24); },
  blackout:() => { tone(600, 1.4, 'sawtooth', 0.16, 0, 40); },
  troll:   () => { tone(700, 0.05, 'triangle', 0.10); tone(500, 0.05, 'triangle', 0.10, 0.06); },
  saved:   () => { tone(784, 0.07, 'square', 0.11); tone(1175, 0.12, 'square', 0.11, 0.07); },
};

/* ---------------- APPARATER ---------------- */
function mkAppliances() {
  return [
    { type: 'kjoleskap',   name: 'KJØLESKAP',   watt: 60,  x: 14,  y: 48,  w: 20, h: 28 },
    { type: 'vaskemaskin', name: 'VASKEMASKIN', watt: 150, x: 44,  y: 54,  w: 20, h: 22 },
    { type: 'panelovn',    name: 'PANELOVN',    watt: 250, x: 142, y: 50,  w: 36, h: 12 },
    { type: 'bereder',     name: 'BEREDER',     watt: 400, x: 284, y: 48,  w: 22, h: 28 },
    { type: 'tv',          name: 'TV',          watt: 40,  x: 12,  y: 104, w: 26, h: 20 },
    { type: 'stovsuger',   name: 'STØVSUGER',   watt: 100, x: 14,  y: 160, w: 18, h: 20 },
    { type: 'vifte',       name: 'VIFTE',       watt: 25,  x: 288, y: 104, w: 20, h: 22 },
    { type: 'radio',       name: 'RADIO',       watt: 15,  x: 286, y: 162, w: 22, h: 14 },
    { type: 'lampe',       name: 'LAMPE',       watt: 10,  x: 118, y: 130, w: 18, h: 24 },
    { type: 'klokke',      name: 'KLOKKE',      watt: 3,   x: 186, y: 132, w: 18, h: 20 },
  ].map(a => Object.assign(a, { on: false, spark: 0, jam: 0, anim: 0 }));
}

const TICKER = [
  'STATNETT TAKKER FOR INNSATSEN',
  'SVERIGE VIL KJØPE MER STRØM',
  'DET BLÅSER FRISKT PÅ UTSIRA',
  'HUSK Å SKRU AV LYSET ETTER DEG',
  'MØRKLEGGING ER IKKE ET ALTERNATIV',
  'FINLAND HAR SKRUDD PÅ BADSTUA IGJEN',
  'KRAFTKRISE AVVERGET, FORELØPIG',
  'EN ELG GNAGER PÅ EN KRAFTLINJE I HEDMARK',
  'NVE MELDER: PROGNOSENE ER USIKRE',
  'DANMARK SENDER VINDKRAFT, TA IMOT',
  'MONSTERMASTENE STÅR STØTT',
  'OLJEFONDET KAN IKKE HJELPE DEG NÅ',
  'KRAFTBALANSE ER EN LAGIDRETT',
  'DUSJ KALDT, TENK VARMT',
];

/* ---------------- TILSTAND ---------------- */
let state = 'title'; // title | play | pause | over
let appliances = [];
let player = { x: 160, y: 180, vx: 0, vy: 0, anim: 0, face: 1, moving: false };
let incoming = 0, nextTarget = null, warnT = 0, changeT = 0, lastWarnBeep = 99;
let sinceChange = 0, hadImbalance = false, perfectAwarded = true;
let stability = 100, score = 0, hiscore = 0, combo = 0;
let level = 1, levelT = 0, playTime = 0;
let chaosT = 12, trollT = 14;
let banner = '', bannerT = 0;
let changeFlash = 0, shakeT = 0, shakeMag = 0, flickerT = 0;
let blackoutT = 0;
let tickerX = VW, tickerMsg = '';
let particles = [], floats = [];
let keys = {};
let frame = 0;

try { hiscore = parseInt(localStorage.getItem('stromballetten_hi') || '0', 10) || 0; } catch (e) {}

function rnd(a, b) { return a + Math.random() * (b - a); }
function rndi(a, b) { return Math.floor(rnd(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

function consumption() {
  let s = 0;
  for (const a of appliances) if (a.on) s += a.watt;
  return s;
}
function diff() { return consumption() - incoming; }

function changeInterval() { return Math.max(6, 16 - level * 1.2); }

function levelSubsetRange() {
  if (level <= 1) return [1, 2];
  if (level === 2) return [2, 3];
  if (level === 3) return [2, 4];
  if (level === 4) return [3, 5];
  return [3, 6];
}

function genTarget() {
  const [kMin, kMax] = levelSubsetRange();
  for (let tries = 0; tries < 30; tries++) {
    const pool = appliances.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const n = rndi(kMin, Math.min(kMax, pool.length));
    let sum = 0;
    for (let i = 0; i < n; i++) sum += pool[i].watt;
    if (sum > 0 && sum !== incoming) return sum;
  }
  return incoming + 60;
}

function addFloat(x, y, text, col) {
  floats.push({ x, y, text, col, t: 1.6 });
}
function addSparks(a, n, col) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x: a.x + rnd(0, a.w), y: a.y + rnd(0, a.h),
      vx: rnd(-30, 30), vy: rnd(-50, -5),
      t: rnd(0.2, 0.5), col: col || (Math.random() < 0.5 ? '#fff860' : '#ffffff'),
    });
  }
}

function reset() {
  appliances = mkAppliances();
  player = { x: 160, y: 185, vx: 0, vy: 0, anim: 0, face: 1, moving: false };
  incoming = 0; nextTarget = null; warnT = 0; changeT = 4; lastWarnBeep = 99;
  sinceChange = 0; hadImbalance = false; perfectAwarded = true;
  stability = 100; score = 0; combo = 0;
  level = 1; levelT = 0; playTime = 0;
  chaosT = rnd(10, 15); trollT = rnd(12, 18);
  banner = ''; bannerT = 0;
  changeFlash = 0; shakeT = 0; flickerT = 0; blackoutT = 0;
  particles = []; floats = [];
  tickerX = VW; tickerMsg = pick(TICKER);
}

/* ---------------- INPUT ---------------- */
window.addEventListener('keydown', (e) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  audioInit();

  if (e.repeat) return;
  const k = e.key.toLowerCase();

  if (k === 'm') { muted = !muted; return; }

  if (state === 'title' && (k === 'enter' || k === ' ')) {
    reset(); state = 'play'; SFX.levelup(); return;
  }
  if (state === 'over' && k === 'r') {
    reset(); state = 'play'; SFX.levelup(); return;
  }
  if (k === 'p' && (state === 'play' || state === 'pause')) {
    state = state === 'play' ? 'pause' : 'play'; return;
  }
  if (state === 'play' && (k === 'e' || k === ' ')) {
    tryToggle();
  }
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function nearestAppliance() {
  let best = null, bestD = 1e9;
  for (const a of appliances) {
    const ex = 10;
    if (player.x >= a.x - ex && player.x <= a.x + a.w + ex &&
        player.y >= a.y - ex && player.y <= a.y + a.h + ex) {
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      const d = Math.abs(player.x - cx) + Math.abs(player.y - cy);
      if (d < bestD) { bestD = d; best = a; }
    }
  }
  return best;
}

function tryToggle() {
  const a = nearestAppliance();
  if (!a) return;
  if (a.jam > 0) {
    SFX.denied();
    addFloat(a.x + a.w / 2, a.y - 6, 'FASTLÅST!', '#ff6060');
    return;
  }
  if (a.spark > 0 && a.on) {
    // Reddet fra kortslutning!
    a.spark = 0; a.on = false;
    score += 25 * level;
    SFX.saved();
    addFloat(a.x + a.w / 2, a.y - 6, 'REDDET! +' + (25 * level), '#60ff80');
    addSparks(a, 6, '#60ff80');
    return;
  }
  a.on = !a.on;
  if (a.on) SFX.on(); else SFX.off();
  addSparks(a, 3);
}

/* ---------------- OPPDATERING ---------------- */
function update(dt) {
  frame++;
  if (state !== 'play') {
    if (state === 'over') blackoutT += dt;
    return;
  }

  playTime += dt;

  // --- Spillerbevegelse ---
  let dx = 0, dy = 0;
  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  if (keys['arrowup'] || keys['w']) dy -= 1;
  if (keys['arrowdown'] || keys['s']) dy += 1;
  if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
  const speed = 88;
  player.moving = !!(dx || dy);
  if (dx) player.face = dx > 0 ? 1 : -1;
  if (player.moving) player.anim += dt * 10;

  moveAxis(dx * speed * dt, 0);
  moveAxis(0, dy * speed * dt);
  player.x = clamp(player.x, 12, 308);
  player.y = clamp(player.y, 52, 220);

  // --- Prognose / mål ---
  sinceChange += dt;
  const d = diff();
  if (incoming > 0 && d !== 0) hadImbalance = true;

  if (nextTarget === null) {
    changeT -= dt;
    if (changeT <= 0) {
      const val = genTarget();
      const surgeP = level >= 3 ? Math.min(0.35, 0.1 * (level - 2)) : 0;
      if (Math.random() < surgeP) {
        // Lynnedslag: ingen forvarsel!
        applyTarget(val, true);
      } else {
        nextTarget = val;
        warnT = 3;
        lastWarnBeep = 99;
      }
    }
  } else {
    warnT -= dt;
    const sec = Math.ceil(warnT);
    if (sec < lastWarnBeep && sec > 0) { SFX.warn(); lastWarnBeep = sec; }
    if (warnT <= 0) applyTarget(nextTarget, false);
  }

  // --- Perfekt-bonus ---
  if (incoming > 0 && !perfectAwarded && d === 0 && hadImbalance && sinceChange < 5) {
    perfectAwarded = true;
    combo++;
    const bonus = 30 * level + 10 * (combo - 1);
    score += bonus;
    SFX.perfekt();
    addFloat(player.x, player.y - 14, combo > 1 ? 'BALLETT X' + combo + '! +' + bonus : 'PERFEKT! +' + bonus, '#80e8ff');
  }
  if (!perfectAwarded && sinceChange >= 5) { combo = 0; perfectAwarded = true; }

  // --- Stabilitet og poeng ---
  if (incoming > 0) {
    if (d === 0) {
      stability = Math.min(100, stability + 7 * dt);
      score += 12 * level * dt;
    } else {
      const drain = (1.5 + Math.abs(d) * 0.018) * (1 + 0.06 * (level - 1));
      stability -= drain * dt;
    }
  }
  if (stability <= 0) {
    stability = 0;
    gameOver();
    return;
  }

  // --- Nivå ---
  levelT += dt;
  if (levelT >= 28 && level < 9) {
    level++; levelT = 0;
    banner = 'NIVÅ ' + level + '!'; bannerT = 2;
    SFX.levelup();
  }

  // --- Kortslutning (kaos) ---
  if (level >= 2) {
    chaosT -= dt;
    if (chaosT <= 0) {
      chaosT = rnd(9, 16) - level * 0.5;
      const candidates = appliances.filter(a => a.on && !a.jam && !a.spark);
      if (candidates.length) {
        const a = pick(candidates);
        a.spark = 4;
        addFloat(a.x + a.w / 2, a.y - 6, 'GNISTRER!', '#ffd040');
      }
    }
  }
  for (const a of appliances) {
    a.anim += dt;
    if (a.spark > 0) {
      a.spark -= dt;
      if (frame % 8 === 0) { addSparks(a, 2); SFX.spark(); }
      if (a.spark <= 0) {
        a.spark = 0;
        a.jam = 8;
        stability -= 12;
        shakeT = 0.4; shakeMag = 3;
        SFX.jam();
        addFloat(a.x + a.w / 2, a.y - 6, 'KORTSLUTNING! LÅST PÅ!', '#ff6060');
      }
    }
    if (a.jam > 0) {
      a.jam -= dt;
      if (a.jam <= 0) a.jam = 0;
    }
  }

  // --- Trollet i nettet (skrur på ting selv) ---
  if (level >= 4) {
    trollT -= dt;
    if (trollT <= 0) {
      trollT = rnd(8, 14);
      if (Math.random() < 0.5) {
        const a = pick(appliances.filter(x => !x.jam && !x.spark));
        if (a) {
          a.on = !a.on;
          SFX.troll();
          addFloat(a.x + a.w / 2, a.y - 6, '?!', '#e080ff');
        }
      }
    }
  }

  // --- Flimring ved lav stabilitet ---
  if (stability < 35 && Math.random() < 5 * dt) flickerT = rnd(0.04, 0.1);
  if (flickerT > 0) flickerT -= dt;

  // --- Diverse timere ---
  if (changeFlash > 0) changeFlash -= dt;
  if (bannerT > 0) bannerT -= dt;
  if (shakeT > 0) shakeT -= dt;

  // --- Partikler og tekst ---
  particles = particles.filter(p => {
    p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
    return p.t > 0;
  });
  floats = floats.filter(f => { f.t -= dt; f.y -= 14 * dt; return f.t > 0; });

  // --- Ticker ---
  tickerX -= 28 * dt;
  if (tickerX < -textW(tickerMsg, 1)) {
    tickerX = VW;
    tickerMsg = pick(TICKER);
  }
}

function applyTarget(val, surge) {
  incoming = val;
  nextTarget = null;
  changeT = changeInterval();
  changeFlash = 0.7;
  sinceChange = 0;
  hadImbalance = false;
  perfectAwarded = false;
  if (surge) {
    SFX.surge();
    shakeT = 0.5; shakeMag = 4;
    banner = 'LYNNEDSLAG! NY PROGNOSE!'; bannerT = 1.6;
  } else {
    SFX.change();
  }
}

function gameOver() {
  state = 'over';
  blackoutT = 0;
  SFX.blackout();
  score = Math.floor(score);
  if (score > hiscore) {
    hiscore = score;
    try { localStorage.setItem('stromballetten_hi', String(hiscore)); } catch (e) {}
  }
}

function moveAxis(mx, my) {
  player.x += mx; player.y += my;
  const pw = 4, ph = 4; // halv bredde/høyde på føttene
  for (const a of appliances) {
    if (player.x + pw > a.x && player.x - pw < a.x + a.w &&
        player.y + ph > a.y && player.y - ph < a.y + a.h) {
      if (mx > 0) player.x = a.x - pw;
      else if (mx < 0) player.x = a.x + a.w + pw;
      if (my > 0) player.y = a.y - ph;
      else if (my < 0) player.y = a.y + a.h + ph;
    }
  }
}

/* ---------------- TEGNING ---------------- */
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VW, VH);

  if (shakeT > 0) {
    ctx.setTransform(1, 0, 0, 1, Math.round(rnd(-shakeMag, shakeMag)), Math.round(rnd(-shakeMag, shakeMag)));
  }

  drawRoom();
  drawPanel();
  for (const a of appliances) drawAppliance(a);
  drawApplianceLabels();
  drawPlayer();
  drawParticles();
  drawStatus();
  drawHUD();
  drawFloats();

  if (flickerT > 0 && state === 'play') {
    ctx.fillStyle = 'rgba(0,0,10,0.4)';
    ctx.fillRect(-4, -4, VW + 8, VH + 8);
  }

  if (bannerT > 0) {
    const a = Math.min(1, bannerT);
    ctx.fillStyle = 'rgba(10,10,30,' + (0.75 * a) + ')';
    ctx.fillRect(0, 104, VW, 28);
    if (Math.floor(bannerT * 8) % 2 === 0) {
      drawText(banner, VW / 2, 114, '#ffe060', 2, 'center');
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (state === 'title') drawTitle();
  if (state === 'pause') drawPause();
  if (state === 'over') drawGameOver();
}

function drawRoom() {
  // Gulv i sjakkmønster
  for (let ty = 40; ty < VH; ty += 16) {
    for (let tx = 0; tx < VW; tx += 16) {
      ctx.fillStyle = ((tx / 16 + ty / 16) % 2 === 0) ? '#564c42' : '#4a4138';
      ctx.fillRect(tx, ty, 16, 16);
    }
  }
  // Vegger venstre/høyre/bunn
  ctx.fillStyle = '#8a7440';
  ctx.fillRect(0, 40, 8, VH - 40);
  ctx.fillRect(VW - 8, 40, 8, VH - 40);
  ctx.fillRect(0, VH - 14, VW, 14);
  ctx.fillStyle = '#6e5c30';
  ctx.fillRect(7, 40, 1, VH - 40);
  ctx.fillRect(VW - 8, 40, 1, VH - 40);
  ctx.fillRect(0, VH - 14, VW, 1);
  // Dør nederst
  ctx.fillStyle = '#3a3028';
  ctx.fillRect(150, VH - 14, 20, 14);
}

function drawPanel() {
  // Bakvegg med kontrollpanel
  ctx.fillStyle = '#1c2026';
  ctx.fillRect(0, 0, VW, 40);
  ctx.fillStyle = '#272c34';
  ctx.fillRect(0, 38, VW, 2);
  // Nagler
  ctx.fillStyle = '#3c444e';
  for (let x = 6; x < VW; x += 24) { ctx.fillRect(x, 2, 2, 2); ctx.fillRect(x, 26, 2, 2); }

  // --- INN-display ---
  ctx.fillStyle = '#0c0e10';
  ctx.fillRect(8, 4, 92, 26);
  ctx.strokeStyle = '#4a525c'; ctx.lineWidth = 1;
  ctx.strokeRect(8.5, 4.5, 91, 25);
  drawText('INN:', 12, 7, '#8a96a4', 1);
  const innCol = changeFlash > 0 && Math.floor(changeFlash * 10) % 2 === 0 ? '#ffffff' : '#ffd040';
  drawText(incoming + 'W', 12, 14, innCol, 2);

  // --- BRUK-display ---
  ctx.fillStyle = '#0c0e10';
  ctx.fillRect(106, 4, 92, 26);
  ctx.strokeRect(106.5, 4.5, 91, 25);
  drawText('BRUK:', 110, 7, '#8a96a4', 1);
  const d = diff();
  const useCol = incoming === 0 ? '#6a7684' : (d === 0 ? '#60ff80' : (d > 0 ? '#ff6060' : '#60b0ff'));
  drawText(consumption() + 'W', 110, 14, useCol, 2);

  // --- Frekvensmåler ---
  ctx.fillStyle = '#0c0e10';
  ctx.fillRect(204, 4, 108, 26);
  ctx.strokeRect(204.5, 4.5, 107, 25);
  const gx = 232, gy = 26;
  const hz = incoming === 0 ? 50 : clamp(50 - d * 0.005 + (d !== 0 ? rnd(-0.03, 0.03) : 0), 48, 52);
  // Skala
  ctx.strokeStyle = '#4a525c';
  for (let i = -2; i <= 2; i++) {
    const ang = -Math.PI / 2 + i * 0.5;
    ctx.beginPath();
    ctx.moveTo(gx + Math.cos(ang) * 14, gy + Math.sin(ang) * 14);
    ctx.lineTo(gx + Math.cos(ang) * 17, gy + Math.sin(ang) * 17);
    ctx.stroke();
  }
  // Nål
  const nAng = -Math.PI / 2 + (hz - 50) * 0.5;
  ctx.strokeStyle = Math.abs(hz - 50) < 0.05 ? '#60ff80' : '#ff6060';
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(nAng) * 15, gy + Math.sin(nAng) * 15);
  ctx.stroke();
  drawText(hz.toFixed(2) + 'HZ', 252, 11, Math.abs(hz - 50) < 0.05 ? '#60ff80' : '#ff9060', 1);
  drawText('NETTFREKVENS', 252, 20, '#5a6472', 1);

  // Blinkende panellamper (pynt)
  for (let i = 0; i < 5; i++) {
    const lit = (frame >> 4) % 5 === i;
    ctx.fillStyle = lit ? ['#ff6060', '#ffd040', '#60ff80', '#60b0ff', '#e080ff'][i] : '#2a3038';
    ctx.fillRect(206 + i * 6, 32, 3, 3);
  }

  // --- Ticker / varsel-stripe ---
  ctx.fillStyle = '#10131a';
  ctx.fillRect(0, 31, 200, 9);
  if (nextTarget !== null && state === 'play') {
    if (Math.floor(warnT * 6) % 2 === 0) {
      drawText('NESTE: ' + nextTarget + 'W OM ' + Math.ceil(warnT), 100, 33, '#ffd040', 1, 'center');
    }
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 31, 200, 9);
    ctx.clip();
    drawText(tickerMsg, Math.round(tickerX), 33, '#5a90b8', 1);
    ctx.restore();
  }
}

function drawStatus() {
  // Balansestatus midt i rommet, rett under panelet
  if (state !== 'play' && state !== 'pause') return;
  const d = diff();
  if (incoming === 0) {
    drawText('VENTER PÅ PROGNOSE...', VW / 2, 43, '#8a96a4', 1, 'center');
  } else if (d === 0) {
    if ((frame >> 4) % 2 === 0) drawText('I BALANSE!', VW / 2, 43, '#60ff80', 1, 'center');
  } else if (d < 0) {
    drawText('BRUK ' + (-d) + 'W MER!', VW / 2, 43, '#60b0ff', 1, 'center');
  } else {
    drawText('BRUK ' + d + 'W MINDRE!', VW / 2, 43, '#ff6060', 1, 'center');
  }
}

/* --- Apparat-sprites --- */
function drawAppliance(a) {
  const { x, y, w, h } = a;
  const wob = a.on && a.type === 'stovsuger' ? Math.round(rnd(-1, 1)) : 0;

  // Glød når på
  if (a.on) {
    ctx.fillStyle = 'rgba(255,230,120,0.10)';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.max(w, h) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(wob, 0);

  switch (a.type) {
    case 'kjoleskap': {
      box(x, y, w, h, '#dcdcd4', '#a8a8a0');
      ctx.fillStyle = '#a8a8a0';
      ctx.fillRect(x + 2, y + 10, w - 4, 1);
      ctx.fillStyle = '#788078';
      ctx.fillRect(x + w - 5, y + 4, 2, 5);
      ctx.fillRect(x + w - 5, y + 13, 2, 8);
      break;
    }
    case 'vaskemaskin': {
      box(x, y, w, h, '#e4e4dc', '#aaaaa2');
      ctx.fillStyle = '#303840';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 + 2, 6, 0, Math.PI * 2);
      ctx.fill();
      if (a.on) {
        const ang = a.anim * 9;
        ctx.fillStyle = '#9ad0ff';
        ctx.fillRect(x + w / 2 + Math.cos(ang) * 3 - 1, y + h / 2 + 2 + Math.sin(ang) * 3 - 1, 3, 3);
      }
      ctx.fillStyle = '#787870';
      ctx.fillRect(x + 2, y + 2, w - 4, 2);
      break;
    }
    case 'panelovn': {
      box(x, y, w, h, '#e8e8e0', '#b0b0a8');
      ctx.fillStyle = '#b8b8b0';
      for (let i = 2; i < w - 2; i += 4) ctx.fillRect(x + i, y + 3, 2, h - 6);
      if (a.on) {
        const g = 0.25 + 0.15 * Math.sin(a.anim * 4);
        ctx.fillStyle = 'rgba(255,90,30,' + g + ')';
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        ctx.fillStyle = 'rgba(255,150,60,0.5)';
        ctx.fillRect(x + 2, y - 1, w - 4, 1);
      }
      break;
    }
    case 'bereder': {
      // Varmtvannsbereder (som i sketsjen!)
      ctx.fillStyle = '#d8d8d0';
      ctx.fillRect(x + 2, y + 3, w - 4, h - 3);
      ctx.fillRect(x + 4, y, w - 8, 4);
      ctx.fillStyle = '#a4a49c';
      ctx.fillRect(x + 2, y + h - 2, w - 4, 2);
      ctx.fillRect(x + w - 6, y + 3, 2, h - 5);
      ctx.fillStyle = '#888880';
      ctx.fillRect(x + w / 2 - 1, y - 4, 2, 5); // rør
      if (a.on) {
        ctx.fillStyle = '#ff5040';
        ctx.fillRect(x + 5, y + 6, 3, 3);
        if (frame % 14 < 7) {
          ctx.fillStyle = 'rgba(220,230,240,0.6)';
          ctx.fillRect(x + w / 2 - 2, y - 8, 2, 2);
          ctx.fillRect(x + w / 2 + 1, y - 11, 2, 2);
        }
      } else {
        ctx.fillStyle = '#606058';
        ctx.fillRect(x + 5, y + 6, 3, 3);
      }
      break;
    }
    case 'tv': {
      box(x, y + 3, w, h - 3, '#403830', '#282018');
      ctx.fillStyle = a.on ? '#80c8ff' : '#181c20';
      ctx.fillRect(x + 2, y + 5, w - 8, h - 9);
      if (a.on) {
        ctx.fillStyle = ['#ffffff', '#ffe060', '#60ff80', '#ff6060'][(frame >> 3) % 4];
        ctx.fillRect(x + 3 + (frame % (w - 10)), y + 6, 2, h - 11);
      }
      ctx.fillStyle = '#585048';
      ctx.fillRect(x + w - 5, y + 6, 3, 2);
      ctx.fillRect(x + w - 5, y + 10, 3, 2);
      // Antenne
      ctx.fillStyle = '#888';
      ctx.fillRect(x + 4, y, 1, 4);
      ctx.fillRect(x + 8, y, 1, 4);
      break;
    }
    case 'stovsuger': {
      ctx.fillStyle = '#b04040';
      ctx.fillRect(x + 2, y + 6, w - 4, h - 8);
      ctx.fillStyle = '#8a3030';
      ctx.fillRect(x + 2, y + h - 4, w - 4, 2);
      ctx.fillStyle = '#d0d0c8';
      ctx.fillRect(x + 4, y + 8, w - 8, 3);
      // Slange
      ctx.strokeStyle = '#585048';
      ctx.beginPath();
      ctx.moveTo(x + w - 3, y + 8);
      ctx.quadraticCurveTo(x + w + 5, y + 2, x + w + 2, y - 2);
      ctx.stroke();
      if (a.on && frame % 6 < 3) {
        ctx.fillStyle = 'rgba(180,170,150,0.5)';
        ctx.fillRect(x + w + 1, y - 5, 2, 2);
      }
      break;
    }
    case 'vifte': {
      ctx.fillStyle = '#787880';
      ctx.fillRect(x + w / 2 - 1, y + 8, 3, h - 10);
      ctx.fillRect(x + 3, y + h - 3, w - 6, 3);
      ctx.fillStyle = '#c8c8d0';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 7, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#383840';
      if (a.on) {
        const ang = a.anim * 14;
        for (let i = 0; i < 3; i++) {
          const aa = ang + i * 2.09;
          ctx.fillRect(x + w / 2 + Math.cos(aa) * 4 - 1, y + 7 + Math.sin(aa) * 4 - 1, 2, 2);
        }
      } else {
        ctx.fillRect(x + w / 2 - 1, y + 3, 2, 3);
        ctx.fillRect(x + w / 2 - 4, y + 8, 3, 2);
        ctx.fillRect(x + w / 2 + 2, y + 8, 3, 2);
      }
      break;
    }
    case 'radio': {
      box(x, y, w, h, '#8a5c34', '#6a4424');
      ctx.fillStyle = '#3a2c1c';
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 3, y + 3 + i * 3, 8, 1);
      ctx.fillStyle = a.on ? '#60ff80' : '#3a2c1c';
      ctx.fillRect(x + w - 6, y + 3, 3, 3);
      ctx.fillStyle = '#caa';
      ctx.fillRect(x + w - 6, y + 8, 3, 3);
      if (a.on && frame % 30 < 4) {
        drawText('!', x + w + 2, y - 6, '#80e8ff', 1);
      }
      break;
    }
    case 'lampe': {
      // Bord
      ctx.fillStyle = '#7a5c38';
      ctx.fillRect(x, y + 12, w, 4);
      ctx.fillStyle = '#5c4226';
      ctx.fillRect(x + 1, y + 16, 2, h - 16);
      ctx.fillRect(x + w - 3, y + 16, 2, h - 16);
      // Lampe
      ctx.fillStyle = '#888890';
      ctx.fillRect(x + w / 2 - 1, y + 5, 2, 8);
      ctx.fillStyle = a.on ? '#ffe060' : '#a8a050';
      ctx.fillRect(x + w / 2 - 4, y, 8, 6);
      if (a.on) {
        ctx.fillStyle = 'rgba(255,230,100,0.25)';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 4, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'klokke': {
      // Bord
      ctx.fillStyle = '#7a5c38';
      ctx.fillRect(x, y + 10, w, 4);
      ctx.fillStyle = '#5c4226';
      ctx.fillRect(x + 1, y + 14, 2, h - 14);
      ctx.fillRect(x + w - 3, y + 14, 2, h - 14);
      // Klokkeradio
      ctx.fillStyle = '#303038';
      ctx.fillRect(x + 2, y + 3, w - 4, 8);
      if (a.on) {
        const t = Math.floor(a.anim) % 2 === 0;
        drawText(t ? '12:00' : '12 00', x + w / 2, y + 5, '#60ff80', 1, 'center');
      } else {
        ctx.fillStyle = '#181820';
        ctx.fillRect(x + 4, y + 5, w - 8, 4);
      }
      break;
    }
  }
  ctx.restore();

  // Kortslutningsvarsel
  if (a.spark > 0) {
    if (Math.floor(a.spark * 8) % 2 === 0) {
      ctx.strokeStyle = '#ffd040';
      ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
    }
    if ((frame >> 3) % 2 === 0) drawText('!!', x + w / 2, y - 8, '#ffd040', 1, 'center');
  }
  // Fastlåst
  if (a.jam > 0) {
    ctx.strokeStyle = '#ff6060';
    ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
    drawText('LÅST', x + w / 2, y - 8, '#ff6060', 1, 'center');
  }
}

function box(x, y, w, h, light, dark) {
  ctx.fillStyle = dark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = light;
  ctx.fillRect(x, y, w - 1, h - 1);
  ctx.fillStyle = dark;
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
}

function drawApplianceLabels() {
  const near = state === 'play' ? nearestAppliance() : null;
  for (const a of appliances) {
    const below = a.y < 60;
    const ly = below ? a.y + a.h + 2 : a.y - 7;
    const col = a.on ? '#60ff80' : '#9aa4b0';
    drawText(a.watt + 'W', a.x + a.w / 2, ly, col, 1, 'center');
    if (a === near) {
      // Marker valgt apparat
      ctx.strokeStyle = '#ffffff';
      if ((frame >> 3) % 2 === 0) ctx.strokeRect(a.x - 1.5, a.y - 1.5, a.w + 3, a.h + 3);
    }
  }
  if (near) {
    const label = near.name + ' ' + near.watt + 'W [E: ' + (near.on ? 'AV' : 'PÅ') + ']';
    drawText(label, VW / 2, VH - 24, '#ffffff', 1, 'center');
  }
}

function drawPlayer() {
  const px = Math.round(player.x), py = Math.round(player.y);
  const step = player.moving ? Math.floor(player.anim) % 2 : 0;
  // Skygge
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(px - 4, py + 2, 8, 3);
  // Bein
  ctx.fillStyle = '#3a5890';
  if (step === 0) {
    ctx.fillRect(px - 3, py - 2, 3, 6);
    ctx.fillRect(px + 1, py - 2, 3, 6);
  } else {
    ctx.fillRect(px - 3, py - 3, 3, 6);
    ctx.fillRect(px + 1, py - 1, 3, 6);
  }
  // Kropp (svart singlet, som i sketsjen)
  ctx.fillStyle = '#22262a';
  ctx.fillRect(px - 4, py - 9, 8, 7);
  // Armer
  ctx.fillStyle = '#e8b088';
  ctx.fillRect(px - 6, py - 9 + (step ? 1 : 0), 2, 5);
  ctx.fillRect(px + 4, py - 9 + (step ? 0 : 1), 2, 5);
  // Hode
  ctx.fillStyle = '#e8b088';
  ctx.fillRect(px - 3, py - 15, 6, 6);
  // Hår
  ctx.fillStyle = '#2c2018';
  ctx.fillRect(px - 3, py - 16, 6, 2);
  ctx.fillRect(px - 4, py - 15, 1, 3);
  ctx.fillRect(px + 3, py - 15, 1, 3);
  // Øyne
  ctx.fillStyle = '#101418';
  if (player.face > 0) ctx.fillRect(px + 1, py - 13, 1, 1);
  else ctx.fillRect(px - 2, py - 13, 1, 1);
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = p.col;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
  }
}

function drawFloats() {
  for (const f of floats) {
    if (f.t < 0.4 && Math.floor(f.t * 10) % 2 === 0) continue;
    drawText(f.text, Math.round(f.x), Math.round(f.y), f.col, 1, 'center');
  }
}

function drawHUD() {
  ctx.fillStyle = 'rgba(8,10,14,0.85)';
  ctx.fillRect(0, VH - 14, VW, 14);
  drawText('POENG ' + Math.floor(score), 6, VH - 10, '#ffe060', 1);
  drawText('NIVÅ ' + level, VW - 6, VH - 10, '#80e8ff', 1, 'right');

  // Stabilitetsmåler
  const bw = 80, bx = VW / 2 - bw / 2, by = VH - 10;
  drawText('NETT', bx - 4, by, '#9aa4b0', 1, 'right');
  ctx.fillStyle = '#22262e';
  ctx.fillRect(bx, by, bw, 5);
  const fill = Math.round(bw * stability / 100);
  ctx.fillStyle = stability > 60 ? '#60ff80' : stability > 30 ? '#ffd040' : '#ff6060';
  if (stability > 30 || (frame >> 3) % 2 === 0) ctx.fillRect(bx, by, fill, 5);
  ctx.strokeStyle = '#4a525c';
  ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, 6);

  if (muted) drawText('LYD AV (M)', VW - 6, VH - 22, '#5a6472', 1, 'right');
}

/* --- Skjermer --- */
function drawTitle() {
  ctx.fillStyle = 'rgba(6,8,14,0.88)';
  ctx.fillRect(0, 0, VW, VH);

  // Lynlogo
  const t = frame * 0.05;
  ctx.fillStyle = '#ffd040';
  const lx = VW / 2, ly = 26 + Math.sin(t) * 2;
  ctx.beginPath();
  ctx.moveTo(lx + 2, ly); ctx.lineTo(lx - 5, ly + 13); ctx.lineTo(lx - 1, ly + 13);
  ctx.lineTo(lx - 3, ly + 24); ctx.lineTo(lx + 6, ly + 10); ctx.lineTo(lx + 1, ly + 10);
  ctx.closePath(); ctx.fill();

  drawText('STRØMBALLETTEN', VW / 2, 62, '#ffe060', 2, 'center');
  drawText('ET KRAFTDRAMA I FLERE AKTER', VW / 2, 80, '#8a96a4', 1, 'center');

  drawText('OVERSKUDDSKRAFTEN MÅ BRUKES OPP.', VW / 2, 102, '#c8d0d8', 1, 'center');
  drawText('SKRU APPARATER AV OG PÅ SLIK AT', VW / 2, 112, '#c8d0d8', 1, 'center');
  drawText('FORBRUKET MATCHER PROGNOSEN.', VW / 2, 122, '#c8d0d8', 1, 'center');
  drawText('NORGE STOLER PÅ DEG.', VW / 2, 132, '#ffd040', 1, 'center');

  drawText('PILER/WASD: LØP', VW / 2, 152, '#80e8ff', 1, 'center');
  drawText('E ELLER MELLOMROM: SKRU AV/PÅ', VW / 2, 162, '#80e8ff', 1, 'center');
  drawText('P: PAUSE   M: LYD', VW / 2, 172, '#80e8ff', 1, 'center');

  if ((frame >> 5) % 2 === 0) drawText('TRYKK ENTER FOR Å STARTE VAKTA', VW / 2, 196, '#ffffff', 1, 'center');
  if (hiscore > 0) drawText('REKORD: ' + hiscore, VW / 2, 214, '#ffe060', 1, 'center');
}

function drawPause() {
  ctx.fillStyle = 'rgba(6,8,14,0.7)';
  ctx.fillRect(0, 0, VW, VH);
  drawText('PAUSE', VW / 2, 105, '#ffffff', 2, 'center');
  drawText('KRAFTSYSTEMET VENTER PÅ DEG', VW / 2, 126, '#8a96a4', 1, 'center');
  drawText('TRYKK P FOR Å FORTSETTE', VW / 2, 138, '#80e8ff', 1, 'center');
}

function drawGameOver() {
  const dark = Math.min(1, blackoutT * 1.5);
  ctx.fillStyle = 'rgba(0,0,4,' + (0.95 * dark) + ')';
  ctx.fillRect(0, 0, VW, VH);
  if (blackoutT < 0.8) return;

  if ((frame >> 4) % 2 === 0) drawText('BLACKOUT!', VW / 2, 70, '#ff6060', 3, 'center');
  drawText('HELE LANDET ER MØRKLAGT.', VW / 2, 102, '#c8d0d8', 1, 'center');
  drawText('DU HOLDT NETTET I ' + Math.floor(playTime) + ' SEKUNDER.', VW / 2, 114, '#c8d0d8', 1, 'center');
  drawText('POENG: ' + Math.floor(score), VW / 2, 134, '#ffe060', 2, 'center');
  if (Math.floor(score) >= hiscore && hiscore > 0) {
    drawText('NY REKORD!', VW / 2, 152, '#60ff80', 1, 'center');
  } else if (hiscore > 0) {
    drawText('REKORD: ' + hiscore, VW / 2, 152, '#8a96a4', 1, 'center');
  }
  if (blackoutT > 1.6 && (frame >> 5) % 2 === 0) {
    drawText('TRYKK R FOR NY VAKT', VW / 2, 180, '#ffffff', 1, 'center');
  }
}

/* ---------------- HOVEDLØKKE ---------------- */
if (location.hash === '#play') { reset(); state = 'play'; }

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
