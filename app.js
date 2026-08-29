const TITLE = "GitHub Fun Time";
const HEX = "0123456789abcdef";
const GREENS = ["#0e4429", "#006d32", "#26a641", "#39d353"];
const COMMITS = [
  "feat: more fun on main",
  "fix: un-broke the vibes",
  "chore: dance on origin",
  "docs: readme but make it sparkle",
  "refactor: chaos → slightly nicer chaos",
  "style: pixels go brrr",
  "test: clicked the button, it clicked back",
  "perf: 60fps of unhinged joy",
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const titleEl = document.getElementById("title");
const button = document.getElementById("fun-btn");
const pushBtn = document.getElementById("push-btn");
const pullBtn = document.getElementById("pull-btn");
const terminal = document.getElementById("terminal");
const comboEl = document.getElementById("combo");
const glow = document.getElementById("glow");
const badge = document.getElementById("badge-label");
const hint = document.getElementById("hint");
const heatCanvas = document.getElementById("heat");
const rainCanvas = document.getElementById("rain");
const fxCanvas = document.getElementById("fx");
const walkerCanvas = document.getElementById("walker");
const heat = heatCanvas.getContext("2d");
const rainCtx = rainCanvas.getContext("2d");
const fx = fxCanvas.getContext("2d");
const walkerCtx = walkerCanvas.getContext("2d");

const particles = [];
const raindrops = [];
const splashes = [];
const logLines = [];
let commits = 0;
let combo = 0;
let comboTimer = 0;
let partyUntil = 0;
let scrambleUntil = 0;
let audioCtx;

const mouse = { x: innerWidth / 2, y: innerHeight * 0.38 };
const glowPos = { x: mouse.x, y: mouse.y };
const rainMan = {
  x: 120,
  dir: 1,
  phase: 0,
  panicUntil: 0,
  nextTurn: 0,
};

function manGround() {
  return innerHeight - 8;
}

function manBob() {
  return reduceMotion ? 0 : Math.abs(Math.sin(rainMan.phase)) * 2.4;
}

function umbrellaHitbox() {
  const bob = manBob();
  return {
    x: rainMan.x + rainMan.dir * 10,
    y: manGround() - bob - 58,
    rx: 27,
    ry: 13,
  };
}

function hitsUmbrella(x, y) {
  const u = umbrellaHitbox();
  const dx = (x - u.x) / u.rx;
  const dy = (y - u.y) / u.ry;
  return dx * dx + dy * dy <= 1 && y <= u.y + 6;
}

function resize() {
  for (const canvas of [heatCanvas, rainCanvas, fxCanvas, walkerCanvas]) {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
  }
  heat.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  rainCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  fx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  walkerCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  rainMan.x = Math.min(Math.max(40, rainMan.x), Math.max(40, innerWidth - 40));
  seedRain();
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shortSha() {
  return Array.from({ length: 7 }, () => pick(HEX.split(""))).join("");
}

function scrambleTitle() {
  titleEl.textContent = Array.from(TITLE, (ch) =>
    ch === " " ? " " : pick(HEX.split(""))
  ).join("");
}

function buttonOrigin(el = button) {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

function rainCount() {
  return Math.round(Math.min(280, Math.max(90, (innerWidth * innerHeight) / 6800)));
}

function makeDrop(anywhere) {
  return {
    x: rand(-30, innerWidth + 30),
    y: anywhere ? rand(-innerHeight, innerHeight) : rand(-80, -8),
    len: rand(10, 22),
    speed: rand(10, 18),
    drift: rand(0.6, 1.8),
    alpha: rand(0.14, 0.5),
    thick: rand(0.9, 1.7),
  };
}

function seedRain() {
  raindrops.length = 0;
  splashes.length = 0;
  if (reduceMotion) return;
  const n = rainCount();
  for (let i = 0; i < n; i += 1) raindrops.push(makeDrop(true));
}

function drawRain() {
  rainCtx.clearRect(0, 0, innerWidth, innerHeight);
  if (reduceMotion) return;

  rainCtx.lineCap = "round";
  for (const drop of raindrops) {
    drop.x += drop.drift;
    drop.y += drop.speed;

    rainCtx.strokeStyle = `rgba(88, 166, 255, ${drop.alpha})`;
    rainCtx.lineWidth = drop.thick;
    rainCtx.beginPath();
    rainCtx.moveTo(drop.x, drop.y);
    rainCtx.lineTo(drop.x - drop.drift * 2.4, drop.y + drop.len);

    const tipX = drop.x - drop.drift * 2.4;
    const tipY = drop.y + drop.len;
    if (hitsUmbrella(tipX, tipY) || hitsUmbrella(drop.x, drop.y)) {
      splashes.push({
        x: tipX,
        y: Math.min(tipY, umbrellaHitbox().y + 4),
        life: 1,
        r: rand(1.2, 3.4),
        canopy: true,
      });
      Object.assign(drop, makeDrop(false));
      continue;
    }

    rainCtx.stroke();

    if (drop.y > innerHeight) {
      if (Math.random() > 0.45) {
        splashes.push({
          x: drop.x,
          y: innerHeight - 2,
          life: 1,
          r: rand(1.5, 4.5),
        });
      }
      Object.assign(drop, makeDrop(false));
    } else if (drop.x > innerWidth + 40) {
      drop.x = -20;
    }
  }

  for (let i = splashes.length - 1; i >= 0; i -= 1) {
    const splash = splashes[i];
    splash.life -= 0.045;
    splash.r += 0.7;
    if (splash.life <= 0) {
      splashes.splice(i, 1);
      continue;
    }
    if (splash.canopy) continue;
    rainCtx.strokeStyle = `rgba(139, 233, 253, ${splash.life * 0.32})`;
    rainCtx.lineWidth = 1;
    rainCtx.beginPath();
    rainCtx.ellipse(splash.x, splash.y, splash.r, splash.r * 0.32, 0, 0, Math.PI * 2);
    rainCtx.stroke();
  }
}

function updateRainMan(now) {
  const margin = 38;

  if (!reduceMotion) {
    for (const drop of raindrops) {
      if (now < rainMan.panicUntil) break;
      const near = Math.abs(drop.x - rainMan.x) < 46;
      const incoming = drop.y > innerHeight - 120 && drop.y < innerHeight - 36;
      if (near && incoming && !hitsUmbrella(drop.x, drop.y + drop.len)) {
        rainMan.dir = drop.x > rainMan.x ? -1 : 1;
        rainMan.panicUntil = now + 780;
        rainMan.nextTurn = now + rand(1600, 3800);
        break;
      }
    }

    if (now > rainMan.nextTurn) {
      rainMan.dir *= -1;
      rainMan.nextTurn = now + rand(2400, 5600);
    }

    const panic = now < rainMan.panicUntil;
    const speed = panic ? 3.5 : 1.55;
    rainMan.x += rainMan.dir * speed;
    rainMan.phase += panic ? 0.3 : 0.15;
  }

  if (rainMan.x > innerWidth - margin) {
    rainMan.x = innerWidth - margin;
    rainMan.dir = -1;
  } else if (rainMan.x < margin) {
    rainMan.x = margin;
    rainMan.dir = 1;
  }
}

function drawRainMan(now) {
  const ctx = walkerCtx;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const panic = now < rainMan.panicUntil;
  const bob = manBob();
  const ground = manGround();
  const lean = rainMan.dir * (panic ? 0.16 : 0.06);
  const swing = reduceMotion ? 0 : Math.sin(rainMan.phase);

  ctx.save();
  ctx.translate(rainMan.x, ground - bob);
  ctx.scale(rainMan.dir, 1);
  ctx.rotate(lean);

  ctx.fillStyle = "rgba(88, 166, 255, 0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 3, 18, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6e7681";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-2, -17);
  ctx.lineTo(-7 + swing * 5, -1);
  ctx.moveTo(3, -17);
  ctx.lineTo(7 - swing * 5, -1);
  ctx.stroke();

  ctx.fillStyle = "#1f2328";
  ctx.beginPath();
  ctx.ellipse(-7 + swing * 5, 0, 4.2, 1.7, 0, 0, Math.PI * 2);
  ctx.ellipse(7 - swing * 5, 0, 4.2, 1.7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = panic ? "#f0c674" : "#e3b341";
  ctx.beginPath();
  ctx.moveTo(-11, -18);
  ctx.lineTo(11, -18);
  ctx.lineTo(13, -36);
  ctx.lineTo(-9, -36);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e3b341";
  ctx.beginPath();
  ctx.ellipse(1, -42, 7.2, 7.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0d5b0";
  ctx.beginPath();
  ctx.arc(2, -41, 5.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#161b22";
  ctx.beginPath();
  ctx.arc(4.2, -42, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8b949e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, -28);
  ctx.quadraticCurveTo(14, -34, 10, -56);
  ctx.stroke();

  ctx.fillStyle = "#238636";
  ctx.beginPath();
  ctx.moveTo(-16, -56);
  for (let i = 0; i < 5; i += 1) {
    const x0 = -16 + i * 8.4;
    ctx.quadraticCurveTo(x0 + 4.2, -47, x0 + 8.4, -56);
  }
  ctx.quadraticCurveTo(10, -70, -16, -56);
  ctx.fill();

  ctx.strokeStyle = "rgba(63, 185, 80, 0.9)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-16, -56);
  ctx.quadraticCurveTo(10, -70, 26, -56);
  ctx.stroke();

  ctx.fillStyle = "#2ea043";
  ctx.beginPath();
  ctx.arc(10, -56, 2.2, 0, Math.PI * 2);
  ctx.fill();

  if (panic) {
    ctx.strokeStyle = "rgba(139, 233, 253, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-22, -48);
    ctx.lineTo(-30, -52);
    ctx.moveTo(-22, -38);
    ctx.lineTo(-31, -38);
    ctx.stroke();
  }

  ctx.restore();

  for (const splash of splashes) {
    if (!splash.canopy) continue;
    ctx.strokeStyle = `rgba(139, 233, 253, ${splash.life * 0.45})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(splash.x, splash.y, splash.r, splash.r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function burst(count = 42, el = button) {
  const { x, y } = buttonOrigin(el);
  const party = document.body.classList.contains("party");

  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(2.5, 11);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(1, 4),
      size: rand(5, 13),
      life: 1,
      decay: rand(0.008, 0.018),
      color: party ? pick(["#39d353", "#58a6ff", "#d2a8ff", "#f778ba"]) : pick(GREENS),
      kind: Math.random() > 0.72 ? "glyph" : "square",
      glyph: pick(["+", "*", "●", "git"]),
      spin: rand(-0.2, 0.2),
      rot: rand(0, Math.PI),
    });
  }
}

function lightHeatmap() {
  const cols = Math.ceil(innerWidth / 16);
  const rows = Math.ceil(innerHeight / 16);
  heat.globalAlpha = 0.9;
  for (let i = 0; i < 40; i += 1) {
    const c = Math.floor(rand(0, cols));
    const r = Math.floor(rand(0, rows));
    heat.fillStyle = pick(GREENS);
    heat.fillRect(c * 16 + 2, r * 16 + 2, 11, 11);
  }
  heat.globalAlpha = 1;
}

function drawHeatmap() {
  const size = 13;
  const gap = 4;
  const cell = size + gap;
  const cols = Math.ceil(innerWidth / cell) + 1;
  const rows = Math.ceil(innerHeight / cell) + 1;

  heat.clearRect(0, 0, innerWidth, innerHeight);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const n = Math.sin(c * 0.35 + r * 0.2) * 0.5 + 0.5;
      const idle = n * 0.18;
      if (idle < 0.04) continue;
      heat.fillStyle = GREENS[Math.min(3, Math.floor(n * 4))];
      heat.globalAlpha = idle;
      heat.fillRect(c * cell, r * cell, size, size);
    }
  }
  heat.globalAlpha = 1;
}

function ping(comboCount) {
  if (reduceMotion) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx ??= new Ctx();
    audioCtx.resume?.();
  } catch {
    return;
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const notes = [523.25, 659.25, 783.99, 987.77];
  osc.type = "triangle";
  osc.frequency.setValueAtTime(notes[Math.min(comboCount, notes.length) - 1] || 523.25, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}

function logCommit(message = pick(COMMITS)) {
  const sha = shortSha();
  logLines.unshift({ sha, message });
  if (logLines.length > 4) logLines.pop();

  terminal.classList.add("visible");
  terminal.innerHTML = logLines
    .map(
      (line, i) =>
        `<div style="opacity:${1 - i * 0.18}"><span class="sha">${line.sha}</span> <span class="plus">+</span> <span class="msg">${line.message}</span></div>`
    )
    .join("");
}

function celebrate() {
  commits += 1;
  const now = performance.now();
  combo = now < comboTimer ? combo + 1 : 1;
  comboTimer = now + 1400;

  if (combo >= 5) {
    partyUntil = now + 2600;
    document.body.classList.add("party");
    badge.textContent = "force push unlocked";
  }

  scrambleUntil = now + 420;
  popButton(button);

  badge.textContent = combo >= 5 ? "force push unlocked" : `${commits} commit${commits === 1 ? "" : "s"} shipped`;
  hint.textContent = combo >= 3 ? "keep clicking · combo rising" : "commit · push · smile";
  comboEl.hidden = combo < 2;
  comboEl.textContent = combo >= 2 ? `combo x${combo}` : "";

  if (!reduceMotion) {
    burst(36 + Math.min(combo, 8) * 8);
    lightHeatmap();
  }

  logCommit();
  ping(combo);
}

function popButton(el) {
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}

function pushRemote() {
  scrambleUntil = performance.now() + 320;
  popButton(pushBtn);
  badge.textContent = "pushed to origin";
  hint.textContent = "origin is up to date";
  if (!reduceMotion) burst(52, pushBtn);
  logCommit("push: shipped the vibes to origin");
  ping(3);
}

function pullRemote() {
  scrambleUntil = performance.now() + 320;
  popButton(pullBtn);
  badge.textContent = "pulled from origin";
  hint.textContent = "fast-forward · already up to date";

  if (!reduceMotion) {
    const { x, y } = buttonOrigin(pullBtn);
    for (let i = 0; i < 40; i += 1) {
      const side = Math.floor(rand(0, 4));
      let sx;
      let sy;
      if (side === 0) {
        sx = rand(0, innerWidth);
        sy = -12;
      } else if (side === 1) {
        sx = innerWidth + 12;
        sy = rand(0, innerHeight);
      } else if (side === 2) {
        sx = rand(0, innerWidth);
        sy = innerHeight + 12;
      } else {
        sx = -12;
        sy = rand(0, innerHeight);
      }
      const dx = x - sx;
      const dy = y - sy;
      const dist = Math.hypot(dx, dy) || 1;
      particles.push({
        x: sx,
        y: sy,
        vx: (dx / dist) * rand(5, 10),
        vy: (dy / dist) * rand(5, 10),
        size: rand(5, 12),
        life: 1,
        decay: rand(0.01, 0.02),
        color: pick(["#58a6ff", "#39d353", "#79c0ff"]),
        kind: Math.random() > 0.7 ? "glyph" : "square",
        glyph: pick(["↓", "fetch", "*"]),
        spin: rand(-0.18, 0.18),
        rot: rand(0, Math.PI),
      });
    }
    lightHeatmap();
  }

  logCommit("pull: fast-forwarded the vibes");
  ping(2);
}

function drawParticles() {
  fx.clearRect(0, 0, innerWidth, innerHeight);
  fx.font = "700 12px 'IBM Plex Mono', monospace";

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.vx *= 0.99;
    p.rot += p.spin;
    p.life -= p.decay;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    fx.globalAlpha = Math.max(0, p.life);
    fx.fillStyle = p.color;
    fx.save();
    fx.translate(p.x, p.y);
    fx.rotate(p.rot);

    if (p.kind === "glyph") {
      fx.fillText(p.glyph, 0, 0);
    } else {
      fx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    }

    fx.restore();
  }

  fx.globalAlpha = 1;
}

function tick(now) {
  if (now < scrambleUntil) scrambleTitle();
  else if (titleEl.textContent !== TITLE) titleEl.textContent = TITLE;

  if (now > partyUntil && document.body.classList.contains("party")) {
    document.body.classList.remove("party");
    badge.textContent = `${commits} commit${commits === 1 ? "" : "s"} shipped`;
  }

  glowPos.x += (mouse.x - glowPos.x) * 0.08;
  glowPos.y += (mouse.y - glowPos.y) * 0.08;
  glow.style.left = `${glowPos.x}px`;
  glow.style.top = `${glowPos.y}px`;

  updateRainMan(now);
  drawRain();
  drawRainMan(now);
  drawParticles();
  requestAnimationFrame(tick);
}

resize();
drawHeatmap();
rainMan.nextTurn = performance.now() + 2800;
requestAnimationFrame(tick);

button.addEventListener("click", celebrate);
pushBtn.addEventListener("click", pushRemote);
pullBtn.addEventListener("click", pullRemote);
window.addEventListener("resize", () => {
  resize();
  drawHeatmap();
});
window.addEventListener("pointermove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});
