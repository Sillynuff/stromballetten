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
  dash:    () => { tone(180, 0.16, 'square', 0.10, 0, 720); },
};

/* ---------------- MUSIKK ---------------- */
// A-moll. Bass i 16 steg, melodi (pentaton) i 32 steg. 0 = pause.
const MUS_BASS = [
  110, 0, 110, 0, 130.81, 0, 130.81, 0,
  87.31, 0, 87.31, 0, 98, 0, 82.41, 0,
];
const MUS_LEAD = [
  440, 0, 523.25, 587.33, 659.25, 0, 0, 587.33,
  523.25, 0, 440, 0, 0, 0, 392, 0,
  440, 0, 523.25, 0, 659.25, 0, 783.99, 0,
  659.25, 0, 587.33, 523.25, 440, 0, 0, 0,
];
let musStep = 0, musNext = 0;
function updateMusic() {
  if (!actx || muted) { musNext = 0; return; }
  if (state === 'over' || state === 'pause') { musNext = 0; return; }
  const title = state === 'title';
  const stepLen = title ? 0.28 : 0.14 / (1 + 0.04 * (level - 1));
  if (musNext === 0 || musNext < actx.currentTime - 0.5) musNext = actx.currentTime + 0.05;
  while (musNext < actx.currentTime + 0.2) {
    const delay = Math.max(0, musNext - actx.currentTime);
    const b = MUS_BASS[musStep % MUS_BASS.length];
    if (b) tone(b, stepLen * 0.9, 'triangle', 0.05, delay);
    if (!title) {
      const l = MUS_LEAD[musStep % MUS_LEAD.length];
      if (l) tone(l, stepLen * 0.85, 'square', 0.03, delay);
    }
    musStep++;
    musNext += stepLen;
  }
}

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
  ].map(a => Object.assign(a, { on: false, spark: 0, jam: 0, anim: 0, flash: 0 }));
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
let playerCount = 1;
let menuSel = 0;

function mkPlayer(x, y, idx) {
  return {
    x, y, idx, anim: 0, face: 1, moving: false, sprintT: 0, sprintCd: 0,
    cols: idx === 0
      ? { singlet: '#22262a', hair: '#2c2018', skin: '#e8b088', pants: '#3a5890' }
      : { singlet: '#e8e8e0', hair: '#d8b048', skin: '#e8b088', pants: '#705038' },
  };
}
let players = [mkPlayer(160, 185, 0)];
let incoming = 0, nextTarget = null, warnT = 0, changeT = 0, lastWarnBeep = 99;
let sinceChange = 0, hadImbalance = false, perfectAwarded = true;
let stability = 100, score = 0, hiscore = 0, combo = 0;
let level = 1, levelT = 0, playTime = 0;
let chaosT = 12, trollT = 14;
let banner = '', bannerT = 0;
let changeFlash = 0, shakeT = 0, shakeMag = 0, flickerT = 0;
let flashT = 0, scoreFlashT = 0;
let blackoutT = 0, slukkT = 0, slukkN = 0;
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

function changeInterval() {
  return Math.max(8, 18 - level * 1.2) * (playerCount === 2 ? 0.85 : 1);
}

function levelSubsetRange() {
  let r;
  if (level <= 1) r = [1, 2];
  else if (level <= 3) r = [2, 3];
  else if (level === 4) r = [2, 4];
  else if (level === 5) r = [3, 4];
  else r = [3, 5];
  // To par hender takler større regnestykker
  if (playerCount === 2) r = [Math.min(r[0] + 1, r[1]), Math.min(6, r[1] + 1)];
  return r;
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
  players = playerCount === 2
    ? [mkPlayer(130, 185, 0), mkPlayer(190, 185, 1)]
    : [mkPlayer(160, 185, 0)];
  incoming = 0; nextTarget = null; warnT = 0; changeT = 4; lastWarnBeep = 99;
  sinceChange = 0; hadImbalance = false; perfectAwarded = true;
  stability = 100; score = 0; combo = 0;
  level = 1; levelT = 0; playTime = 0;
  chaosT = rnd(10, 15); trollT = rnd(12, 18);
  banner = ''; bannerT = 0;
  changeFlash = 0; shakeT = 0; flickerT = 0; flashT = 0; scoreFlashT = 0;
  blackoutT = 0; slukkT = 0; slukkN = 0;
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

  if (state === 'title') {
    if (k === 'arrowup' || k === 'arrowdown' || k === 'w' || k === 's') {
      menuSel = 1 - menuSel; SFX.warn();
    } else if (k === '1' || k === '2' || k === 'enter' || k === ' ') {
      if (k === '1') menuSel = 0;
      if (k === '2') menuSel = 1;
      playerCount = menuSel + 1;
      reset(); state = 'play'; SFX.levelup();
    }
    return;
  }
  if (state === 'over' && k === 'r') {
    reset(); state = 'play'; SFX.levelup(); return;
  }
  if (k === 'p' && (state === 'play' || state === 'pause')) {
    state = state === 'play' ? 'pause' : 'play'; return;
  }
  if (state === 'play') {
    if (k === 'e' || k === ' ') tryToggle(players[0]);
    if (playerCount === 2 && k === 'enter') tryToggle(players[1]);
    if (k === 'shift') {
      // Venstre Shift = spiller 1, høyre Shift = spiller 2
      const p = playerCount === 2 && e.location === 2 ? players[1] : players[0];
      trySprint(p);
    }
  }
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

/* ---------------- TOUCH-KONTROLLER ---------------- */
// Mobil/nettbrett (finger som primærpeker) får touch-UI fra start.
// Laptop med berøringsskjerm starter med tastaturoppsett, men bytter
// i det øyeblikket skjermen faktisk berøres.
// Forseres med #playtouch for testing i DevTools-emulering.
let isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches)
  || location.hash.includes('touch');
