/* ═══════════════════════════════════════════════════════════
   BridgeLink 4.7 官网 · 交互与过渡动效
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;

/* ═════════ 1. 滚动进度条 ═════════ */
const progressBar = $('#scrollProgress span');
let lastScroll = 0;

function updateProgress() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
  progressBar.style.width = (p * 100).toFixed(2) + '%';
}

/* ═════════ 2. 导航：吸顶 / 滚动高亮 / 指示条 ═════════ */
const nav        = $('#nav');
const navLinks   = $$('#navLinks a[data-nav]');
const navIndicator = $('#navIndicator');
const navWrap    = $('#navLinks');

function onScrollNav() {
  const y = window.scrollY;
  nav.classList.toggle('is-stuck', y > 24);

  // 当前区块
  let active = null;
  const probe = y + window.innerHeight * 0.32;
  for (const a of navLinks) {
    const sec = document.querySelector(a.getAttribute('href'));
    if (!sec) continue;
    if (sec.offsetTop <= probe) active = a;
  }
  // 接近底部时激活最后一节
  if (window.innerHeight + y >= document.documentElement.scrollHeight - 120) {
    active = navLinks[navLinks.length - 1];
  }
  navLinks.forEach(a => a.classList.toggle('is-active', a === active));

  if (active && navWrap) {
    const r = active.getBoundingClientRect();
    const w = navWrap.getBoundingClientRect();
    navIndicator.style.width = r.width + 'px';
    navIndicator.style.transform = `translateX(${r.left - w.left}px)`;
    navIndicator.style.opacity = '1';
  } else {
    navIndicator.style.opacity = '0';
  }

  // 回到顶部按钮
  $('#toTop').classList.toggle('is-on', y > 700);
}

/* ═════════ 3. 滚动揭示 ═════════ */
function initReveal() {
  const items = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const d = +(e.target.dataset.delay || 0);
      setTimeout(() => e.target.classList.add('is-in'), d);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => io.observe(el));
}

/* ═════════ 3b. 步骤连接线绘制 ═════════ */
function initStepsLine() {
  const steps = $('.steps');
  if (!steps) return;
  if (!('IntersectionObserver' in window)) { steps.classList.add('is-in'); return; }
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('is-in'), 250);
      io.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  io.observe(steps);
}

/* ═════════ 4. 数字滚动计数 ═════════ */
function initCounters() {
  const nums = $$('[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      const target  = parseFloat(el.dataset.count);
      const dec     = +(el.dataset.decimals || 0);
      const prefix  = el.dataset.prefix || '';
      const suffix  = el.dataset.suffix || '';
      const isText  = el.dataset.text;

      if (isText) { el.textContent = isText; return; }
      if (REDUCED) { el.textContent = prefix + target.toFixed(dec) + suffix; return; }

      const dur = 1500, t0 = performance.now();
      const tick = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        const e = 1 - Math.pow(1 - t, 3);           // easeOutCubic
        const v = target * e;
        el.textContent = prefix + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => io.observe(n));
}

/* ═════════ 5. 磁性按钮 ═════════
   注意：这里**只写 CSS 变量**（--mag-x / --mag-y），由 CSS 负责合成 transform。
   早期版本直接写 el.style.transform，会把 CSS 里 .btn--primary:hover
   的 translateY(-2px)、.btn--ghost:hover 等规则**整个覆盖掉**，
   于是鼠标进出按钮时 transform 反复被两条规则抢写 ——
   表现就是"按钮忽大忽小 / 区域混乱"。
   改成变量后，hover 位移与磁性位移由 CSS 统一合成，互不打架。 */
function initMagnetic() {
  if (REDUCED || !window.matchMedia('(hover:hover)').matches) return;
  $$('[data-magnetic]').forEach(el => {
    el.style.setProperty('--mag-x', '0px');
    el.style.setProperty('--mag-y', '0px');
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.setProperty('--mag-x', (dx * 9).toFixed(2) + 'px');
      el.style.setProperty('--mag-y', (dy * 7).toFixed(2) + 'px');
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--mag-x', '0px');
      el.style.setProperty('--mag-y', '0px');
    });
  });
}

