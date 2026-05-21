/* ULTRONOS // Autonomous Store Command Center (v1) */
(() => {
  'use strict';

  const state = {
    speed: 1, paused: false,
    revenue: 4908.72, orders: 8, products: 10, agentsActive: 5,
    tokens: 82401, day: 47, shipped: 536, output: 538, sent: 482,
    queue: 17, pass: 80, throughput: 117, sessions: 1284, rev24: 184.40
  };

  const AGENTS = {
    trend:   { name: 'ASTRA',  role: 'Recon Analyst',  produced: '142 indexed', tasks: 12, active: '4h 11m', color: 'cyan' },
    ideas:   { name: 'VEGA',   role: 'Ideation',       produced: '47 concepts', tasks: 9,  active: '3h 02m', color: 'violet' },
    script:  { name: 'NOVA',   role: 'Copy Synth',     produced: '88 scripts',  tasks: 6,  active: '5h 18m', color: 'magenta' },
    image:   { name: 'PIXEL',  role: 'Visual Forge',   produced: '312 renders', tasks: 11, active: '6h 44m', color: 'orange' },
    listing: { name: 'FORGE',  role: 'Listing Smith',  produced: '400 items',   tasks: 17, active: '2h 14m', color: 'amber' },
    seo:     { name: 'SAGE',   role: 'Keyword Oracle', produced: '62 optims',   tasks: 0,  active: 'standby', color: 'green' },
    qa:      { name: 'LUMEN',  role: 'Integrity Audit',produced: '188 passed',  tasks: 4,  active: '5h 32m', color: 'cyan' },
    publish: { name: 'ATLAS',  role: 'Deploy Engineer',produced: '24 launched', tasks: 2,  active: '4h 02m', color: 'orange' },
    msg:     { name: 'ECHO',   role: 'Support Liaison',produced: '156 replied', tasks: 5,  active: '7h 21m', color: 'green' },
    sales:   { name: 'ORACLE', role: 'Revenue Sentinel', produced: '$4,908.72', tasks: 1, active: '∞', color: 'amber' }
  };

  const PRODUCTS = ['Velvet Tarot Deck', 'Lunar Affirmations 3.0', 'Cyberpunk Cat Tee',
    'Birthstone Moon Ritual', 'Minimalist Witch Print', 'Crypto Sigil Sticker',
    'Lo-Fi Spell Journal', 'AI Oversized Hoodie', 'Self-Improvement Planner',
    'Mystic Affirmation Card', 'Neon Crystal Poster', 'Astro Mug 2.0'];

  const FEED_TEMPLATES = [
    { lvl: 'info', text: 'PIXEL // batch #{n} render complete' },
    { lvl: 'ok',   text: 'ATLAS // "{name}" → live on etsy' },
    { lvl: 'info', text: 'ASTRA // scraped {n} trend signals' },
    { lvl: 'warn', text: 'LUMEN // ⚠ flagging blurry mockup batch #{n}' },
    { lvl: 'ok',   text: 'ECHO // ticket #{n} resolved (refund)' },
    { lvl: 'info', text: 'NOVA // copy synth: "{name}"' },
    { lvl: 'info', text: 'FORGE // SKU MN-LR-{n} assembled' },
    { lvl: 'ok',   text: 'SAGE // title optimized +{n}% CTR' },
    { lvl: 'ok',   text: 'ORACLE // revenue +${n} last hour' }
  ];

  const $ = id => document.getElementById(id);
  const setText = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const fmtMoney = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = n => Math.floor(n).toLocaleString('en-US');
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const pad2 = n => String(Math.floor(n)).padStart(2, '0');

  function tickClock() {
    const now = new Date();
    setText('hud-clock', `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`);
  }

  function tick() {
    if (state.paused) return;
    state.revenue += rand(0.4, 2.8) * state.speed;
    state.rev24 += rand(0.05, 0.4) * state.speed;
    state.tokens -= Math.floor(rand(5, 22) * state.speed);
    state.sessions += Math.floor(rand(0, 3) * state.speed);
    if (Math.random() < 0.02 * state.speed) state.orders++;
    if (Math.random() < 0.008 * state.speed) state.products++;
    if (Math.random() < 0.04 * state.speed) state.output++;
    if (Math.random() < 0.035 * state.speed) state.shipped++;
    if (Math.random() < 0.03 * state.speed) state.sent++;
    state.pass = 78 + Math.floor(Math.sin(Date.now() / 5000) * 4);
    paint();
  }

  function paint() {
    setText('stat-revenue', fmtMoney(state.revenue));
    setText('stat-orders', state.orders);
    setText('stat-products', state.products);
    setText('stat-agents-active', state.agentsActive);
    setText('stat-day', String(state.day).padStart(3, '0'));
    setText('ps-pass', state.pass);
    setText('ps-output', state.output);
    setText('ps-shipped', state.shipped);
    setText('ps-sent', state.sent);
    setText('ps-queue', state.queue);
    setText('metric-rev24', fmtMoney(state.rev24));
    setText('metric-conv', (3.5 + Math.sin(Date.now() / 7000) * 0.6).toFixed(1));
    setText('metric-aov', fmtMoney(state.rev24 / Math.max(1, state.orders) * 1.2));
    setText('metric-sessions', fmtInt(state.sessions));
    setText('oq-rev', fmtMoney(state.revenue / 2.5));
  }

  function drawSalesChart() {
    const line = $('sales-line'); const area = $('sales-area');
    if (!line) return;
    const w = 400, h = 90, pts = 40;
    const data = [];
    for (let i = 0; i < pts; i++) {
      const x = (i / (pts - 1)) * w;
      const wave = Math.sin(i * 0.4 + Date.now() / 5000) * 18 + Math.sin(i * 0.9) * 10;
      const trend = (i / pts) * -22;
      data.push([x, 55 + trend + wave + (Math.random() - 0.5) * 3]);
    }
    let d = `M${data[0][0]} ${data[0][1]}`;
    for (let i = 1; i < pts; i++) d += ` L${data[i][0]} ${data[i][1].toFixed(1)}`;
    line.setAttribute('d', d);
    if (area) area.setAttribute('d', d + ` L${w} ${h} L0 ${h} Z`);
  }

  const feedList = $('feed-list');
  function pushFeed() {
    if (!feedList || state.paused) return;
    const tpl = pick(FEED_TEMPLATES);
    const text = tpl.text.replace('{n}', Math.floor(rand(1, 999))).replace('{name}', pick(PRODUCTS));
    const now = new Date();
    const ts = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    const li = document.createElement('li');
    li.innerHTML = `<span class="t">${ts}</span><span class="lvl ${tpl.lvl}">${tpl.lvl.toUpperCase()}</span><span>${text}</span>`;
    feedList.prepend(li);
    while (feedList.children.length > 22) feedList.lastChild.remove();
  }

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sp = parseFloat(btn.dataset.speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (sp === 0) { state.paused = true; return; }
      state.paused = false; state.speed = sp;
    });
  });

  function updatePopup(roomKey) {
    const a = AGENTS[roomKey]; if (!a) return;
    setText('popup-name', a.name);
    setText('popup-sub', a.role.toLowerCase());
    setText('popup-agent', a.name);
    setText('popup-produced', a.produced);
    setText('popup-tasks', a.tasks);
    setText('popup-active', a.active);
    setText('popup-autos', `${a.tasks} active`);
  }
  document.querySelectorAll('.chamber').forEach(ch => {
    ch.addEventListener('mouseenter', () => updatePopup(ch.dataset.room));
    // Chamber click — silent. (Was firing 'AGENT: name' toast on every click.)
  });
  document.querySelectorAll('.bn-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.bn-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      // Nav button click — silent (was firing toast on every tab click)
    });
  });
  document.querySelectorAll('.mission').forEach(m => {
    m.addEventListener('click', () => {
      const title = m.querySelector('.mission__title')?.textContent || '';
      // Mission click — silent (was firing toast on every mission click)
    });
  });

  const toasts = $('toasts');
  function toast(type, title, msg) {
    if (!toasts) return;
    const t = document.createElement('div');
    t.className = `toast ${type === 'ok' ? 'ok' : type === 'warn' ? 'warn' : ''}`;
    const icon = type === 'ok' ? '✓' : type === 'warn' ? '⚠' : '◉';
    t.innerHTML = `<span class="icon">${icon}</span><div class="body"><strong>${title}</strong>${msg}</div>`;
    toasts.appendChild(t);
    setTimeout(() => t.remove(), 5200);
  }

  const burst = $('mission-burst');
  function triggerBurst(productName) {
    // Manual trigger only — bound to 'D' key + real Atlas/publish completions.
    // Does NOT fake-increment shipped/revenue counters anymore — those were
    // showing fictional sales numbers in the HUD.
    const label = productName || pick(PRODUCTS);
    setText('burst-name', label.toUpperCase());
    burst.classList.add('active');
    toast('ok', 'DEPLOYED', `${label} is live`);
    setTimeout(() => burst.classList.remove('active'), 1800);
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'd' || e.key === 'D') triggerBurst();
    if (e.key === 's' || e.key === 'S') startAllAgentsRouted();
    if (e.key === 'p' || e.key === 'P') pauseAllAgentsRouted();
    if (e.key === 'r' || e.key === 'R') resetAllAgentsRouted();
  });

  // ============================================================
  // API CLIENT — connects to the ULTRONOS dashboard API
  //
  // Override the base by setting window.__AGENT_API_BASE__ before app.js loads.
  // Defaults to http://localhost:3000 (local dev).
  // For Render: set it to your web service URL, e.g.
  //   <script>window.__AGENT_API_BASE__='https://ultronos-dashboard-api.onrender.com'</script>
  // ============================================================

  const API_BASE = (window.__AGENT_API_BASE__ || 'http://localhost:3000') + '/api';
  let apiMode = false;
  let astraResult = null;

  async function apiHealth() {
    try { const r = await fetch(API_BASE + '/health'); return r.ok; }
    catch { return false; }
  }
  async function apiGet(p) {
    const r = await fetch(API_BASE + p);
    if (!r.ok) throw new Error(`GET ${p} → ${r.status}`);
    return r.json();
  }
  async function apiPost(p, body) {
    const r = await fetch(API_BASE + p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `POST ${p} → ${r.status}`);
    return d;
  }

  /** Update chambers from server state */
  function applyServerAgents(serverAgents) {
    serverAgents.forEach(sa => {
      // Find the chamber matching this agent id (chamber data-room === agent.id)
      const ch = document.querySelector(`.chamber[data-room="${sa.id}"]`);
      if (!ch) return;
      ch.dataset.status = sa.status;
      ch.dataset.active = String(sa.active);

      // Update progress bar
      const bar = ch.querySelector('.ch-bar__fill');
      if (bar) bar.style.setProperty('--w', Math.floor(sa.progress) + '%');

      // Update meta line — show currentTask + status
      const meta = ch.querySelector('.ch-meta');
      if (meta) {
        const label = sa.active
          ? (sa.currentTask ? sa.currentTask : labelFor(sa.status))
          : 'idle · press start';
        const left = meta.querySelector('span:first-child');
        const right = meta.querySelector('span:last-child');
        if (left) left.textContent = label;
        if (right) right.textContent = Math.floor(sa.progress) + '%';
      }

      // Status pill (top-right of chamber)
      const statusEl = ch.querySelector('.cm-status');
      if (statusEl) statusEl.textContent = pillFor(sa.status);

      // If this agent is the one in the popup, refresh popup
      if ($('popup-name')?.textContent === sa.name || $('popup-agent')?.textContent === sa.name) {
        setText('popup-sub', sa.currentTask || sa.lastAction || '—');
      }
    });
  }
  function labelFor(s) {
    return ({idle:'Idle',thinking:'Thinking…',working:'Working',waiting:'Waiting',complete:'Complete ✓',error:'Error ⚠'})[s] || s;
  }
  function pillFor(s) {
    return ({idle:'◯ IDLE',thinking:'◌ THINKING',working:'● WORKING',waiting:'◐ WAITING',complete:'✓ COMPLETE',error:'⚠ ERROR'})[s] || s;
  }

  async function pollApi() {
    try {
      const data = await apiGet('/agents/status');
      applyServerAgents(data.agents);
    } catch {
      apiMode = false;
      setApiPill('offline');
    }
  }

  // ---------- Routed control functions ----------
  async function startAllAgentsRouted() {
    if (apiMode) {
      try { await apiPost('/agents/start'); toast('ok','API','All agents started'); await pollApi(); return; }
      catch (e) { toast('warn','API',e.message); }
    } else {
      // Local fallback: nothing required, the existing local tick keeps running
      // Silent local-fallback start
    }
  }
  async function pauseAllAgentsRouted() {
    if (apiMode) {
      try { await apiPost('/agents/pause'); toast('warn','API','All agents paused'); await pollApi(); return; }
      catch (e) { toast('warn','API',e.message); }
    } else {
      // Silent local-fallback reset
    }
  }
  async function resetAllAgentsRouted() {
    if (apiMode) {
      try { await apiPost('/agents/reset'); toast('info','API','Agents reset'); astraResult = null; await pollApi(); return; }
      catch (e) { toast('warn','API',e.message); }
    }
  }
  async function startAgentRouted(id) {
    if (apiMode) {
      try {
        const data = await apiPost(`/agents/${id}/start`);
        if (id === 'trend' && Array.isArray(data.result)) {
          astraResult = data.result;
          toast('ok','ASTRA',`Generated ${data.result.length} Etsy ideas`);
          renderAstraIdeas();
        } else {
          // Silent per-agent start confirmation (was creating noise on every chamber start)
        }
        await pollApi();
      } catch (e) { toast('warn','API',`${id}: ${e.message}`); }
    }
  }

  // ---------- API status pill in left rail ----------
  function setApiPill(state) {
    let pill = $('api-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'api-pill';
      pill.style.cssText = 'position:fixed;top:90px;right:14px;z-index:60;padding:6px 12px;font-family:Share Tech Mono,monospace;font-size:10px;letter-spacing:0.18em;border:1.5px solid;border-radius:3px;background:rgba(8,7,28,0.85);';
      document.body.appendChild(pill);
    }
    if (state === 'connected') {
      pill.textContent = '● API CONNECTED';
      pill.style.color = '#6effb0'; pill.style.borderColor = '#6effb0';
    } else {
      pill.textContent = '○ API OFFLINE (local mock)';
      pill.style.color = '#ff9b3d'; pill.style.borderColor = '#ff9b3d';
    }
  }

  // ---------- Floating Agent Controls bar ----------
  function injectAgentControls() {
    const bar = document.createElement('div');
    bar.id = 'agent-controls';
    bar.style.cssText = `
      position: fixed;
      top: 92px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 55;
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(8,7,28,0.92);
      border: 1.5px solid #00e5ff;
      border-radius: 4px;
      font-family: 'Rajdhani', sans-serif;
    `;
    bar.innerHTML = `
      <button id="ac-start" style="padding:10px 16px;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;color:#050414;background:linear-gradient(180deg,#5bf1ff,#00e5ff);border:0;border-radius:3px;cursor:pointer;">▶ START ALL ASTRA+9</button>
      <button id="ac-pause" style="padding:10px 14px;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.16em;color:#00e5ff;background:transparent;border:1.5px solid #00e5ff;border-radius:3px;cursor:pointer;">❚❚ PAUSE</button>
      <button id="ac-reset" style="padding:10px 14px;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.16em;color:#00e5ff;background:transparent;border:1.5px solid #00e5ff;border-radius:3px;cursor:pointer;">↻ RESET</button>
    `;
    document.body.appendChild(bar);
    $('ac-start').addEventListener('click', startAllAgentsRouted);
    $('ac-pause').addEventListener('click', pauseAllAgentsRouted);
    $('ac-reset').addEventListener('click', resetAllAgentsRouted);
  }

  // ---------- Render Astra's generated Etsy ideas ----------
  function renderAstraIdeas() {
    if (!astraResult || !Array.isArray(astraResult)) return;
    // Inject a panel into the right column (ops-panel) at the top
    let panel = $('astra-ideas-panel');
    const opsPanel = document.querySelector('.ops-panel');
    if (!opsPanel) return;
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'astra-ideas-panel';
      panel.className = 'panel panel--corners';
      opsPanel.insertBefore(panel, opsPanel.firstChild);
    }
    panel.innerHTML = `
      <div class="panel__head">
        <span class="panel__title">ASTRA — ETSY PRODUCT IDEAS</span>
        <span class="panel__tag glow">${astraResult.length} GENERATED</span>
      </div>
      <ol style="display:flex;flex-direction:column;gap:8px;font-size:11px;list-style:none;padding:0;margin:0;">
        ${astraResult.map((idea, i) => `
          <li style="background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.3);border-radius:3px;padding:8px 10px;">
            <div style="font-family:'Orbitron',sans-serif;font-weight:700;color:#5bf1ff;font-size:12px;">${i+1}. ${escapeHtml(idea.title || '')}</div>
            <div style="margin-top:3px;color:#e8ecff;line-height:1.4;">${escapeHtml(idea.description || '')}</div>
            <div style="margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:10px;color:rgba(255,255,255,0.55);">
              👥 ${escapeHtml(idea.target_audience || '')}
              · 💰 ${escapeHtml(idea.estimated_price_range || '')}
            </div>
          </li>
        `).join('')}
      </ol>
    `;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  // ---------- Chamber click → trigger startAgentRouted in API mode ----------
  document.querySelectorAll('.chamber').forEach(ch => {
    ch.addEventListener('click', () => {
      const room = ch.dataset.room;
      updatePopup(room);
      if (apiMode) {
        // In API mode, clicking Astra's chamber kicks off the real AI call
        if (room === 'trend') {
          toast('info','ASTRA','Generating 10 Etsy product ideas…');
          startAgentRouted('trend');
        }
      }
    });
  });

  // ============================================================
  // BOOT
  // ============================================================
  tickClock(); paint(); drawSalesChart();
  updatePopup('listing');
  for (let i = 0; i < 8; i++) pushFeed();
  injectAgentControls();
  setApiPill('offline');

  apiHealth().then(ok => {
    if (ok) {
      apiMode = true;
      setApiPill('connected');
      // Silent API connect
      setInterval(pollApi, 1500);
      pollApi();
    } else {
      // Silent offline notice
    }
  });

  setInterval(tickClock, 1000);
  setInterval(() => { if (!apiMode) tick(); }, 800);
  setInterval(() => { if (!apiMode) pushFeed(); }, 2200);
  setInterval(drawSalesChart, 5000);
  // Auto "DEPLOYED" burst removed — only fires now when YOU press the 'D'
  // key or actually deploy a product. No more fake deploys every 22s.
})();