const stick = { id: null, bx: 0, by: 0, dx: 0, dy: 0 };
const BTN_TOGGLE = { x: 288, y: 194, r: 20 };
const BTN_SPRINT = { x: 242, y: 212, r: 13 };

/* ---------------- KAMERA OG SKJERM ----------------
   Desktop: canvas er 320x240, zoom 1, fast kamera — som alltid.
   Mobil: canvas fyller hele viewporten, kameraet zoomer inn og
   følger spilleren. SW/SH er skjermstørrelsen i virtuelle piksler,
   VW/VH er fortsatt verdens (rommets) størrelse. */
let SW = VW, SH = VH, zoom = 1;
const cam = { x: 0, y: 0 };

function layoutCanvas() {
  if (!isTouch) {
    SW = VW; SH = VH; zoom = 1; cam.x = 0; cam.y = 0;
    cv.width = SW; cv.height = SH;
    cv.style.width = ''; cv.style.height = '';
  } else {
    const aspect = innerWidth / innerHeight;
    if (aspect >= 1) { SH = 240; SW = Math.round(240 * aspect); }
    else { SW = 240; SH = Math.round(240 / aspect); }
    zoom = Math.max(SW / VW, SH / VH);
    cv.width = SW; cv.height = SH;
    cv.style.width = '100vw'; cv.style.height = '100vh';
    BTN_TOGGLE.x = SW - 30; BTN_TOGGLE.y = SH - 48;
    BTN_SPRINT.x = SW - 74; BTN_SPRINT.y = SH - 30;
  }
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', layoutCanvas);

function updateCamera(dt) {
  const vw = SW / zoom, vh = SH / zoom;
  let tx, ty;
  if (state === 'play' || state === 'pause') {
    const fx = players.reduce((s, p) => s + p.x, 0) / players.length;
    const fy = players.reduce((s, p) => s + p.y, 0) / players.length;
    tx = clamp(fx - vw / 2, 0, VW - vw);
    ty = clamp(fy - vh / 2, 0, VH - vh);
  } else {
    tx = (VW - vw) / 2; ty = (VH - vh) / 2;
  }
  const k = Math.min(1, 10 * dt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
}

function touchPos(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * SW / r.width, y: (e.clientY - r.top) * SH / r.height };
}

function uiOy() { return Math.max(0, Math.floor((SH - 240) / 2)); }

cv.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch' && !isTouch) { isTouch = true; layoutCanvas(); }
  if (!isTouch) return;
  e.preventDefault();
  cv.setPointerCapture(e.pointerId);
  audioInit();
  const pos = touchPos(e);

  if (state === 'title') {
    // Første trykk velger, andre trykk på samme valg starter
    const oy = uiOy();
    for (let i = 0; i < 2; i++) {
      if (pos.y >= oy + 140 + i * 11 && pos.y < oy + 151 + i * 11) {
        if (menuSel === i) {
          playerCount = i + 1;
          reset(); state = 'play'; SFX.levelup();
        } else {
          menuSel = i; SFX.warn();
        }
      }
    }
    return;
  }
  if (state === 'over') {
    if (blackoutT > 2.2) { reset(); state = 'play'; SFX.levelup(); }
    return;
  }
  if (state !== 'play') return;

  const dT = Math.hypot(pos.x - BTN_TOGGLE.x, pos.y - BTN_TOGGLE.y);
  const dS = Math.hypot(pos.x - BTN_SPRINT.x, pos.y - BTN_SPRINT.y);
  if (dT < BTN_TOGGLE.r + 6) {
    tryToggle(players[0]);
  } else if (dS < BTN_SPRINT.r + 6) {
    trySprint(players[0]);
  } else if (pos.x < SW * 0.55 && stick.id === null) {
    // Flytende styrespak: dukker opp der fingeren lander
    stick.id = e.pointerId;
    stick.bx = pos.x; stick.by = pos.y;
    stick.dx = 0; stick.dy = 0;
  }
});

