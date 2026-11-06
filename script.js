/* Soham Deshmukh portfolio: page behaviour and the Chaos Test.
   The page works without this file. Everything here is enhancement. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const shuffle = (list) => list.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
  const scrollMode = reduced ? 'auto' : 'smooth';

  const store = {
    get(key) { try { return localStorage.getItem(`soham.${key}`); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(`soham.${key}`, value); } catch { /* storage is optional */ } },
  };

  /* Theme ------------------------------------------------------------------ */
  let preferredTheme = store.get('theme') === 'night' ? 'night' : 'day';
  const themeToggle = $('#themeToggle');
  const metaTheme = $('meta[name="theme-color"]');
  const themeColors = { day: '#F3EFE6', outage: '#0D0B0B', night: '#0A1330' };

  function setTheme(name) {
    root.dataset.theme = name;
    metaTheme.content = themeColors[name];
    themeToggle.textContent = name === 'night' ? 'Day' : 'Night Shift';
    net.refresh();
    sky.onTheme(name);
  }

  function choosePreferredTheme(name) {
    preferredTheme = name;
    store.set('theme', name);
    setTheme(name);
  }

  /* Small page behaviours -------------------------------------------------- */
  const menuBtn = $('#menuBtn');
  const nav = $('#siteNav');
  function closeMenu() {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
  }
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
  });

  const uptimeFill = $('#uptimeFill');
  function updateProgress() {
    const max = root.scrollHeight - innerHeight;
    uptimeFill.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  }
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  const resumeBtn = $('#resumeBtn');
  resumeBtn.addEventListener('click', () => {
    const label = resumeBtn.firstElementChild;
    label.textContent = 'shipping...';
    setTimeout(() => { label.textContent = 'Resume'; }, 1100);
  });

  /* Name: split into letters so it can boot, and later fall apart ----------- */
  const heroName = $('#heroName');
  heroName.setAttribute('aria-label', 'Soham Deshmukh');
  const letters = [];
  $$('[data-letters]', heroName).forEach((part) => {
    const text = part.textContent;
    part.textContent = '';
    part.setAttribute('aria-hidden', 'true');
    const word = document.createElement('span');
    word.className = 'word';
    [...text].forEach((c) => {
      const ch = document.createElement('span');
      ch.className = 'ch';
      ch.textContent = c;
      ch.dataset.c = c;
      word.append(ch);
      letters.push(ch);
    });
    part.append(word);
  });

  if (!reduced) {
    const glyphs = '01/\\_#';
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 800;
      letters.forEach((ch, i) => {
        const settled = t > (i + 1) / letters.length;
        ch.textContent = settled ? ch.dataset.c : glyphs[randInt(0, glyphs.length - 1)];
      });
      if (t < 1) requestAnimationFrame(tick);
      else letters.forEach((ch) => { ch.textContent = ch.dataset.c; });
    };
    requestAnimationFrame(tick);
  }

  /* Hero network diagram ---------------------------------------------------- */
  const net = (() => {
    const canvas = $('#net');
    const ctx = canvas.getContext('2d');
    const holder = $('#heroGraphic');
    const layers = [{ n: 2, label: 'VISITORS' }, { n: 4, label: 'EDGE' }, { n: 3, label: 'REGION' }, { n: 2, label: 'DATA' }];
    let w = 0, h = 0, nodes = [], edges = [], packets = [], colors = {}, visible = true, raf = 0;
    const pointer = { x: -999, y: -999 };

    function readColors() {
      const css = getComputedStyle(root);
      ['--ink', '--muted', '--line', '--accent', '--ok', '--bad', '--surface'].forEach((v) => {
        colors[v] = css.getPropertyValue(v).trim();
      });
    }

    function layout() {
      const rect = holder.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (!w || !h) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = []; edges = [];
      const padX = Math.max(34, w * .12), top = 54, bottom = h - 44;
      layers.forEach((layer, li) => {
        const x = padX + (w - padX * 2) * (li / (layers.length - 1));
        for (let i = 0; i < layer.n; i++) {
          nodes.push({ layer: li, x, y: top + (bottom - top) * ((i + .5) / layer.n), ox: 0, oy: 0 });
        }
      });
      nodes.forEach((a, i) => nodes.forEach((b, j) => {
        if (b.layer === a.layer + 1) edges.push({ a: i, b: j });
      }));
      packets = Array.from({ length: 12 }, () => ({ e: randInt(0, edges.length - 1), t: Math.random(), v: rand(.005, .012) }));
    }

    const layerDown = (layer) => layer > 0 && body.classList.contains(`broken-${layer}`) && !body.classList.contains('calm');

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const night = root.dataset.theme === 'night';

      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = colors['--muted'];
      layers.forEach((layer, li) => {
        const n = nodes.find((node) => node.layer === li);
        if (n) ctx.fillText(layer.label, n.x, 28);
      });

      nodes.forEach((n) => {
        const dx = pointer.x - n.x, dy = pointer.y - n.y;
        const d = Math.hypot(dx, dy);
        const pull = d < 130 ? (1 - d / 130) * 12 : 0;
        const tx = d ? dx / d * pull : 0, ty = d ? dy / d * pull : 0;
        n.ox += (tx - n.ox) * .12; n.oy += (ty - n.oy) * .12;
      });

      ctx.lineWidth = 1;
      edges.forEach(({ a, b }) => {
        const p = nodes[a], q = nodes[b];
        const down = layerDown(q.layer) || layerDown(p.layer);
        ctx.strokeStyle = down ? colors['--bad'] : colors['--line'];
        ctx.globalAlpha = down ? .35 : 1;
        ctx.setLineDash(down ? [3, 6] : []);
        ctx.beginPath();
        ctx.moveTo(p.x + p.ox, p.y + p.oy);
        ctx.lineTo(q.x + q.ox, q.y + q.oy);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      packets.forEach((pk) => {
        const { a, b } = edges[pk.e];
        const p = nodes[a], q = nodes[b];
        const blocked = layerDown(q.layer);
        if (!reduced) {
          pk.t += blocked ? pk.v * .12 : pk.v;
          if (pk.t >= (blocked ? .45 : 1)) {
            pk.t = 0;
            pk.e = randInt(0, edges.length - 1);
            pk.v = rand(.005, .012);
          }
        }
        ctx.fillStyle = blocked ? colors['--bad'] : colors['--accent'];
        ctx.beginPath();
        ctx.arc(p.x + p.ox + (q.x + q.ox - p.x - p.ox) * pk.t, p.y + p.oy + (q.y + q.oy - p.y - p.oy) * pk.t, 3, 0, 7);
        ctx.fill();
      });

      nodes.forEach((n) => {
        const down = layerDown(n.layer);
        ctx.fillStyle = colors['--surface'];
        ctx.strokeStyle = down ? colors['--bad'] : night ? colors['--accent'] : colors['--ink'];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x + n.ox, n.y + n.oy, 8, 0, 7);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = down ? colors['--bad'] : colors['--ok'];
        ctx.beginPath();
        ctx.arc(n.x + n.ox, n.y + n.oy, 3, 0, 7);
        ctx.fill();
      });
    }

    function loop() {
      raf = 0;
      if (!visible || document.hidden) return;
      draw();
      if (!reduced) raf = requestAnimationFrame(loop);
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };

    function refresh() { readColors(); if (w) { draw(); wake(); } }

    holder.addEventListener('pointermove', (e) => {
      const r = holder.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    });
    holder.addEventListener('pointerleave', () => { pointer.x = pointer.y = -999; });
    document.addEventListener('visibilitychange', wake);
    new ResizeObserver(() => { layout(); refresh(); }).observe(holder);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); }).observe(holder);

    readColors();
    return { refresh };
  })();

  /* Night sky and the SD constellation -------------------------------------- */
  const sky = (() => {
    const canvas = $('#sky');
    const ctx = canvas.getContext('2d');
    const S = [[.92, .12], [.5, 0], [.1, .16], [.22, .42], [.72, .56], [.94, .78], [.58, 1], [.08, .9]];
    const D = [[.12, 0], [.12, .5], [.12, 1], [.58, .95], [.92, .68], [.95, .32], [.6, .05], [.12, 0]];
    let w = 0, h = 0, stars = [], raf = 0, running = false;
    let drawStart = 0, drawn = 0, dim = false;

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round(w * h / 6500) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: rand(.4, 1.5), p: rand(0, 6.3), s: rand(.3, 1),
      }));
    }

    function shapes() {
      if (w >= 980) {
        const size = Math.min(w * .17, h * .42, 230);
        const y = (h - size * 1.3) / 2;
        const gap = Math.max(20, ((w - 500) / 2 - size) / 2);
        return [{ pts: S, x: gap, y, s: size }, { pts: D, x: w - gap - size, y, s: size }];
      }
      const size = Math.min(w * .2, h * .13, 110);
      return [
        { pts: S, x: w / 2 - size - 16, y: 76, s: size },
        { pts: D, x: w / 2 + 16, y: 76, s: size },
      ];
    }

    function paint(now) {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((st) => {
        const a = reduced ? .7 : .45 + .4 * Math.sin(now / 1000 * st.s + st.p);
        ctx.globalAlpha = a;
        ctx.fillStyle = '#E9EEFF';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, 7);
        ctx.fill();
      });

      if (drawStart) {
        const progress = reduced ? 1 : Math.min(1, (now - drawStart) / 2600);
        drawn = progress;
        const alpha = dim ? .22 : .9;
        shapes().forEach(({ pts, x, y, s }) => {
          const segs = pts.length - 1;
          const reach = progress * segs;
          const at = ([px, py]) => [x + px * s, y + py * s * 1.3];
          ctx.globalAlpha = alpha * .75;
          ctx.strokeStyle = '#FFC46B';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < segs && i < reach; i++) {
            const [ax, ay] = at(pts[i]);
            const [bx, by] = at(pts[i + 1]);
            const f = Math.min(1, reach - i);
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f);
          }
          ctx.stroke();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#FFE8C2';
          pts.forEach((pt, i) => {
            if (i > reach) return;
            const [px, py] = at(pt);
            ctx.beginPath();
            ctx.arc(px, py, 3.2, 0, 7);
            ctx.fill();
          });
        });
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (!running) { raf = 0; return; }
      paint(now);
      raf = reduced ? 0 : requestAnimationFrame(loop);
    }

    function onTheme(name) {
      running = name === 'night';
      if (running && !w) size();
      if (running && !raf) raf = requestAnimationFrame(loop);
    }

    addEventListener('resize', () => {
      if (!w) return;
      size();
      if (reduced && running) requestAnimationFrame(paint);
    });

    return {
      onTheme,
      constellation() { dim = false; drawStart = performance.now(); if (reduced) requestAnimationFrame(paint); },
      showDim() { dim = true; if (!drawStart) drawStart = 1; if (reduced) requestAnimationFrame(paint); },
    };
  })();

  /* Sound: generated tones only, off by default ------------------------------ */
  const sound = (() => {
    let on = false, ac = null;
    function tone(freq, start, length, type = 'square', gain = .035) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ac.currentTime + start);
      g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + start + length);
      osc.connect(g).connect(ac.destination);
      osc.start(ac.currentTime + start);
      osc.stop(ac.currentTime + start + length);
    }
    const sets = {
      alarm: [[660, 0, .16], [440, .2, .16], [660, .4, .16], [440, .6, .16]],
      good: [[523, 0, .1, 'triangle', .07], [784, .1, .16, 'triangle', .07]],
      bad: [[140, 0, .18, 'sawtooth', .04]],
      clear: [[523, 0, .14, 'triangle', .07], [659, .13, .14, 'triangle', .07], [784, .26, .14, 'triangle', .07], [1047, .39, .32, 'triangle', .07]],
    };
    return {
      toggle() {
        on = !on;
        if (on && !ac) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) ac = new Ctx(); else on = false;
        }
        if (on && ac.state === 'suspended') ac.resume();
        return on;
      },
      play(name) { if (on && ac) sets[name].forEach((args) => tone(...args)); },
    };
  })();

  /* The Chaos Test ----------------------------------------------------------- *
   * States: idle -> armed -> outage -> incident1 -> incident2 -> incident3 -> resolved
   * `minimised` is a pause that can sit on top of any active state.
   * restore() is the only way back to idle, so nothing can stay half broken. */
  const chaosBox = $('#chaos');
  const chaosSwitch = $('#chaosSwitch');
  const chaosStep = $('#chaosStep');
  const chaosNote = $('#chaosNote');
  const consoleEl = $('#console');
  const consoleBody = $('#consoleBody');
  const consoleId = $('#consoleId');
  const timerEl = $('#timer');
  const chip = $('#pagerChip');
  const chipText = $('#pagerChipText');
  const statusEl = $('#status');
  const statusText = $('#statusText');
  const live = $('#live');
  const postmortem = $('#postmortem');

  const game = {
    state: 'idle',
    minimised: false,
    pending: new Set(),
    elapsed: 0,
    startedAt: 0,
    wrong: 0,
    ticker: 0,
    scrollAnchor: 0,
    autoScrolling: false,
    takeawayOpen: false,
  };

  const isActive = () => /^(outage|incident\d)$/.test(game.state);
  const announce = (msg) => { live.textContent = msg; };

  function after(ms, fn) {
    const id = setTimeout(() => { game.pending.delete(id); fn(); }, ms);
    game.pending.add(id);
    return id;
  }
  function clearPending() {
    game.pending.forEach(clearTimeout);
    game.pending.clear();
  }

  function setStatus(text, paused = false) {
    statusText.textContent = text;
    statusEl.classList.toggle('paused', paused);
  }

  /* Timer: pauses while a lesson is on screen or the console is minimised */
  function timerStart() {
    if (game.startedAt) return;
    game.startedAt = performance.now();
    clearInterval(game.ticker);
    game.ticker = setInterval(paintTimer, 250);
  }
  function timerStop() {
    if (game.startedAt) game.elapsed += performance.now() - game.startedAt;
    game.startedAt = 0;
    clearInterval(game.ticker);
    paintTimer();
  }
  const timeNow = () => game.elapsed + (game.startedAt ? performance.now() - game.startedAt : 0);
  function paintTimer() { timerEl.textContent = fmt(timeNow()); }
  function penalty() {
    game.elapsed += 5000;
    game.wrong += 1;
    paintTimer();
    sound.play('bad');
    const nudge = $('#nudge');
    if (nudge) nudge.scrollIntoView({ block: 'nearest' });
  }

  function scatter() {
    const set = (el, spreadX, minY, maxY, rot) => {
      el.style.setProperty('--dx', `${rand(-spreadX, spreadX).toFixed(1)}px`);
      el.style.setProperty('--dy', `${rand(minY, maxY).toFixed(1)}px`);
      el.style.setProperty('--r', `${rand(-rot, rot).toFixed(1)}deg`);
    };
    letters.forEach((el) => set(el, 7, 6, 46, 16));
    $$('.wobble').forEach((el) => set(el, 10, 2, 16, 2.4));
    $$('.tilt-2').forEach((el) => set(el, 12, 4, 26, 3.2));
    $$('.tilt-3').forEach((el) => set(el, 12, 6, 30, 2.8));
  }

  function setMapStage(fixedUpTo) {
    [1, 2, 3].forEach((n) => {
      const ok = n <= fixedUpTo;
      $(`[data-node="${n}"]`).classList.toggle('ok', ok);
      $(`[data-pipe="${n}"]`).classList.toggle('ok', ok);
    });
  }

  function focusHeading() {
    const heading = $('h2', consoleBody);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }

  function arm() {
    if (game.state !== 'idle') return;
    game.state = 'armed';
    chaosSwitch.dataset.step = 'armed';
    chaosSwitch.setAttribute('aria-label', 'Chaos test. Cover lifted. Flip the switch to start a simulated outage.');
    chaosStep.textContent = 'Cover lifted. Your move.';
    chaosNote.textContent = 'Go on then.';
  }

  function trigger() {
    game.state = 'outage';
    game.elapsed = 0; game.startedAt = 0; game.wrong = 0; game.minimised = false;
    chaosSwitch.dataset.step = 'flipped';
    chaosSwitch.disabled = true;
    timerEl.textContent = '00:00';
    setMapStage(0);
    scatter();
    if (!reduced) {
      body.classList.add('flicker');
      after(1000, () => body.classList.remove('flicker'));
    }
    body.classList.add('broken-1', 'broken-2', 'broken-3');
    setTheme('outage');
    setStatus('MAJOR OUTAGE');
    net.refresh();
    sound.play('alarm');
    announce('Simulated outage started. The on-call console has opened.');
    after(reduced ? 0 : 900, openPager);
  }

  function openPager() {
    consoleEl.hidden = game.minimised;
    consoleId.textContent = 'PAGE RECEIVED';
    consoleBody.innerHTML = `
      <p class="console-kicker">Pager</p>
      <h2 id="consoleTitle">You're on call. Soham's portfolio is down.</h2>
      <p>Three incidents stand between visitors and this site. Each one comes from something Soham wrote about or built. Fix them to find the root cause.</p>
      <button class="c-btn" id="ackBtn" type="button">Acknowledge page</button>`;
    $('#ackBtn').addEventListener('click', () => { timerStart(); startIncident(1); });
    game.scrollAnchor = scrollY;
    $('#ackBtn').focus({ preventScroll: true });
  }

  function startIncident(n) {
    game.state = `incident${n}`;
    game.takeawayOpen = false;
    consoleId.textContent = `INCIDENT ${n} OF 3`;
    timerStart();
    ({ 1: incidentConfig, 2: incidentRegion, 3: incidentLeak })[n]();
    focusHeading();
    announce(`Incident ${n} of 3.`);
  }

  /* Incident 1: an oversized generated config (from the Cloudflare post) */
  function incidentConfig() {
    const names = shuffle(['bot_rules', 'geo_rules', 'rate_limits', 'asn_lists', 'ml_features', 'tls_policies']);
    const badIndex = randInt(0, names.length - 1);
    const rows = names.map((name, i) => ({
      name, rows: i === badIndex ? randInt(203, 236) : randInt(148, 197), bad: i === badIndex,
    }));
    consoleBody.innerHTML = `
      <p class="console-kicker">Edge returning 5xx</p>
      <h2 id="consoleTitle">One bad config</h2>
      <p>A database change made a generated file return duplicate rows, and it was pushed everywhere. The proxy has a hard limit of <strong>200 rows</strong> per section. Find the section over the limit and roll it back.</p>
      <div class="cfg">
        <p class="cfg-head">edge-proxy.generated.conf</p>
        ${rows.map((r, i) => `<button class="cfg-line" type="button" data-i="${i}"><span>${r.name}</span><span>${r.rows} rows</span></button>`).join('')}
      </div>
      <p class="nudge" id="nudge" role="status"></p>`;
    $$('.cfg-line', consoleBody).forEach((btn) => btn.addEventListener('click', () => {
      if (rows[Number(btn.dataset.i)].bad) {
        btn.classList.add('right');
        $$('.cfg-line', consoleBody).forEach((b) => { b.disabled = true; });
        fixed(1, 'Rolled back. The edge is serving again.',
          'Valid-looking data can still cross a limit deep in the stack. Chaos tests should cover oversized config, not just lost servers.',
          'https://dev.to/thesoham/when-one-config-file-shook-the-edge-lessons-from-the-cloudflare-outage-c4b',
          'Read my Cloudflare outage post');
      } else {
        btn.classList.add('wrong');
        penalty();
        $('#nudge').textContent = 'That section is inside the limit. Check each count against 200. (+5s)';
      }
    }));
  }

  /* Incident 2: a region loses DNS for its database (from the 15-hour post) */
  function incidentRegion() {
    const healthyIsA = Math.random() < .5;
    const regions = [
      { name: 'Primary', dns: false, note: 'failed', fix: 'That is the failed primary. Traffic is still stuck there.' },
      { name: 'Standby A', dns: healthyIsA, note: healthyIsA ? 'healthy' : 'degraded' },
      { name: 'Standby B', dns: !healthyIsA, note: healthyIsA ? 'degraded' : 'healthy' },
    ];
    consoleBody.innerHTML = `
      <p class="console-kicker">Region health checks failing</p>
      <h2 id="consoleTitle">The region went dark</h2>
      <p>The primary region's database endpoint stopped resolving, and everything built on it is falling over. Move traffic to the standby that can still reach its database.</p>
      <div class="regions">
        ${regions.map((r, i) => `<div class="region" data-r="${i}"><b>${r.name}</b><span class="${r.dns ? 'good' : 'bad'}">${r.note}</span><span>database DNS</span><span class="${r.dns ? 'good' : 'bad'}">${r.dns ? 'resolving' : 'no answer'}</span></div>`).join('')}
      </div>
      <label class="slider-label" for="trafficSlider">Traffic target: <span id="sliderValue">Primary</span></label>
      <input id="trafficSlider" type="range" min="0" max="2" step="1" value="0">
      <button class="c-btn" id="shiftBtn" type="button">Shift traffic</button>
      <p class="nudge" id="nudge" role="status"></p>`;
    const slider = $('#trafficSlider');
    const paint = () => {
      const i = Number(slider.value);
      $('#sliderValue').textContent = regions[i].name;
      $$('.region', consoleBody).forEach((el, k) => el.classList.toggle('selected', k === i));
    };
    slider.addEventListener('input', paint);
    paint();
    $('#shiftBtn').addEventListener('click', () => {
      const target = regions[Number(slider.value)];
      if (target.dns) {
        $('#shiftBtn').disabled = true;
        slider.disabled = true;
        fixed(2, `Traffic is on ${target.name}. The region layer is healthy.`,
          "Multi-AZ doesn't help when a region's core services fail. Critical workloads need a second region and a mapped dependency graph.",
          'https://builder.aws.com/content/34QloXs9zELw0rsOJFVbw1btMCX/the-day-the-internet-froze-a-15-hour-wake-up-call',
          'Read "The Day the Internet Froze"');
      } else {
        penalty();
        $('#nudge').textContent = `${target.fix || `${target.name} can't reach its database either.`} (+5s)`;
      }
    });
  }

  /* Incident 3: find the mismatch, then prove the repair (LeakSpot's rule) */
  function incidentLeak() {
    const leakAt = randInt(1, 3);
    const inflow = randInt(70, 95) * 10;
    const loss = randInt(3, 7) * 10;
    let flow = inflow;
    const zones = ['A', 'B', 'C', 'D', 'E'].map((name, i) => {
      const zone = { name, in: flow, out: i === leakAt ? flow - loss : flow, leak: i === leakAt };
      flow = zone.out;
      return zone;
    });
    consoleBody.innerHTML = `
      <p class="console-kicker">Data layer losing flow</p>
      <h2 id="consoleTitle">The leak you can't see</h2>
      <p>Nothing has alarmed, yet something is draining the system. Water in and water out should match at every junction. Pick the one where they don't.</p>
      <div class="zones">
        ${zones.map((z, i) => `<button class="zone" type="button" data-i="${i}" aria-label="Junction ${z.name}, ${z.in} in, ${z.out} out"><b>${z.name}</b><span>in ${z.in}</span><span>out ${z.out}</span></button>`).join('')}
      </div>
      <p class="nudge" id="nudge" role="status"></p>
      <div class="readings" id="readings" hidden>
        <span class="reading">reading 1</span><span class="reading">reading 2</span><span class="reading">reading 3</span>
      </div>`;
    $$('.zone', consoleBody).forEach((btn) => btn.addEventListener('click', () => {
      if (zones[Number(btn.dataset.i)].leak) {
        btn.classList.add('right');
        $$('.zone', consoleBody).forEach((b) => { b.disabled = true; });
        sound.play('good');
        $('#nudge').textContent = 'Repair sent. The ticket stays open until the meters prove it.';
        $('#readings').hidden = false;
        $('#readings').scrollIntoView({ block: 'nearest' });
        const readings = $$('.reading', consoleBody);
        readings.forEach((el, i) => after(700 * (i + 1), () => {
          el.classList.add('done');
          el.textContent = 'clean';
          announce(`Clean reading ${i + 1} of 3.`);
          if (i === 2) {
            after(400, () => fixed(3, 'Three clean readings. Ticket closed.',
              'In LeakSpot a repair only counts when the meters prove it. If the leak is still there, the ticket reopens by itself.',
              'https://builder.aws.com/content/3KXuwcHFfMrLzqK8r9HGcYmq1Pt/leakspot-finding-the-water-a-city-cant-see',
              'Read how LeakSpot works'));
          }
        }));
      } else {
        btn.classList.add('wrong');
        penalty();
        $('#nudge').textContent = "That junction balances. Compare each junction's in and out. (+5s)";
      }
    }));
  }

  const repairTargets = { 1: '#top', 2: '#about', 3: '#projects' };

  /* Our own scrolling must never count as the visitor scrolling away */
  function autoScrollTo(selector) {
    game.autoScrolling = true;
    const done = () => {
      removeEventListener('scrollend', done);
      game.autoScrolling = false;
      game.scrollAnchor = scrollY;
    };
    addEventListener('scrollend', done);
    after(2500, done);
    $(selector).scrollIntoView({ behavior: scrollMode, block: 'start' });
  }

  /* One fix: bring that part of the page back, then show what it teaches */
  function fixed(n, headline, lesson, link, linkText) {
    timerStop();
    game.takeawayOpen = true;
    sound.play('good');
    setMapStage(n);
    if (!game.minimised) autoScrollTo(repairTargets[n]);
    after(reduced ? 0 : 520, () => { body.classList.remove(`broken-${n}`); net.refresh(); });
    const last = n === 3;
    consoleBody.innerHTML = `
      <p class="console-kicker">Incident ${n} resolved</p>
      <h2 id="consoleTitle">${headline}</h2>
      <p class="lesson">${lesson} <a href="${link}" target="_blank" rel="noopener noreferrer">${linkText}</a></p>
      <button class="c-btn go" id="nextBtn" type="button">${last ? 'Close the incident' : 'Next incident'}</button>`;
    $('#nextBtn').addEventListener('click', () => (last ? resolve() : startIncident(n + 1)));
    announce(headline);
    focusHeading();
  }

  function rankFor(ms) {
    if (ms <= 30000) return 'Incident Commander';
    if (ms <= 60000) return 'SRE';
    return 'On-Call Intern';
  }

  function resolve() {
    game.state = 'resolved';
    timerStop();
    clearPending();
    const total = game.elapsed;
    const best = Number(store.get('best')) || 0;
    if (!best || total < best) store.set('best', String(Math.round(total)));

    consoleEl.hidden = true;
    chip.hidden = true;
    game.minimised = false;
    body.classList.remove('broken-1', 'broken-2', 'broken-3', 'calm');
    body.classList.add('pm-open');
    autoScrollTo('#top');
    setStatus('All systems operational');
    sound.play('clear');
    setTheme('night');
    sky.constellation();

    $('#pmTime').textContent = fmt(total);
    $('#pmRank').textContent = rankFor(total);
    $('#pmWrong').textContent = String(game.wrong);
    postmortem.hidden = false;
    $('#pmTitle').focus({ preventScroll: true });
    themeToggle.hidden = false;
    announce(`All systems operational. Time to recovery ${fmt(total)}.`);
  }

  /* The single way home. Safe to call from any state. */
  function restore(theme = preferredTheme) {
    clearPending();
    clearInterval(game.ticker);
    game.state = 'idle';
    game.minimised = false;
    game.takeawayOpen = false;
    game.autoScrolling = false;
    game.elapsed = 0;
    game.startedAt = 0;
    game.wrong = 0;
    body.classList.remove('broken-1', 'broken-2', 'broken-3', 'calm', 'flicker', 'pm-open');
    consoleEl.hidden = true;
    chip.hidden = true;
    postmortem.hidden = true;
    consoleBody.textContent = '';
    setStatus('All systems operational');
    setTheme(theme);
    chaosSwitch.disabled = false;
    chaosSwitch.dataset.step = 'closed';
    chaosSwitch.setAttribute('aria-label', 'Chaos test. Lift the safety cover.');
    chaosStep.textContent = 'Lift the cover, then flip the switch.';
    paintBest();
    net.refresh();
  }

  function paintBest() {
    const best = Number(store.get('best')) || 0;
    chaosNote.textContent = best ? `Your best recovery: ${fmt(best)}. Beat it?` : "Don't press this. I've built for it.";
    if (best) themeToggle.hidden = false;
  }

  function minimise() {
    if (!isActive() || game.minimised) return;
    game.minimised = true;
    timerStop();
    consoleEl.hidden = true;
    body.classList.add('calm');
    setTheme(preferredTheme);
    setStatus('Incident paused', true);
    chipText.textContent = 'Resume on-call';
    chip.hidden = false;
    announce('Console minimised. The page is restored. Use Resume on-call to continue.');
  }

  function resume() {
    if (!game.minimised) return;
    game.minimised = false;
    chip.hidden = true;
    body.classList.remove('calm');
    setTheme('outage');
    setStatus('MAJOR OUTAGE');
    consoleEl.hidden = false;
    game.scrollAnchor = scrollY;
    if (/^incident\d$/.test(game.state) && !game.takeawayOpen) timerStart();
    focusHeading();
    net.refresh();
  }

  /* Wiring ------------------------------------------------------------------- */
  chaosSwitch.addEventListener('click', () => {
    interacted = true;
    if (game.state === 'idle') arm();
    else if (game.state === 'armed') trigger();
  });

  $('#skipBtn').addEventListener('click', () => {
    restore();
    announce('Site restored.');
    chaosSwitch.focus({ preventScroll: true });
  });
  $('#minimiseBtn').addEventListener('click', () => { minimise(); chip.focus({ preventScroll: true }); });
  chip.addEventListener('click', resume);

  const soundBtn = $('#soundBtn');
  soundBtn.addEventListener('click', () => {
    const on = sound.toggle();
    soundBtn.textContent = on ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(on));
  });

  $('#keepNight').addEventListener('click', () => {
    postmortem.hidden = true;
    restore('night');
    choosePreferredTheme('night');
    sky.showDim();
    chaosSwitch.focus({ preventScroll: true });
  });
  $('#backDay').addEventListener('click', () => {
    choosePreferredTheme('day');
    restore('day');
    chaosSwitch.focus({ preventScroll: true });
  });

  const copyBtn = $('#copyResult');
  copyBtn.addEventListener('click', async () => {
    const text = `I brought Soham Deshmukh's portfolio back from a simulated outage in ${$('#pmTime').textContent} (${$('#pmRank').textContent}). Can you beat it? ${location.origin}${location.pathname}`;
    const label = copyBtn.firstElementChild;
    try {
      await navigator.clipboard.writeText(text);
      label.textContent = 'Copied';
    } catch {
      label.textContent = 'Copy not available';
    }
    setTimeout(() => { label.textContent = 'Copy my result'; }, 1600);
  });

  themeToggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'night' ? 'day' : 'night';
    choosePreferredTheme(next);
    if (next === 'night') sky.showDim();
  });

  $('#navBreak').addEventListener('click', (e) => {
    e.preventDefault();
    closeMenu();
    if (game.minimised) { resume(); return; }
    if (isActive()) return;
    if (game.state === 'idle') arm();
    $('#top').scrollIntoView({ behavior: scrollMode });
    chaosSwitch.focus({ preventScroll: true });
  });

  /* Any other in-page link during an outage: minimise so navigation just works */
  $$('a[href^="#"]').forEach((a) => {
    if (a.id === 'navBreak') return;
    a.addEventListener('click', () => { closeMenu(); minimise(); });
  });

  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!postmortem.hidden) {
      $('#backDay').click();
    } else if (isActive() || game.minimised) {
      restore();
      announce('Site restored.');
      chaosSwitch.focus({ preventScroll: true });
    } else if (nav.classList.contains('open')) {
      closeMenu();
      menuBtn.focus();
    }
  });

  addEventListener('scroll', () => {
    if (!isActive() || game.minimised || consoleEl.hidden) return;
    if (game.autoScrolling) return;
    if (Math.abs(scrollY - game.scrollAnchor) > innerHeight * .9) minimise();
  }, { passive: true });

  /* The hint: one small rattle if nobody has touched anything for a while */
  let interacted = false;
  ['pointerdown', 'keydown'].forEach((type) => addEventListener(type, () => { interacted = true; }, { once: true }));
  if (!reduced) {
    setTimeout(() => {
      if (interacted || game.state !== 'idle') return;
      chaosBox.classList.add('rattle');
      setTimeout(() => chaosBox.classList.remove('rattle'), 600);
    }, 6000);
  }

  /* Start ---------------------------------------------------------------------- */
  setTheme(preferredTheme);
  if (preferredTheme === 'night') sky.showDim();
  paintBest();
})();