/* ═════════ 6. 涟漪点击 ═════════
   修复点：
   1) 同一个按钮同时只允许存在 1 个涟漪（连点时先移除旧的），
      否则连点几次会叠出好几个半透明圆，颜色越叠越浓、边界越叠越乱。
   2) 涟漪半径按"点击点到最远角的距离"算，保证能完整覆盖按钮且不溢出。
   3) 用 animationend 兜底移除，防止动画被中断时留下残余元素。 */
function initRipple() {
  $$('[data-ripple]').forEach(el => {
    el.addEventListener('click', (e) => {
      // 同按钮只保留一个涟漪
      const old = el.querySelector('.ripple');
      if (old) old.remove();

      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      const far = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(r.width - cx, cy),
        Math.hypot(cx, r.height - cy),
        Math.hypot(r.width - cx, r.height - cy)
      );
      const size = Math.max(1, far * 2);
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (cx - far) + 'px';
      span.style.top  = (cy - far) + 'px';
      span.addEventListener('animationend', () => span.remove(), { once: true });
      // 兜底：动画被中断（如按钮被移除）时也能清掉
      setTimeout(() => span.remove(), 800);
      el.appendChild(span);
    });
  });
}

/* ═════════ 7. 3D 倾斜 + 光斑跟随 ═════════
   同磁性按钮：只写 CSS 变量（--tilt-x / --tilt-y），
   由 CSS 合成 perspective + rotate，避免直接写 transform
   把卡片自身的 hover 效果覆盖掉。 */
function initTilt() {
  if (REDUCED || !window.matchMedia('(hover:hover)').matches) return;
  $$('[data-tilt]').forEach(el => {
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      el.style.setProperty('--tilt-x', ((0.5 - py) * 7).toFixed(2) + 'deg');
      el.style.setProperty('--tilt-y', ((px - 0.5) * 9).toFixed(2) + 'deg');
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    });
  });
}

/* ═════════ 8. 自定义光标 ═════════ */
function initCursor() {
  if (REDUCED || !window.matchMedia('(hover:hover)').matches) return;
  const dot = $('#cursorDot'), ring = $('#cursorRing');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    if (!document.body.classList.contains('cursor-ready')) {
      document.body.classList.add('cursor-ready');
      rx = mx; ry = my;
    }
  }, { passive: true });

  (function loop() {
    rx = lerp(rx, mx, 0.18);
    ry = lerp(ry, my, 0.18);
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();

  const HOVER = 'a, button, input, summary, .vgrid__cell, .themes__list button, .themes__accents button';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(HOVER)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(HOVER)) document.body.classList.remove('cursor-hover');
  });
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-ready'));
}