cv.addEventListener('pointermove', (e) => {
  if (e.pointerId !== stick.id) return;
  e.preventDefault();
  const pos = touchPos(e);
  let dx = (pos.x - stick.bx) / 14, dy = (pos.y - stick.by) / 14;
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  if (len < 0.25) { dx = 0; dy = 0; }
  stick.dx = dx; stick.dy = dy;
});

function endPointer(e) {
  if (e.pointerId === stick.id) {
    stick.id = null; stick.dx = 0; stick.dy = 0;
  }
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);

function nearestAppliance(p) {
  let best = null, bestD = 1e9;
  for (const a of appliances) {
    const ex = 10;
    if (p.x >= a.x - ex && p.x <= a.x + a.w + ex &&
        p.y >= a.y - ex && p.y <= a.y + a.h + ex) {
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      const d = Math.abs(p.x - cx) + Math.abs(p.y - cy);
      if (d < bestD) { bestD = d; best = a; }
    }
  }
  return best;
}

function tryToggle(p) {
  const a = nearestAppliance(p);
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
  a.flash = 0.15;
  if (a.on) SFX.on(); else SFX.off();
  addSparks(a, 6);
}

function trySprint(p) {
  if (p.sprintCd > 0) return;
  p.sprintT = 1.5;
  p.sprintCd = 4;
  SFX.dash();
}

