/* ============================================================
   HearMe FEEDBACK — 6 UNIQUE FEATURES
   Drop this <script> at the bottom of your HTML page (before </body>)
   Add the companion CSS below or in your stylesheet.
   MySQL backend untouched — only frontend JS added here.
   ============================================================ */

(function () {
  "use strict";

  /* ──────────────────────────────────────────────
      STYLES Creation
  ────────────────────────────────────────────── */
  const style = document.createElement("style");
  style.textContent = `
    /* ── DESIGN TOKENS ── */
    :root {
      --c-bg:       #07071a;
      --c-panel:    #0d0d2b;
      --c-border:   #2a1a5e;
      --c-purple:   #7b2fff;
      --c-violet:   #b44fff;
      --c-cyan:     #00e5ff;
      --c-green:    #00ff88;
      --c-red:      #ff3366;
      --c-text:     #c8c8e8;
      --c-dim:      #5a5a8a;
      --font-mono:  'Courier New', monospace;
      --font-main:  'Segoe UI', system-ui, sans-serif;
    }

    /* ── CURSOR TRAIL ── */
    .sig-trail-dot {
      position: fixed;
      pointer-events: none;
      border-radius: 50%;
      mix-blend-mode: screen;
      z-index: 99999;
      transform: translate(-50%, -50%);
      transition: opacity 0.4s;
    }

    /* ── MOOD SELECTOR ── */
    #sig-mood-wrap {
      background: var(--c-panel);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      padding: 28px 24px;
      margin: 24px 0;
      text-align: center;
    }
    #sig-mood-wrap .sig-label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 3px;
      color: var(--c-cyan);
      margin-bottom: 18px;
      display: block;
    }
    .sig-mood-grid {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .sig-mood-btn {
      background: rgba(123,47,255,0.12);
      border: 1px solid var(--c-border);
      border-radius: 10px;
      padding: 14px 18px;
      cursor: pointer;
      transition: all 0.25s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--c-text);
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 1px;
      min-width: 72px;
    }
    .sig-mood-btn span.em { font-size: 26px; display: block; }
    .sig-mood-btn:hover, .sig-mood-btn.active {
      border-color: var(--c-purple);
      background: rgba(123,47,255,0.3);
      box-shadow: 0 0 18px rgba(123,47,255,0.5);
      transform: translateY(-3px);
    }
    #sig-mood-prompt {
      margin-top: 14px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--c-dim);
      min-height: 18px;
      transition: color 0.3s;
    }
    #sig-mood-prompt.chosen { color: var(--c-cyan); }

    /* ── LIVE FEED ── */
    #sig-feed-wrap {
      background: var(--c-panel);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      padding: 20px 22px;
      margin: 24px 0;
      max-height: 220px;
      overflow: hidden;
      position: relative;
    }
    #sig-feed-wrap .sig-label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 3px;
      color: var(--c-green);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .sig-feed-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--c-green);
      box-shadow: 0 0 8px var(--c-green);
      animation: sig-pulse 1.2s infinite;
    }
    @keyframes sig-pulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    #sig-feed-list {
      list-style: none;
      margin: 0; padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sig-feed-item {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--c-text);
      padding: 7px 12px;
      border-left: 2px solid var(--c-purple);
      background: rgba(123,47,255,0.07);
      border-radius: 0 6px 6px 0;
      animation: sig-slide-in 0.4s ease;
      display: flex;
      gap: 10px;
    }
    .sig-feed-item .sig-feed-name { color: var(--c-cyan); font-weight: bold; }
    @keyframes sig-slide-in {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ── DRAG SLIDER RATING ── */
    #sig-slider-wrap {
      background: var(--c-panel);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    #sig-slider-wrap .sig-label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 3px;
      color: var(--c-violet);
      display: block;
      margin-bottom: 20px;
    }
    #sig-drag-val {
      font-family: var(--font-mono);
      font-size: 48px;
      font-weight: bold;
      color: var(--c-cyan);
      text-shadow: 0 0 24px var(--c-cyan);
      line-height: 1;
      margin-bottom: 6px;
    }
    #sig-drag-label {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--c-dim);
      letter-spacing: 2px;
      margin-bottom: 18px;
    }
    #sig-rating-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      background: linear-gradient(to right, var(--c-purple) 0%, var(--c-purple) var(--pct, 50%), #1a1a3a var(--pct, 50%), #1a1a3a 100%);
    }
    #sig-rating-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 22px; height: 22px;
      border-radius: 50%;
      background: var(--c-cyan);
      box-shadow: 0 0 14px var(--c-cyan);
      cursor: grab;
      border: 2px solid #fff;
    }
    #sig-rating-slider::-moz-range-thumb {
      width: 22px; height: 22px;
      border-radius: 50%;
      background: var(--c-cyan);
      box-shadow: 0 0 14px var(--c-cyan);
      cursor: grab;
      border: 2px solid #fff;
    }
    .sig-slider-marks {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--c-dim);
      margin-top: 6px;
    }

    /* ── FLOATING BUBBLES ── */
    #sig-bubbles-wrap {
      background: var(--c-panel);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    #sig-bubbles-wrap .sig-label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 3px;
      color: var(--c-violet);
      display: block;
      margin-bottom: 20px;
    }
    #sig-bubble-arena {
      position: relative;
      height: 140px;
      overflow: hidden;
    }
    .sig-bubble {
      position: absolute;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid transparent;
      user-select: none;
      animation: sig-float 3s ease-in-out infinite;
    }
    .sig-bubble:hover { transform: scale(1.12) !important; }
    .sig-bubble.selected {
      border-color: #fff;
      box-shadow: 0 0 24px currentColor;
      transform: scale(1.18) !important;
    }
    @keyframes sig-float {
      0%,100% { margin-top: 0; }
      50% { margin-top: -10px; }
    }
    #sig-bubble-chosen {
      margin-top: 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--c-dim);
      min-height: 18px;
    }
    #sig-bubble-chosen.chosen { color: var(--c-cyan); }

    /* ── SENTIMENT GAUGE ── */
    #sig-gauge-wrap {
      background: var(--c-panel);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      padding: 28px 24px;
      margin: 24px 0;
      text-align: center;
    }
    #sig-gauge-wrap .sig-label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 3px;
      color: var(--c-cyan);
      display: block;
      margin-bottom: 20px;
    }
    #sig-gauge-svg { overflow: visible; }
    #sig-gauge-val {
      font-family: var(--font-mono);
      font-size: 36px;
      font-weight: bold;
      fill: var(--c-cyan);
      filter: drop-shadow(0 0 10px var(--c-cyan));
    }
    #sig-gauge-sub {
      font-family: var(--font-mono);
      font-size: 11px;
      fill: var(--c-dim);
      letter-spacing: 2px;
    }
    .sig-gauge-source {
      margin-top: 14px;
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--c-dim);
      letter-spacing: 2px;
    }
    .sig-gauge-source span { color: var(--c-green); }
  `;
  document.head.appendChild(style);

  /* ──────────────────────────────────────────────
     1. CURSOR TRAIL
  ────────────────────────────────────────────── */
  (function initTrail() {
    const colors = [
      `rgba(123,47,255,`, `rgba(0,229,255,`, `rgba(180,79,255,`
    ];
    const dots = [];
    const NUM = 18;
    for (let i = 0; i < NUM; i++) {
      const d = document.createElement("div");
      d.className = "sig-trail-dot";
      const size = 14 - i * 0.6;
      const ci = i % colors.length;
      d.style.cssText = `width:${size}px;height:${size}px;background:${colors[ci]}${1 - i / NUM})`;
      document.body.appendChild(d);
      dots.push({ el: d, x: 0, y: 0 });
    }
    let mx = 0, my = 0;
    document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });
    function animate() {
      let px = mx, py = my;
      dots.forEach((d, i) => {
        d.x += (px - d.x) * 0.35;
        d.y += (py - d.y) * 0.35;
        d.el.style.left = d.x + "px";
        d.el.style.top  = d.y + "px";
        px = d.x; py = d.y;
      });
      requestAnimationFrame(animate);
    }
    animate();
  })();

  /* ──────────────────────────────────────────────
     HELPER: find or create a container
     Pass a selector to INSERT AFTER, or null to append to body
  ────────────────────────────────────────────── */
  function insertAfter(html, afterSelector) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const node = tmp.firstElementChild;
    if (afterSelector) {
      const ref = document.querySelector(afterSelector);
      if (ref) { ref.parentNode.insertBefore(node, ref.nextSibling); return node; }
    }
    document.body.appendChild(node);
    return node;
  }

  /* ──────────────────────────────────────────────
     2. Emoji
     Auto-attaches above the submit form.
     Writes chosen Emoji to a hidden input #feel_mood
  ────────────────────────────────────────────── */
  (function initMood() {
    const moods = [
      { em: "😠", label: "Angry",   val: "angry" },
      { em: "😐", label: "Neutral", val: "neutral" },
      { em: "🙂", label: "Okay",    val: "okay" },
      { em: "😄", label: "Happy",   val: "happy" },
      { em: "🤩", label: "Amazed",  val: "amazed" },
    ];
    const html = `
      <div id="sig-mood-wrap">
        <span class="sig-label">// HOW ARE YOU FEELING ABOUT US?</span>
        <div class="sig-mood-grid">
          ${moods.map(m => `<button class="sig-mood-btn" data-val="${m.val}" type="button">
            <span class="em">${m.em}</span>${m.label}
          </button>`).join("")}
        </div>
        <p id="sig-mood-prompt">Pick your mood to begin...</p>
        <input type="hidden" name="mood" id="sig_mood" value="">
      </div>`;

    /* Try to find the form or a heading; fallback to prepend inside form */
    let placed = false;
    const form = document.querySelector("form");
    if (form) {
      form.insertAdjacentHTML("afterbegin", html);
      placed = true;
    }
    if (!placed) insertAfter(html, "h1, h2");

    const wrap = document.getElementById("sig-mood-wrap");
    const prompt = document.getElementById("sig-mood-prompt");
    const hidden = document.getElementById("sig_mood");
    const labels = { angry:"We'll make it right 💙", neutral:"Thanks for being honest.", okay:"We'll keep improving!", happy:"That means a lot! 🙌", amazed:"You just made our day 🚀" };

    wrap.addEventListener("click", e => {
      const btn = e.target.closest(".sig-mood-btn");
      if (!btn) return;
      wrap.querySelectorAll(".sig-mood-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const val = btn.dataset.val;
      hidden.value = val;
      prompt.textContent = labels[val];
      prompt.className = "chosen";
    });
  })();

  /* ──────────────────────────────────────────────
     3. LIVE FEED
     Shows recent submissions. Polls your /api/HearMe endpoint
     every 8 s. Falls back to demo data if unavailable.
  ────────────────────────────────────────────── */
  (function initFeed() {
    const DEMO = [
      { name: "Priya R.", message: "Amazing design, love the aurora theme!" },
      { name: "Rohan P.", message: "The glitch animation is so cool!" },
      { name: "Sara K.",  message: "Super fast and intuitive. Great work!" },
      { name: "Arjun S.", message: "Please add dark/light toggle option." },
    ];

    const html = `
      <div id="sig-feed-wrap">
        <div class="sig-label"><span class="sig-feed-dot"></span>LIVE FEED
          <span style="margin-left:auto;font-size:10px;color:var(--c-dim)">new signals appear automatically</span>
        </div>
        <ul id="sig-feed-list"></ul>
      </div>`;

    /* Insert after the mood selector */
    const moodWrap = document.getElementById("sig-mood-wrap");
    if (moodWrap) moodWrap.insertAdjacentHTML("afterend", html);
    else insertAfter(html, "form");

    const list = document.getElementById("sig-feed-list");
    let feedData = [...DEMO];
    let pointer = 0;

    function renderItem(item) {
      const li = document.createElement("li");
      li.className = "sig-feed-item";
      li.innerHTML = `<span class="sig-feed-name">${item.name}</span><span>— ${item.message}</span>`;
      list.insertBefore(li, list.firstChild);
      /* cap at 5 visible */
      while (list.children.length > 5) list.removeChild(list.lastChild);
    }

    /* Seed with demo */
    [...feedData].reverse().forEach(renderItem);

    /* Poll real endpoint */
    async function poll() {
      try {
        const r = await fetch("/api/signals?limit=5");
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (Array.isArray(data) && data.length) {
          feedData = data;
          list.innerHTML = "";
          [...data].reverse().forEach(renderItem);
        }
      } catch (_) { /* keep demo data */ }
    }

    /* Add a new demo entry every 6 s if no real data */
    const extras = [
      { name: "Dev T.",   message: "The drag rating is genius!" },
      { name: "Maya L.",  message: "Best feedback form I've seen." },
      { name: "Karan M.", message: "Signal transmitted successfully ✅" },
    ];
    let ei = 0;
    setInterval(() => {
      renderItem(extras[ei % extras.length]);
      ei++;
      poll();
    }, 6000);
    poll();
  })();

  /* ──────────────────────────────────────────────
     4. DRAG SLIDER RATING
     Writes value to hidden input #sig_rating
     Replaces star rating if present
  ────────────────────────────────────────────── */
  (function initSlider() {
    const html = `
      <div id="sig-slider-wrap">
        <span class="sig-label">// DRAG TO RATE YOUR EXPERIENCE</span>
        <div id="sig-drag-val">5.0</div>
        <div id="sig-drag-label">Good</div>
        <input type="range" id="sig-rating-slider" min="0" max="10" step="0.1" value="5">
        <div class="sig-slider-marks"><span>0.0</span><span>2.5</span><span>5.0</span><span>7.5</span><span>10.0</span></div>
        <input type="hidden" name="rating" id="sig_rating" value="5">
      </div>`;

    /* Try to hide existing star rating */
    const existingStar = document.querySelector('input[name="rating"], .star-rating, #rating-wrap');
    if (existingStar) {
      existingStar.style.display = "none";
      existingStar.insertAdjacentHTML("afterend", html);
    } else {
      const feedEl = document.getElementById("sig-feed-wrap");
      if (feedEl) feedEl.insertAdjacentHTML("afterend", html);
      else insertAfter(html, "form");
    }

    const slider = document.getElementById("sig-rating-slider");
    const valEl  = document.getElementById("sig-drag-val");
    const lblEl  = document.getElementById("sig-drag-label");
    const hidden = document.getElementById("sig_rating");
    const labels = ["Terrible","Very Poor","Poor","Below Average","Average","Above Average","Good","Great","Excellent","Outstanding!","PERFECT 💜"];

    function update() {
      const v = parseFloat(slider.value);
      const pct = (v / 10 * 100).toFixed(1);
      slider.style.setProperty("--pct", pct + "%");
      valEl.textContent = v.toFixed(1);
      lblEl.textContent = labels[Math.round(v)];
      hidden.value = v;
    }
    slider.addEventListener("input", update);
    update();
  })();

  /* ──────────────────────────────────────────────
     5. FLOATING CATEGORY BUBBLES
     Writes value to hidden input #sig_category
     Replaces existing category dropdown if found
  ────────────────────────────────────────────── */
  (function initBubbles() {
    const cats = [
      { label: "General", color: "#7b2fff", size: 90 },
      { label: "Bug",     color: "#ff3366", size: 80 },
      { label: "Feature", color: "#b44fff", size: 85 },
      { label: "Praise",  color: "#00ff88", size: 78 },
    ];

    const html = `
      <div id="sig-bubbles-wrap">
        <span class="sig-label">// CLICK A BUBBLE TO SELECT CATEGORY</span>
        <div id="sig-bubble-arena"></div>
        <p id="sig-bubble-chosen">Click a bubble to select category</p>
        <input type="hidden" name="category" id="sig_category" value="">
      </div>`;

    /* Try to hide existing category select */
    const existCat = document.querySelector('select[name="category"], #category');
    if (existCat) {
      existCat.style.display = "none";
      existCat.insertAdjacentHTML("afterend", html);
    } else {
      const sliderEl = document.getElementById("sig-slider-wrap");
      if (sliderEl) sliderEl.insertAdjacentHTML("afterend", html);
      else insertAfter(html, "form");
    }

    const arena   = document.getElementById("sig-bubble-arena");
    const chosen  = document.getElementById("sig-bubble-chosen");
    const hidden  = document.getElementById("sig_category");

    /* Place bubbles */
    const positions = [[10,20],[38,10],[62,22],[82,8]];
    cats.forEach((c, i) => {
      const b = document.createElement("div");
      b.className = "sig-bubble";
      b.textContent = c.label;
      b.dataset.val = c.label.toLowerCase();
      b.style.cssText = `
        width:${c.size}px;height:${c.size}px;
        background:${c.color}33;
        color:${c.color};
        border-color:${c.color}66;
        left:${positions[i][0]}%;top:${positions[i][1]}px;
        animation-delay:${i*0.5}s;
        box-shadow: 0 0 14px ${c.color}44;
      `;
      b.addEventListener("click", () => {
        arena.querySelectorAll(".sig-bubble").forEach(x => x.classList.remove("selected"));
        b.classList.add("selected");
        hidden.value = b.dataset.val;
        chosen.textContent = `✦ Category: ${c.label}`;
        chosen.className = "chosen";
      });
      arena.appendChild(b);
    });
  })();

  /* ──────────────────────────────────────────────
     6. SENTIMENT GAUGE
     Fetches /api/HearMe/stats for live average.
     Renders animated SVG arc gauge.
  ────────────────────────────────────────────── */
  (function initGauge() {
    const html = `
      <div id="sig-gauge-wrap">
        <span class="sig-label">// OVERALL SATISFACTION SCORE</span>
        <svg id="sig-gauge-svg" width="200" height="130" viewBox="0 0 200 130">
          <!-- Track -->
          <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#1a1a3a" stroke-width="12" stroke-linecap="round"/>
          <!-- Arc fill -->
          <path id="sig-gauge-arc" d="M 20 110 A 80 80 0 0 1 180 110" fill="none"
            stroke="url(#gaugeGrad)" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="251" stroke-dashoffset="251"
            style="transition: stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)"/>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#7b2fff"/>
              <stop offset="100%" stop-color="#00e5ff"/>
            </linearGradient>
          </defs>
          <text id="sig-gauge-val" x="100" y="100" text-anchor="middle">—</text>
          <text id="sig-gauge-sub" x="100" y="118" text-anchor="middle">out of 5.0</text>
        </svg>
        <p class="sig-gauge-source">live from MySQL · <span id="sig-gauge-badge">updating...</span></p>
      </div>`;

    /* Append after the form or at end of main content */
    const form = document.querySelector("form");
    if (form) form.insertAdjacentHTML("afterend", html);
    else document.body.insertAdjacentHTML("beforeend", html);

    const arc   = document.getElementById("sig-gauge-arc");
    const valEl = document.getElementById("sig-gauge-val");
    const badge = document.getElementById("sig-gauge-badge");
    const ARC_LEN = 251;

    function setGauge(score, max) {
      const pct = Math.max(0, Math.min(1, score / max));
      arc.style.strokeDashoffset = ARC_LEN - ARC_LEN * pct;
      valEl.textContent = score.toFixed(1);
      badge.textContent = "live ✦";
    }

    async function fetchStats() {
      try {
        const r = await fetch("/api/signals/stats");
        if (!r.ok) throw new Error();
        const d = await r.json();
        const avg = parseFloat(d.avg_rating || d.avgRating || 0);
        /* If rating is 0–10 scale, halve it; if 0–5 use directly */
        setGauge(avg > 5 ? avg / 2 : avg, 5);
      } catch (_) {
        /* Demo value */
        setGauge(4.2, 5);
        badge.textContent = "demo mode";
      }
    }

    fetchStats();
    setInterval(fetchStats, 15000);
  })();

})();