/* ═════════ 9. Hero 画布：局域网节点网络 ═════════ */
function initHeroCanvas() {
  const cv = $('#heroCanvas');
  if (!cv || REDUCED) return;
  const ctx = cv.getContext('2d');
  let w, h, dpr, nodes = [], raf;

  function accentRGB() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const m = v.match(/^#?([0-9a-f]{6})$/i);
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return [47, 129, 247];
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    const count = Math.min(58, Math.max(26, Math.round(w * h / 22000)));
    nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        r: 1.1 + Math.random() * 1.9,
        hub: Math.random() < 0.14
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const [ar, ag, ab] = accentRGB();
    const MAXD = 148;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < -30) n.x = w + 30; if (n.x > w + 30) n.x = -30;
      if (n.y < -30) n.y = h + 30; if (n.y > h + 30) n.y = -30;

      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        const dx = n.x - m.x, dy = n.y - m.y;
        const d = Math.hypot(dx, dy);
        if (d < MAXD) {
          const a = (1 - d / MAXD) * 0.24;
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${a})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      }

      const pulse = n.hub ? 0.55 + Math.sin(Date.now() / 480 + i) * 0.45 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (n.hub ? 1.9 : 1) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = n.hub
        ? `rgba(${ar},${ag},${ab},0.85)`
        : `rgba(${ar},${ag},${ab},0.42)`;
      ctx.fill();

      if (n.hub) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5.5 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.14)`;
        ctx.lineWidth = 1; ctx.stroke();
      }
    }
    raf = requestAnimationFrame(draw);
  }

  resize();
  draw();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 180); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { cancelAnimationFrame(raf); draw(); }
  });
}

/* ═════════ 10. Hero 应用窗口：视差 + 光标跨屏 ═════════ */
function initHeroApp() {
  const frame = $('#appFrame');
  const cursor = $('#heroCursor');
  if (!frame) return;

  // 视差倾斜
  if (!REDUCED && window.matchMedia('(hover:hover)').matches) {
    const hero = $('.hero');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty('--tilt-y', (px * 11).toFixed(2) + 'deg');
      frame.style.setProperty('--tilt-x', (-py * 8).toFixed(2) + 'deg');
    });
    hero.addEventListener('mouseleave', () => {
      frame.style.setProperty('--tilt-x', '0deg');
      frame.style.setProperty('--tilt-y', '0deg');
    });
  }

  // 光标在虚拟大屏里移动
  if (!cursor) return;
  const mapBox = cursor.parentElement;
  const cells = $$('.map__cell');

  function centerOf(cell) {
    const mb = mapBox.getBoundingClientRect();
    const r = cell.getBoundingClientRect();
    return { x: r.left - mb.left + r.width / 2, y: r.top - mb.top + r.height / 2 };
  }

  let ci = 0;
  // 光标移动与设备高亮必须由同一个节拍驱动。
  // 之前 place() 用 setTimeout(place, 2300)（首次 1200ms）、
  // mark() 用 setInterval(mark, 2300)（首次 2300ms），两个时钟不同步，
  // 结果是"高亮的格子"和"光标所在格子"始终错开一格。
  function step() {
    if (cells.length) {
      const idx = ci % cells.length;
      if (!REDUCED) {
        const p = centerOf(cells[idx]);
        cursor.style.transform = `translate(${p.x - 9}px, ${p.y - 9}px)`;
      }
      cells.forEach(c => c.classList.remove('is-active'));
      cells[idx].classList.add('is-active');
    }
    ci++;
    timer = setTimeout(step, 2300);
  }
  let timer = setTimeout(step, 1200);
  // 页面隐藏时停掉，切回来再续上，避免后台空转
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (!document.hidden) timer = setTimeout(step, 2300);
  });
}

/* ═════════ 11. 演示标签页 ═════════ */
function initDemoTabs() {
  const tabs = $$('[data-demo-tab]');
  const panels = $$('[data-demo-panel]');
  const ink = $('#demoTabInk');
  if (!tabs.length) return;

  function moveInk(tab) {
    if (!tab) return;
    const p = tab.parentElement;
    if (!p) return;
    // 用 offset* 布局坐标（不受祖先 scale/translate 影响）：
    // 指示条是 position:absolute; left:0，其 0 点与 tab.offsetLeft 同源
    // （都是相对 offsetParent .demo__tabs 的左沿），基准天然一致。
    // 之前用 getBoundingClientRect 会因 .demo.reveal 的 scale(0.965)
    // 产生约 4px 的视觉偏差。
    const w = tab.offsetWidth;
    if (!w) return;
    const left = tab.offsetLeft - (ink.offsetLeft || 0);
    ink.style.width = w + 'px';
    ink.style.transform = `translateX(${Math.round(left)}px)`;
  }

  function syncInk() {
    const active = tabs.find(t => t.classList.contains('is-active')) || tabs[0];
    moveInk(active);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      const key = tab.dataset.demoTab;
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.demoPanel === key));
      moveInk(tab);
    });
  });

  // 初始定位：连续两帧 + 字体加载完成后各定位一次，
  // 避免首帧字体未就绪导致 tab 宽度变化而指示条错位。
  requestAnimationFrame(() => {
    syncInk();
    requestAnimationFrame(syncInk);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncInk).catch(() => {});
  }
  window.addEventListener('resize', syncInk);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => syncInk());
    ro.observe(tabs[0].parentElement);
  }
}

/* ═════════ 11b. 跑马灯无缝循环 ═════════ */
function initMarquee() {
  const track = $('#marqueeTrack');
  if (!track) return;
  // 幂等：只复制一次。早期版本每次调用都 innerHTML += innerHTML，
  // 若 boot 被重复执行（热更新 / 脚本二次注入）内容会指数级膨胀，
  // 跑马灯会变得极慢且位置错乱。
  if (track.dataset.cloned === '1') return;
  track.dataset.cloned = '1';
  track.innerHTML += track.innerHTML;
}

/* ═════════ 12. 虚拟大屏：拖拽换位 + 光标演示 ═════════ */
function initVGrid() {
  const grid = $('#vgrid');
  if (!grid) return;
  const cells = $$('.vgrid__cell', grid);
  const cursor = $('#demoCursor');
  const ownerOut = $('#demoOwner');
  const standbyOut = $('#demoStandby');
  const coordsOut = $('#demoCoords');
  const startBtn = $('#demoStart');
  const stopBtn = $('#demoStop');
  const sw = $('#demoSwitch');

  // ── 拖拽换位 ──
  let dragging = null, dragOffset = { x: 0, y: 0 };

  cells.forEach(cell => {
    cell.addEventListener('pointerdown', (e) => {
      dragging = cell;
      cell.classList.add('is-dragging');
      cell.setPointerCapture(e.pointerId);
      const r = cell.getBoundingClientRect();
      dragOffset.x = e.clientX - r.left;
      dragOffset.y = e.clientY - r.top;
    });

    cell.addEventListener('pointermove', (e) => {
      if (dragging !== cell) return;
      const gr = grid.getBoundingClientRect();
      const x = e.clientX - gr.left - dragOffset.x;
      const y = e.clientY - gr.top - dragOffset.y;
      // 用 CSS 变量表达拖拽位移，transform 由 CSS 统一合成
      // （CSS 里 .vgrid__cell:hover / .is-dragging 也各自带 transform，
      //   之前 JS 直接写 style.transform 会把它们覆盖掉，导致
      //   "拖完格子后高亮/抬起效果错乱"）。
      cell.style.setProperty('--vx', x.toFixed(1) + 'px');
      cell.style.setProperty('--vy', y.toFixed(1) + 'px');
    });

    const end = (e) => {
      if (dragging !== cell) return;
      cell.classList.remove('is-dragging');
      cell.style.setProperty('--vx', '0px');
      cell.style.setProperty('--vy', '0px');
      dragging = null;

      // 命中检测 → 交换（--c/--r 是 1 起始的网格坐标）
      const gr = grid.getBoundingClientRect();
      const cols = 3, rows = 3;
      const cs = getComputedStyle(grid);
      const border = parseFloat(cs.borderLeftWidth) || 0;
      const pad = (parseFloat(cs.paddingLeft) || 0) + border;
      const gap = parseFloat(cs.gap) || 0;
      const cw = (gr.width - pad * 2 - gap * (cols - 1)) / cols;
      const ch = (gr.height - pad * 2 - gap * (rows - 1)) / rows;
      const cx = e.clientX - gr.left - pad;
      const cy = e.clientY - gr.top - pad;
      const c = clamp(Math.floor(cx / (cw + gap)), 0, cols - 1) + 1;
      const r = clamp(Math.floor(cy / (ch + gap)), 0, rows - 1) + 1;

      const target = cells.find(el =>
        parseInt(el.style.getPropertyValue('--c')) === c &&
        parseInt(el.style.getPropertyValue('--r')) === r);

      if (target && target !== cell) {
        const oc = cell.style.getPropertyValue('--c');
        const or = cell.style.getPropertyValue('--r');
        cell.style.setProperty('--c', c);
        cell.style.setProperty('--r', r);
        target.style.setProperty('--c', oc);
        target.style.setProperty('--r', or);
        flash(target);
      }
      try { cell.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    cell.addEventListener('pointerup', end);
    cell.addEventListener('pointercancel', end);
  });

  function flash(el) {
    el.animate(
      [{ boxShadow: '0 0 0 2px var(--accent)' }, { boxShadow: '0 0 0 0 transparent' }],
      { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' }
    );
  }

  // ── 光标跨屏演示 ──
  let owner = 0, running = true;
  const order = [0, 1, 3, 0, 2, 4, 0];
  let oi = 0, timer = null;

  function layoutOf(cell) {
    const gr = grid.getBoundingClientRect();
    const r = cell.getBoundingClientRect();
    return {
      x: r.left - gr.left + r.width / 2,
      y: r.top - gr.top + r.height / 2,
      w: r.width, h: r.height
    };
  }

  function moveCursor() {
    if (!cursor) return;
    const from = cells[owner];
    const next = (oi + 1) % order.length;
    const to = cells[order[next]];
    oi = next;

    const a = layoutOf(from), b = layoutOf(to);
    cursor.style.transform = `translate(${a.x - 13}px, ${a.y - 13}px)`;
    cursor.style.transition = 'transform 1.9s cubic-bezier(.45,.05,.25,1)';

    setTimeout(() => {
      if (!running) return;
      cursor.style.transform = `translate(${b.x - 13}px, ${b.y - 13}px)`;
      cells.forEach(c => c.classList.remove('is-owner'));
      to.classList.add('is-owner');
      owner = order[next];
      if (ownerOut) ownerOut.textContent = '光标归属 ' + to.querySelector('.vgrid__name').textContent;
      if (standbyOut) standbyOut.textContent = (cells.length - 1) + ' 台设备待命中';
      if (coordsOut) {
        coordsOut.textContent = 'x ' + Math.round(200 + Math.random() * 1800) +
                                ' · y ' + Math.round(120 + Math.random() * 900);
      }
    }, 60);
  }

  function startLoop() {
    stopLoop();
    timer = setInterval(() => { if (running) moveCursor(); }, 2600);
  }
  function stopLoop() { if (timer) { clearInterval(timer); timer = null; } }

  // 初始位置
  requestAnimationFrame(() => {
    const first = cells[0];
    const l = layoutOf(first);
    cursor.style.transform = `translate(${l.x - 13}px, ${l.y - 13}px)`;
    first.classList.add('is-owner');
    if (ownerOut) ownerOut.textContent = '光标归属 ' + first.querySelector('.vgrid__name').textContent;
  });
  startLoop();

  if (startBtn) startBtn.addEventListener('click', () => {
    running = true; startLoop();
    startBtn.textContent = '共享中…';
    startBtn.classList.add('btn--primary');
  });
  if (stopBtn) stopBtn.addEventListener('click', () => {
    running = false; stopLoop();
    if (startBtn) { startBtn.textContent = '开始共享'; startBtn.classList.remove('btn--primary'); }
    if (ownerOut) ownerOut.textContent = '共享已停止';
    cells.forEach(c => c.classList.remove('is-owner'));
  });
  if (sw) sw.addEventListener('change', () => {
    if (sw.checked) { startLoop(); } else { stopLoop(); }
  });

  window.addEventListener('resize', () => {
    const c = cells.find(x => x.classList.contains('is-owner')) || cells[0];
    const l = layoutOf(c);
    cursor.style.transition = 'none';
    cursor.style.transform = `translate(${l.x - 13}px, ${l.y - 13}px)`;
    setTimeout(() => { cursor.style.transition = ''; }, 50);
  });
}

/* ═══════════════════════════════════════════════════════════
   13. 主题与强调色
   —— 关键修复：应用内主题（左侧列表）**只作用于右侧预览面板**，
      绝不再写 documentElement 的 data-theme（那会把整个网页界面
      一起切掉背景色，看起来就是"预览污染了全站"）。
      网站整体的明暗只由顶部导航的 ☀/☾ 按钮控制，两者互不干扰。
   ═══════════════════════════════════════════════════════════ */
const APP_THEMES = [
  { key: 'light',    name: '浅色',       vars: { '--pv-bg':'#ffffff','--pv-side':'#f6f8fa','--pv-top':'#ffffff','--pv-card':'#ffffff','--pv-border':'#d0d7de','--pv-btn':'#f6f8fa','--pv-text':'#1f2328','--pv-muted':'#59636e','--pv-checked':'#ddf4ff' }, mini: ['#ffffff','#f6f8fa','#1f2328','#2f81f7'] },
  { key: 'dark',     name: '深色',       vars: { '--pv-bg':'#0d1117','--pv-side':'#010409','--pv-top':'#0d1117','--pv-card':'#161b22','--pv-border':'#30363d','--pv-btn':'#21262d','--pv-text':'#c9d1d9','--pv-muted':'#8b949e','--pv-checked':'#1b3a5c' }, mini: ['#0d1117','#161b22','#c9d1d9','#2f81f7'] },
  { key: 'midnight', name: '午夜',       vars: { '--pv-bg':'#15141b','--pv-side':'#100f15','--pv-top':'#15141b','--pv-card':'#1c1b24','--pv-border':'#2f2d3a','--pv-btn':'#252330','--pv-text':'#cfcbd8','--pv-muted':'#918c9e','--pv-checked':'#322a52' }, mini: ['#15141b','#1c1b24','#cfcbd8','#8250df'] },
  { key: 'nord',     name: '北欧极简',   vars: { '--pv-bg':'#2e3440','--pv-side':'#292e39','--pv-top':'#2e3440','--pv-card':'#353c48','--pv-border':'#434c5e','--pv-btn':'#3b4252','--pv-text':'#d8dee9','--pv-muted':'#a9b4c3','--pv-checked':'#3b4a5c' }, mini: ['#2e3440','#353c48','#d8dee9','#88c0d0'] },
  { key: 'solarized',name: '柔和暖阳',   vars: { '--pv-bg':'#fdf6e3','--pv-side':'#eee8d5','--pv-top':'#fdf6e3','--pv-card':'#fdf6e3','--pv-border':'#ded8c4','--pv-btn':'#eee8d5','--pv-text':'#586e75','--pv-muted':'#657b83','--pv-checked':'#cfe0c9' }, mini: ['#fdf6e3','#eee8d5','#586e75','#b58900'] },
  { key: 'system',   name: '跟随系统',   vars: null, mini: ['#0d1117','#f6f8fa','#1f2328','#8b949e'] }
];

const ACCENTS = [
  { key: 'blue',   name: '蓝', hex: '#2f81f7', btn: '#0969da' },
  { key: 'green',  name: '绿', hex: '#2da44e', btn: '#1a7f37' },
  { key: 'purple', name: '紫', hex: '#8250df', btn: '#6f42c1' },
  { key: 'orange', name: '橙', hex: '#bc4c00', btn: '#9a3412' },
  { key: 'pink',   name: '粉', hex: '#bf3989', btn: '#a5277a' },
  { key: 'red',    name: '红', hex: '#cf222e', btn: '#a40e26' }
];

function initThemes() {
  const list = $('#themeList');
  const preview = $('.pv');
  if (!list) return;

  // ── 生成主题列表 ──
  // 注意：这里用 data-app-theme，而不是 data-theme。
  // 因为站点 CSS 里有 html[data-theme="light"] 之类的规则，
  // 按钮若也叫 data-theme，就会被站点主题样式误伤（浅色按钮变白卡）。
  APP_THEMES.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.appTheme = t.key;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="tname">${t.name}</span>
      <span class="tmini">${t.mini.map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
    b.addEventListener('click', () => applyTheme(t.key));
    list.appendChild(b);
  });

  function applyTheme(key) {
    const t = APP_THEMES.find(x => x.key === key) || APP_THEMES[1];

    // 1) 只切换高亮态（唯一允许改的"选中"标记）
    $$('#themeList button').forEach(x => {
      const on = x.dataset.appTheme === key;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // 2) 只写预览面板上的 --pv-* 变量
    if (preview) {
      let vars = t.vars;
      if (!vars) {   // 跟随系统
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        vars = (sysDark ? APP_THEMES[1] : APP_THEMES[0]).vars;
      }
      Object.entries(vars).forEach(([k, v]) => preview.style.setProperty(k, v));
    }

    // 3) 明确不碰 documentElement —— 全站明暗由顶部 ☀/☾ 单独控制
  }

  // 初始：默认深色，并且**同步高亮态**（之前是写死 index===1，
  // 结果 JS 重建列表后高亮的和实际生效的对不上，出现"浅色一直高亮"）
  applyTheme('dark');

  // ── 强调色选择器 ──
  const panel = $('#accentPanel');
  const grid  = $('#accentGrid');
  const list2 = $('#accentList2');

  ACCENTS.forEach(a => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.background = a.hex;
    b.style.color = a.hex;
    b.title = a.name;
    b.dataset.accentKey = a.key;
    b.setAttribute('aria-label', '强调色 ' + a.name);
    b.addEventListener('click', () => setAccent(a.key));
    grid.appendChild(b);

    if (list2) {
      const b2 = b.cloneNode(true);
      b2.addEventListener('click', () => setAccent(a.key));
      list2.appendChild(b2);
    }
  });

  function setAccent(key) {
    const a = ACCENTS.find(x => x.key === key) || ACCENTS[0];
    document.documentElement.setAttribute('data-accent', key);
    $$('#accentGrid button, #accentList2 button').forEach(b => {
      b.classList.toggle('is-on', b.dataset.accentKey === key);
    });
    $('#accentSwatch').style.background = a.hex;
    // 预览面板里的强调色也跟着换（预览内部令牌，与全站 --accent 分开）
    if (preview) {
      preview.style.setProperty('--pv-accent', a.hex);
      preview.style.setProperty('--pv-accent-btn', a.btn);
      preview.style.setProperty('--pv-on-accent', '#ffffff');
    }
    localStorage.setItem('bridgelink-accent', key);
    panel.hidden = true;
  }

  // 初始
  const saved = localStorage.getItem('bridgelink-accent');
  if (saved && ACCENTS.some(a => a.key === saved)) setAccent(saved);
  else setAccent('blue');

  $('#accentBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
  });
  document.addEventListener('click', (e) => {
    if (panel.hidden) return;
    // 用 closest 判定：e.target 可能是按钮内部的 <span>/.ripple，
    // 直接比较 e.target !== btn 会失效（点按钮不关闭、点别处也不关）。
    const btn = $('#accentBtn');
    if (!panel.contains(e.target) && !(btn && btn.contains(e.target))) {
      panel.hidden = true;
    }
  });

  // 网站明暗切换（与上方主题列表完全独立）
  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bridgelink-mode', next);
  });
  const savedMode = localStorage.getItem('bridgelink-mode');
  if (savedMode) document.documentElement.setAttribute('data-theme', savedMode);
}

/* ═════════ 14. FAQ 手风琴（单开） ═════════ */
function initFaq() {
  const items = $$('#faqList details');
  items.forEach(d => {
    d.addEventListener('toggle', () => {
      if (d.open) items.forEach(o => { if (o !== d) o.open = false; });
    });
  });
}

/* ═════════ 15. 复制命令行 ═════════ */
function initCopy() {
  const btn = $('#copyBtn');
  const code = $('#cliCode');
  if (!btn || !code) return;
  const label = btn.querySelector('span');

  const flash = (text, ok) => {
    label.textContent = text;
    btn.classList.toggle('is-done', ok);
    btn.classList.toggle('is-fail', !ok);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      label.textContent = '复制';
      btn.classList.remove('is-done', 'is-fail');
    }, 1900);
  };

  btn.addEventListener('click', async () => {
    const text = code.textContent;
    let ok = false;
    try {
      // clipboard API 在无权限/无焦点的环境下可能永不 settle，加超时兜底
      ok = await Promise.race([
        navigator.clipboard.writeText(text).then(() => true),
        new Promise(res => setTimeout(() => res(false), 600)),
      ]);
    } catch (_) { ok = false; }

    if (!ok) {
      // 回退：临时 textarea + execCommand
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand('copy');
        ta.remove();
      } catch (_) { ok = false; }
    }
    flash(ok ? '已复制' : '复制失败', ok);
  });
}

/* ═════════ 16. 移动端菜单 ═════════ */
function initBurger() {
  const burger = $('#navBurger');
  const links = $('#navLinks');
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    links.classList.toggle('is-open');
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    links.classList.remove('is-open');
  }));
}

/* ═════════ 17. 回到顶部 ═════════ */
function initToTop() {
  $('#toTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  });
}

/* ═════════ 18. 浮动卡片视差 ═════════ */
function initFloatParallax() {
  if (REDUCED || !window.matchMedia('(hover:hover)').matches) return;
  const hero = $('.hero');
  const cards = $$('[data-float]');
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cards.forEach((c, i) => {
      const depth = (i + 1) * 14;
      c.style.setProperty('--px', (px * depth).toFixed(1) + 'px');
      c.style.setProperty('--py', (py * depth).toFixed(1) + 'px');
    });
  });
}

/* ═════════ 19. Hero 标题逐字入场 ═════════ */
function initHeroTitle() {
  const h = $('.hero__title');
  if (!h) return;
  setTimeout(() => h.classList.add('is-in'), 220);
}

/* ═════════ 启动 ═════════ */
function boot() {
  initReveal();
  initStepsLine();
  initCounters();
  initMagnetic();
  initRipple();
  initTilt();
  initCursor();
  initHeroCanvas();
  initHeroApp();
  initDemoTabs();
  initMarquee();
  initVGrid();
  initThemes();
  initFaq();
  initCopy();
  initBurger();
  initToTop();
  initFloatParallax();
  initHeroTitle();

  const onScroll = () => { updateProgress(); onScrollNav(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // 性能条在进入视口后动画
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (e.isIntersecting) { e.target.style.width = e.target.style.getPropertyValue('--w'); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  $$('.perf__bar i').forEach(i => io.observe(i));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
})();