/* ---------------- OPPDATERING ---------------- */
function update(dt) {
  frame++;
  if (state !== 'play') {
    if (state === 'over') {
      blackoutT += dt;
      // Apparatene slukker ett og ett mens landet mørklegges
      slukkT -= dt;
      if (slukkT <= 0) {
        const a = appliances.find(x => x.on);
        if (a) {
          a.on = false;
          tone(190 - 14 * slukkN, 0.14, 'square', 0.10);
          slukkN++;
        }
        slukkT = 0.14;
      }
      particles = particles.filter(p => {
        p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
        return p.t > 0;
      });
    }
    return;
  }

  playTime += dt;

  // --- Spillerbevegelse ---
  for (const p of players) {
    let dx = 0, dy = 0;
    const wasd = playerCount === 1 || p.idx === 0;
    const arrows = playerCount === 1 || p.idx === 1;
    if ((wasd && keys['a']) || (arrows && keys['arrowleft'])) dx -= 1;
    if ((wasd && keys['d']) || (arrows && keys['arrowright'])) dx += 1;
    if ((wasd && keys['w']) || (arrows && keys['arrowup'])) dy -= 1;
    if ((wasd && keys['s']) || (arrows && keys['arrowdown'])) dy += 1;
    if (p.idx === 0 && stick.id !== null) { dx += stick.dx; dy += stick.dy; }
    const mlen = Math.hypot(dx, dy);
    if (mlen > 1) { dx /= mlen; dy /= mlen; }
    if (p.sprintT > 0) p.sprintT -= dt;
    if (p.sprintCd > 0) p.sprintCd -= dt;
    const sprinting = p.sprintT > 0;
    const speed = sprinting ? 150 : 88;
    p.moving = !!(dx || dy);
    if (dx) p.face = dx > 0 ? 1 : -1;
    if (p.moving) p.anim += dt * (sprinting ? 16 : 10);
    if (sprinting && p.moving && frame % 3 === 0) {
      particles.push({
        x: p.x + rnd(-3, 3), y: p.y + rnd(0, 3),
        vx: -dx * 30 + rnd(-8, 8), vy: -15 + rnd(-8, 8),
        t: rnd(0.2, 0.35), col: '#b8ac98',
      });
    }
    moveAxis(p, dx * speed * dt, 0);
    moveAxis(p, 0, dy * speed * dt);
    p.x = clamp(p.x, 12, 308);
    p.y = clamp(p.y, 52, 220);
  }
  if (players.length === 2) separatePlayers();

  // --- Prognose / mål ---
  sinceChange += dt;
  const d = diff();
  if (incoming > 0 && d !== 0) hadImbalance = true;

  if (nextTarget === null) {
    changeT -= dt;
    if (changeT <= 0) {
      const val = genTarget();
      const surgeP = level >= 4 ? Math.min(0.25, 0.08 * (level - 3)) : 0;
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
    const fx = players.reduce((s, p) => s + p.x, 0) / players.length;
    const fy = players.reduce((s, p) => s + p.y, 0) / players.length;
    addFloat(fx, fy - 14, combo > 1 ? 'BALLETT X' + combo + '! +' + bonus : 'PERFEKT! +' + bonus, '#80e8ff');
    flashT = 0.12;
    scoreFlashT = 0.35;
    for (const p of players) {
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: p.x, y: p.y - 8,
          vx: rnd(-60, 60), vy: rnd(-90, -20),
          t: rnd(0.4, 0.8), col: pick(['#80e8ff', '#ffe060', '#60ff80', '#ff80c0']),
        });
      }
    }
  }
  if (!perfectAwarded && sinceChange >= 5) { combo = 0; perfectAwarded = true; }

  // --- Stabilitet og poeng ---
  // 3 sekunders frist etter hver prognose: du må rekke å løpe dit.
  if (incoming > 0) {
    if (d === 0) {
      stability = Math.min(100, stability + 10 * dt);
      score += 12 * level * dt;
    } else if (sinceChange > 3) {
      let drain = (1.0 + Math.abs(d) * 0.012) * (1 + 0.05 * (level - 1));
      // Fastlåst apparat er ikke din feil: halvert tapping mens det står på.
      if (appliances.some(a => a.jam > 0)) drain *= 0.5;
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
  if (levelT >= 35 && level < 9) {
    level++; levelT = 0;
    banner = 'NIVÅ ' + level + '!'; bannerT = 2;
    SFX.levelup();
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: rnd(40, VW - 40), y: rnd(108, 128),
        vx: rnd(-30, 30), vy: rnd(-60, -10),
        t: rnd(0.4, 0.9), col: pick(['#ffe060', '#80e8ff']),
      });
    }
  }

  // --- Kortslutning (kaos) ---
  if (level >= 2) {
    chaosT -= dt;
    if (chaosT <= 0) {
      chaosT = rnd(12, 20) - level * 0.5;
      const candidates = appliances.filter(a => a.on && !a.jam && !a.spark);
      if (candidates.length) {
        const a = pick(candidates);
        a.spark = 5;
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
        a.jam = 6;
        stability -= 8;
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
  if (level >= 5) {
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
  if (flashT > 0) flashT -= dt;
  if (scoreFlashT > 0) scoreFlashT -= dt;
  for (const a of appliances) if (a.flash > 0) a.flash -= dt;

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
  blackoutT = 0; slukkT = 0.3; slukkN = 0;
  SFX.blackout();
  score = Math.floor(score);
  if (score > hiscore) {
    hiscore = score;
    try { localStorage.setItem('stromballetten_hi', String(hiscore)); } catch (e) {}
  }
}

function moveAxis(p, mx, my) {
  p.x += mx; p.y += my;
  const pw = 4, ph = 4; // halv bredde/høyde på føttene
  for (const a of appliances) {
    if (p.x + pw > a.x && p.x - pw < a.x + a.w &&
        p.y + ph > a.y && p.y - ph < a.y + a.h) {
      if (mx > 0) p.x = a.x - pw;
      else if (mx < 0) p.x = a.x + a.w + pw;
      if (my > 0) p.y = a.y - ph;
      else if (my < 0) p.y = a.y + a.h + ph;
    }
  }
}

function separatePlayers() {
  const [a, b] = players;
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
    if (Math.abs(dx) > Math.abs(dy)) {
      const push = ((8 - Math.abs(dx)) / 2) * (dx >= 0 ? 1 : -1);
      a.x -= push; b.x += push;
    } else {
      const push = ((8 - Math.abs(dy)) / 2) * (dy >= 0 ? 1 : -1);
      a.y -= push; b.y += push;
    }
    for (const p of players) {
      p.x = clamp(p.x, 12, 308);
      p.y = clamp(p.y, 52, 220);
    }
  }
}

/* ---------------- TEGNING ---------------- */
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, SW, SH);

  // --- Verden (under kamera) ---
  ctx.save();
  if (shakeT > 0) {
    ctx.translate(Math.round(rnd(-shakeMag, shakeMag)), Math.round(rnd(-shakeMag, shakeMag)));
  }
  ctx.scale(zoom, zoom);
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
  drawRoom();
  drawPanel();
  for (const a of appliances) drawAppliance(a);
  drawApplianceLabels();
  players.slice().sort((a, b) => a.y - b.y).forEach(drawPlayer);
  drawParticles();
  drawFloats();
  ctx.restore();

  // --- Skjermfast UI ---
  drawMobileBar();
  drawStatus();
  drawHUD();
  drawContextLabel();
  drawTouchControls();

  if (flashT > 0) {
    ctx.fillStyle = 'rgba(140,230,255,' + Math.min(0.35, flashT * 2.5) + ')';
    ctx.fillRect(0, 0, SW, SH);
  }

  if (flickerT > 0 && state === 'play') {
    ctx.fillStyle = 'rgba(0,0,10,0.4)';
    ctx.fillRect(0, 0, SW, SH);
  }

  if (bannerT > 0) {
    const a = Math.min(1, bannerT);
    ctx.fillStyle = 'rgba(10,10,30,' + (0.75 * a) + ')';
    ctx.fillRect(0, SH / 2 - 16, SW, 28);
    if (Math.floor(bannerT * 8) % 2 === 0) {
      drawText(banner, SW / 2, SH / 2 - 6, '#ffe060', 2, 'center');
    }
  }

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
  // Nål (pulserer grønt når nettet er i balanse)
  const nAng = -Math.PI / 2 + (hz - 50) * 0.5;
  ctx.strokeStyle = Math.abs(hz - 50) < 0.05
    ? 'rgba(96,255,128,' + (0.7 + 0.3 * Math.sin(frame * 0.25)) + ')'
    : '#ff6060';
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
  // Balansestatus på desktop — på mobil vises alt i minipanelet
  if (zoom > 1) return;
  if (state !== 'play' && state !== 'pause') return;
  const y = 43;
  const d = diff();
  if (incoming === 0) {
    drawText('VENTER PÅ PROGNOSE...', SW / 2, y, '#8a96a4', 1, 'center');
  } else if (d === 0) {
    drawText('I BALANSE!', SW / 2, y, (frame >> 4) % 2 === 0 ? '#60ff80' : '#a8ffc0', 1, 'center');
  } else if (d < 0) {
    drawText('BRUK ' + (-d) + 'W MER!', SW / 2, y, '#60b0ff', 1, 'center');
  } else {
    drawText('BRUK ' + d + 'W MINDRE!', SW / 2, y, '#ff6060', 1, 'center');
  }
}

function drawMobileBar() {
  // Skjermfast minipanel på mobil: erstatter veggpanelet som kan
  // være utenfor kamera. INN/BRUK med store tall, frekvens og
  // varsel/balansestatus i midten.
  if (zoom <= 1) return;
  if (state !== 'play' && state !== 'pause') return;
  ctx.fillStyle = '#0a0c12';
  ctx.fillRect(0, 0, SW, 26);
  ctx.fillStyle = '#272c34';
  ctx.fillRect(0, 25, SW, 1);

  // INN til venstre
  drawText('INN:', 6, 3, '#8a96a4', 1);
  const innCol = changeFlash > 0 && Math.floor(changeFlash * 10) % 2 === 0 ? '#ffffff' : '#ffd040';
  drawText(incoming + 'W', 6, 10, innCol, 2);

  // BRUK til høyre
  drawText('BRUK:', SW - 6, 3, '#8a96a4', 1, 'right');
  const d = diff();
  const useCol = incoming === 0 ? '#9aa4b0' : (d === 0 ? '#60ff80' : (d > 0 ? '#ff6060' : '#60b0ff'));
  drawText(consumption() + 'W', SW - 6, 10, useCol, 2, 'right');

  // Frekvens øverst i midten
  const hz = incoming === 0 ? 50 : clamp(50 - d * 0.005, 48, 52);
  drawText(hz.toFixed(2) + 'HZ', SW / 2, 3, Math.abs(hz - 50) < 0.05 ? '#60ff80' : '#ff9060', 1, 'center');

  // Varsel eller balansestatus i midten
  if (nextTarget !== null) {
    if (Math.floor(warnT * 6) % 2 === 0) {
      drawText('NESTE: ' + nextTarget + 'W OM ' + Math.ceil(warnT), SW / 2, 13, '#ffd040', 1, 'center');
    }
  } else if (incoming === 0) {
    drawText('VENTER...', SW / 2, 13, '#8a96a4', 1, 'center');
  } else if (d === 0) {
    drawText('I BALANSE!', SW / 2, 13, (frame >> 4) % 2 === 0 ? '#60ff80' : '#a8ffc0', 1, 'center');
  } else if (d < 0) {
    drawText((-d) + 'W MER!', SW / 2, 13, '#60b0ff', 1, 'center');
  } else {
    drawText(d + 'W MINDRE!', SW / 2, 13, '#ff6060', 1, 'center');
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

  // Toggle-blink
  if (a.flash > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, a.flash * 8) + ')';
    ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  }
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

let ctxNears = [];

function drawApplianceLabels() {
  ctxNears = state === 'play' ? players.map(p => nearestAppliance(p)) : [];
  const hiCols = ['#ffffff', '#80e8ff'];
  for (const a of appliances) {
    const below = a.y < 60;
    const ly = below ? a.y + a.h + 2 : a.y - 7;
    const col = a.on ? '#60ff80' : '#9aa4b0';
    drawText(a.watt + 'W', a.x + a.w / 2, ly, col, 1, 'center');
    for (let i = 0; i < ctxNears.length; i++) {
      if (a === ctxNears[i] && (frame >> 3) % 2 === 0) {
        ctx.strokeStyle = hiCols[i];
        ctx.strokeRect(a.x - 1.5, a.y - 1.5, a.w + 3, a.h + 3);
      }
    }
  }
}

function drawContextLabel() {
  // Navnet på apparatet du står ved, nederst på skjermen
  if (state !== 'play') return;
  const hiCols = ['#ffffff', '#80e8ff'];
  const toggleKey = ['E', 'ENTER'];
  if (playerCount === 1) {
    if (ctxNears[0]) {
      const key = isTouch ? 'AV/PÅ' : 'E';
      const label = ctxNears[0].name + ' ' + ctxNears[0].watt + 'W [' + key + ': ' + (ctxNears[0].on ? 'AV' : 'PÅ') + ']';
      drawText(label, SW / 2, SH - 24, '#ffffff', 1, 'center');
    }
  } else {
    for (let i = 0; i < ctxNears.length; i++) {
      if (!ctxNears[i]) continue;
      const label = ctxNears[i].name + ' [' + toggleKey[i] + ': ' + (ctxNears[i].on ? 'AV' : 'PÅ') + ']';
      drawText(label, (i === 0 ? 0.25 : 0.75) * SW, SH - 24, hiCols[i], 1, 'center');
    }
  }
}

function drawPlayer(p) {
  const px = Math.round(p.x), py = Math.round(p.y);
  const step = p.moving ? Math.floor(p.anim) % 2 : 0;
  // Skygge
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(px - 4, py + 2, 8, 3);
  // Bein
  ctx.fillStyle = p.cols.pants;
  if (step === 0) {
    ctx.fillRect(px - 3, py - 2, 3, 6);
    ctx.fillRect(px + 1, py - 2, 3, 6);
  } else {
    ctx.fillRect(px - 3, py - 3, 3, 6);
    ctx.fillRect(px + 1, py - 1, 3, 6);
  }
  // Kropp (singlet, som i sketsjen)
  ctx.fillStyle = p.cols.singlet;
  ctx.fillRect(px - 4, py - 9, 8, 7);
  // Armer
  ctx.fillStyle = p.cols.skin;
  ctx.fillRect(px - 6, py - 9 + (step ? 1 : 0), 2, 5);
  ctx.fillRect(px + 4, py - 9 + (step ? 0 : 1), 2, 5);
  // Hode
  ctx.fillStyle = p.cols.skin;
  ctx.fillRect(px - 3, py - 15, 6, 6);
  // Hår
  ctx.fillStyle = p.cols.hair;
  ctx.fillRect(px - 3, py - 16, 6, 2);
  ctx.fillRect(px - 4, py - 15, 1, 3);
  ctx.fillRect(px + 3, py - 15, 1, 3);
  // Øyne
  ctx.fillStyle = '#101418';
  if (p.face > 0) ctx.fillRect(px + 1, py - 13, 1, 1);
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
  ctx.fillRect(0, SH - 14, SW, 14);
  const scoreCol = scoreFlashT > 0 && Math.floor(scoreFlashT * 12) % 2 === 0 ? '#ffffff' : '#ffe060';
  drawText('POENG ' + Math.floor(score), 6, SH - 10, scoreCol, 1);
  drawText('NIVÅ ' + level, SW - 6, SH - 10, '#80e8ff', 1, 'right');

  // Stabilitetsmåler
  const bw = SW < 280 ? 50 : 80, bx = SW / 2 - bw / 2, by = SH - 10;
  drawText('NETT', bx - 4, by, '#9aa4b0', 1, 'right');
  ctx.fillStyle = '#22262e';
  ctx.fillRect(bx, by, bw, 5);
  const fill = Math.round(bw * stability / 100);
  ctx.fillStyle = stability > 60 ? '#60ff80' : stability > 30 ? '#ffd040' : '#ff6060';
  if (stability > 30 || (frame >> 3) % 2 === 0) ctx.fillRect(bx, by, fill, 5);
  ctx.strokeStyle = '#4a525c';
  ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, 6);

  // Sprintindikator(er)
  if (playerCount === 1) {
    drawSprintMeter(players[0], SW / 2 + bw / 2 + 12, 26, '');
  } else {
    drawSprintMeter(players[0], SW / 2 + bw / 2 + 6, 18, '1');
    drawSprintMeter(players[1], SW / 2 + bw / 2 + 44, 18, '2');
  }

  if (muted) drawText('LYD AV (M)', SW - 6, SH - 22, '#5a6472', 1, 'right');
}

function drawSprintMeter(p, sx, barW, label) {
  const sy = SH - 9;
  const sprinting = p.sprintT > 0;
  const ready = p.sprintCd <= 0;
  if (label) { drawText(label, sx - 1, sy - 2, '#9aa4b0', 1); sx += 5; }
  drawBolt(sx, sy - 2, ready || sprinting ? '#ffd040' : '#4a525c');
  ctx.fillStyle = '#22262e';
  ctx.fillRect(sx + 7, sy, barW, 3);
  if (sprinting) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 7, sy, Math.round(barW * p.sprintT / 1.5), 3);
  } else {
    ctx.fillStyle = ready ? '#ffd040' : '#7a6830';
    ctx.fillRect(sx + 7, sy, Math.round(barW * (1 - Math.max(0, p.sprintCd) / 4)), 3);
  }
}

function drawBolt(x, y, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x + 2, y, 2, 3);
  ctx.fillRect(x + 1, y + 2, 3, 2);
  ctx.fillRect(x + 2, y + 4, 2, 3);
}

function drawTouchControls() {
  if (!isTouch || state !== 'play') return;
  // Styrespak (kun synlig mens den brukes)
  if (stick.id !== null) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(stick.bx, stick.by, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(stick.bx + stick.dx * 11, stick.by + stick.dy * 11, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // AV/PÅ-knapp
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#1c2026';
  ctx.beginPath(); ctx.arc(BTN_TOGGLE.x, BTN_TOGGLE.y, BTN_TOGGLE.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a96a4';
  ctx.beginPath(); ctx.arc(BTN_TOGGLE.x, BTN_TOGGLE.y, BTN_TOGGLE.r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.9;
  drawText('AV/PÅ', BTN_TOGGLE.x, BTN_TOGGLE.y - 2, '#ffffff', 1, 'center');
  // Sprintknapp
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#1c2026';
  ctx.beginPath(); ctx.arc(BTN_SPRINT.x, BTN_SPRINT.y, BTN_SPRINT.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a96a4';
  ctx.beginPath(); ctx.arc(BTN_SPRINT.x, BTN_SPRINT.y, BTN_SPRINT.r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.9;
  drawBolt(BTN_SPRINT.x - 2, BTN_SPRINT.y - 4,
    players[0].sprintCd <= 0 || players[0].sprintT > 0 ? '#ffd040' : '#4a525c');
  ctx.globalAlpha = 1;
}

/* --- Skjermer --- */
function drawTitle() {
  ctx.fillStyle = 'rgba(6,8,14,0.88)';
  ctx.fillRect(0, 0, SW, SH);
  const cx = SW / 2, oy = uiOy();

  // Lynlogo
  const t = frame * 0.05;
  ctx.fillStyle = '#ffd040';
  const lx = cx, ly = oy + 26 + Math.sin(t) * 2;
  ctx.beginPath();
  ctx.moveTo(lx + 2, ly); ctx.lineTo(lx - 5, ly + 13); ctx.lineTo(lx - 1, ly + 13);
  ctx.lineTo(lx - 3, ly + 24); ctx.lineTo(lx + 6, ly + 10); ctx.lineTo(lx + 1, ly + 10);
  ctx.closePath(); ctx.fill();

  drawText('STRØMBALLETTEN', cx, oy + 62, '#ffe060', 2, 'center');
  drawText('ET KRAFTDRAMA I FLERE AKTER', cx, oy + 80, '#8a96a4', 1, 'center');

  drawText('OVERSKUDDSKRAFTEN MÅ BRUKES OPP.', cx, oy + 102, '#c8d0d8', 1, 'center');
  drawText('SKRU APPARATER AV OG PÅ SLIK AT', cx, oy + 112, '#c8d0d8', 1, 'center');
  drawText('FORBRUKET MATCHER PROGNOSEN.', cx, oy + 122, '#c8d0d8', 1, 'center');
  drawText('NORGE STOLER PÅ DEG.', cx, oy + 132, '#ffd040', 1, 'center');

  // Modusvalg
  const opts = ['EN SPILLER', 'TO SPILLERE'];
  for (let i = 0; i < 2; i++) {
    const sel = menuSel === i;
    drawText(opts[i], cx, oy + 146 + i * 11, sel ? '#ffffff' : '#5a6472', 1, 'center');
    if (sel) {
      drawBolt(cx - textW(opts[i], 1) / 2 - 11, oy + 145 + i * 11,
        (frame >> 4) % 2 === 0 ? '#ffd040' : '#7a6830');
    }
  }

  if (isTouch) {
    drawText('STYRESPAK: VENSTRE HALVDEL', cx, oy + 176, '#80e8ff', 1, 'center');
    drawText('KNAPPER: NEDE TIL HØYRE', cx, oy + 186, '#80e8ff', 1, 'center');
  } else if (menuSel === 0) {
    drawText('WASD/PILER: LØP   SHIFT: SPRINT', cx, oy + 176, '#80e8ff', 1, 'center');
    drawText('E/MELLOMROM: AV/PÅ   P: PAUSE', cx, oy + 186, '#80e8ff', 1, 'center');
  } else {
    drawText('S1: WASD + E + V.SHIFT', cx, oy + 176, '#80e8ff', 1, 'center');
    drawText('S2: PILER + ENTER + H.SHIFT', cx, oy + 186, '#80e8ff', 1, 'center');
  }

  if ((frame >> 5) % 2 === 0) {
    drawText(isTouch ? 'TRYKK TO GANGER PÅ ET VALG' : 'TRYKK ENTER FOR Å STARTE VAKTA', cx, oy + 202, '#ffffff', 1, 'center');
  }
  if (hiscore > 0) drawText('REKORD: ' + hiscore, cx, oy + 214, '#ffe060', 1, 'center');
}

function drawPause() {
  ctx.fillStyle = 'rgba(6,8,14,0.7)';
  ctx.fillRect(0, 0, SW, SH);
  const cx = SW / 2, oy = uiOy();
  drawText('PAUSE', cx, oy + 105, '#ffffff', 2, 'center');
  drawText('KRAFTSYSTEMET VENTER PÅ DEG', cx, oy + 126, '#8a96a4', 1, 'center');
  drawText('TRYKK P FOR Å FORTSETTE', cx, oy + 138, '#80e8ff', 1, 'center');
}

function drawGameOver() {
  const dark = Math.min(1, blackoutT * 0.8);
  ctx.fillStyle = 'rgba(0,0,4,' + (0.95 * dark) + ')';
  ctx.fillRect(0, 0, SW, SH);
  if (blackoutT < 1.4) return;
  const cx = SW / 2, oy = uiOy();

  if ((frame >> 4) % 2 === 0) drawText('BLACKOUT!', cx, oy + 70, '#ff6060', 3, 'center');
  drawText('HELE LANDET ER MØRKLAGT.', cx, oy + 102, '#c8d0d8', 1, 'center');
  const subj = playerCount === 2 ? 'DERE' : 'DU';
  drawText(subj + ' HOLDT NETTET I ' + Math.floor(playTime) + ' SEKUNDER.', cx, oy + 114, '#c8d0d8', 1, 'center');
  drawText('POENG: ' + Math.floor(score), cx, oy + 134, '#ffe060', 2, 'center');
  if (Math.floor(score) >= hiscore && hiscore > 0) {
    drawText('NY REKORD!', cx, oy + 152, '#60ff80', 1, 'center');
  } else if (hiscore > 0) {
    drawText('REKORD: ' + hiscore, cx, oy + 152, '#8a96a4', 1, 'center');
  }
  if (blackoutT > 2.2 && (frame >> 5) % 2 === 0) {
    drawText(isTouch ? 'TRYKK PÅ SKJERMEN FOR NY VAKT' : 'TRYKK R FOR NY VAKT', cx, oy + 180, '#ffffff', 1, 'center');
  }
}

/* ---------------- HOVEDLØKKE ---------------- */
if (location.hash === '#play' || location.hash === '#playtouch') { reset(); state = 'play'; }
if (location.hash === '#play2') { playerCount = 2; reset(); state = 'play'; }
layoutCanvas();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  updateCamera(dt);
  updateMusic();
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
