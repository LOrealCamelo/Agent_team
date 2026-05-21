/* ==========================================================================
   AI Agent Operations Hub — Phase 1: Functional Agent State Machine
   Frontend-only mock. No backend. No API keys.
   ========================================================================== */

(() => {
  'use strict';

  // ============================================================
  // 1. CONSTANTS & SEED DATA
  // ============================================================

  const STATUSES = ['idle', 'thinking', 'working', 'waiting', 'complete', 'error'];

  /**
   * NeuroSpicy Mystic — 10 real agents per Master Spec + Training Manual.
   * `built` = real worker-side agent exists (PM/Scribe/Researcher today).
   * Visual `stage` reuses existing chamber__stage--* CSS classes.
   * @type {Array<{id:string, name:string, role:string, color:string, built:boolean, stage:string, tasks:string[]}>}
   */
  const AGENT_DEFS = [
    {
      id: 'pm',
      name: 'PM',
      role: 'Master Strategist — daily Top-3 MITs',
      color: 'purple', built: true, stage: 'plan',
      tasks: [
        'Triage brain dump → Top 3 MITs',
        'Building dependency map for May Kit',
        'Eisenhower-sorting 14 backlog items',
        'Drafting 8am MIT message',
        'Auditing burndown for Week 4'
      ]
    },
    {
      id: 'scribe',
      name: 'Scribe',
      role: 'DM Drafter — IG/TikTok replies in your voice',
      color: 'purple', built: true, stage: 'chatbot',
      tasks: [
        'Drafting 5 IG DM replies',
        'Flagging urgent: collab >10k followers',
        'Auto-sending Cheat Code on "spell" trigger',
        'Telegram approve-queue ready',
        'Drafting TikTok comment thread responses'
      ]
    },
    {
      id: 'researcher',
      name: 'Researcher',
      role: 'Trend Hunter — daily 8am topics + hooks',
      color: 'cyan', built: true, stage: 'research',
      tasks: [
        "Pulling top 10 TikTok 'witchy' trends",
        "Indexing Etsy 'ADHD planner' searches",
        'Cited stat: ADHD diagnosis rates',
        "Alert: 'mercury retrograde' trending +340%",
        "Compiling 3 hooks for tonight's Live"
      ]
    },
    {
      id: 'content',
      name: 'Content',
      role: 'Content Creator — scripts, carousels, emails',
      color: 'gold', built: false, stage: 'code',
      tasks: [
        'Generating TikTok script: Rose Petal Wax',
        'Building IG carousel 10/10 slides',
        "Drafting email: 'Cheat Code drops Friday'",
        'Pulling brand photos from URL list',
        'Composing Canva mockup via API'
      ]
    },
    {
      id: 'poster',
      name: 'Poster',
      role: 'Publish Schedule — Make.com → IG/TikTok/FB',
      color: 'gold', built: false, stage: 'deploy',
      tasks: [
        'Scheduling 7pm EST post → IG',
        'Pushing carousel to TikTok with UTM',
        'Cross-posting to FB business page',
        'Confirming Make.com webhook',
        'Replying "Posted" to PM channel'
      ]
    },
    {
      id: 'product',
      name: 'Product',
      role: 'Listing Manager — Etsy / Stan / TikTok Shop',
      color: 'purple', built: false, stage: 'test',
      tasks: [
        'Listing Sticker Vault 500-pack on Etsy',
        'Building TikTok Shop 50-pack variant',
        'Generating 3 mockups via Canva API',
        'Wiring Stan digital-product automation',
        'Pricing audit: $9 vs $19 Digital tier'
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing',
      role: 'Ads Council — $20/day Meta, ROAS, kill/scale',
      color: 'cyan', built: false, stage: 'qa',
      tasks: [
        'Running Council on $20/day spend',
        'ROAS report: Cheat Code freebie funnel',
        'Kill/scale call: May Kit ad creative #3',
        'Drafting FB ad copy: tarot + ADHD interest',
        'Building funnel: Freebie → Vault → Kit'
      ]
    },
    {
      id: 'sales',
      name: 'Sales',
      role: 'Revenue Recovery — Stripe carts, Klaviyo upsells',
      color: 'cyan', built: false, stage: 'analytics',
      tasks: [
        'Stripe webhook: cart abandoned 1hr ago',
        'Klaviyo: drafting 48hr Vault upsell',
        'Weekly revenue by product report',
        'Case study email: "3 deposits proof"',
        'Computing 7-day revenue delta'
      ]
    },
    {
      id: 'djinn',
      name: 'Djinn',
      role: 'Inbound Voice — Vapi + ElevenLabs phone agent',
      color: 'cyan', built: false, stage: 'voice',
      tasks: [
        'Answering inbound: refund request <$27',
        'Booking tarot reading via Calendly API',
        'Sending Cheat Code link to caller',
        "FAQ: 'where's my sticker download'",
        "Escalating medical question to you"
      ]
    },
    {
      id: 'outbound',
      name: 'Outbound',
      role: 'Outbound Voice — 30-day check-ins, Kit offer',
      color: 'gold', built: false, stage: 'voice',
      tasks: [
        'Calling buyer 30 days post-Vault',
        'May Kit $27 offer to past customer',
        "Logging testimonial: 'rose petal worked'",
        'Troubleshoot: PDF not downloading',
        'Daily quota: 14 of 50 calls placed'
      ]
    }
  ];

  /**
   * Active missions = L'Oreal's real 5 active projects.
   * Each driven by completions from the agent(s) responsible.
   */
  const MISSIONS = [
    {
      id: 'cheat-code',
      title: 'Cheat Code PDF',
      reward: '$2,910 launch',
      drivers: ['content', 'product'],
      perCompletion: 5,
      progress: 95
    },
    {
      id: 'sticker-vault',
      title: 'Sticker Vault 500',
      reward: '$5,400 TikTok Shop',
      drivers: ['product'],
      perCompletion: 4,
      progress: 0
    },
    {
      id: 'audiobook',
      title: 'Before They Burned Us',
      reward: '$5,000 audiobook',
      drivers: ['scribe', 'content'],
      perCompletion: 6,
      progress: 10
    },
    {
      id: 'may-kit',
      title: 'May Nervous System Kit',
      reward: '$2,700 Apr 25',
      drivers: ['marketing', 'product'],
      perCompletion: 5,
      progress: 0
    }
  ];

  // ============================================================
  // 2. APP STATE
  // ============================================================

  /** @type {Array<Agent>} */
  let agents = [];

  const sim = {
    speed: 1,
    paused: true,        // start paused so user must click Start
    day: 6,
    revenue: 4908.72,
    orders: 1388,
    health: 98.7,
    cpu: 63, memory: 71, network: 54, storage: 68
  };

  /** Currently-open drawer agent (for drawer button wiring) */
  let drawerAgent = null;

  // Event ring buffer (global feed shown in #event-stream)
  const globalEvents = [];
  const MAX_GLOBAL_EVENTS = 18;
  const MAX_AGENT_LOGS = 50;

  // ============================================================
  // 3. UTILS
  // ============================================================

  const $ = id => document.getElementById(id);
  const setText = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const pad2 = n => String(Math.floor(n)).padStart(2, '0');
  const fmtMoney = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = n => Math.floor(n).toLocaleString('en-US');
  const nowIso = () => new Date().toISOString();
  const nowClock = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`; };

  // ============================================================
  // 4. AGENT FACTORY + STATE MACHINE
  // ============================================================

  /**
   * Agent shape:
   * { id, name, role, status, currentTask, progress, lastAction, logs[], active, createdAt, updatedAt }
   */
  function createAgent(def) {
    const t = nowIso();
    return {
      id: def.id,
      name: def.name,
      role: def.role,
      status: 'idle',
      currentTask: null,
      progress: 0,
      lastAction: 'Initialized',
      logs: [],
      active: false,
      createdAt: t,
      updatedAt: t,
      // Internal (private-ish, prefixed _)
      _color: def.color,
      _taskPool: def.tasks,
      _holdCounter: 0  // counts ticks in current sub-state (for complete/error dwell)
    };
  }

  function initAgents() {
    agents = AGENT_DEFS.map(createAgent);
  }

  function findAgent(id) {
    return agents.find(a => a.id === id);
  }

  /**
   * Per-tick advance for one agent.
   * State transitions (when active):
   *   idle → thinking (pick a task)
   *   thinking → working
   *   working → complete | error | waiting
   *   complete → idle (after brief dwell)
   *   error → (held until reset/restart)
   *   waiting → working (after brief dwell)
   */
  function tickAgent(agent) {
    if (!agent.active) return;

    const speed = sim.speed;

    switch (agent.status) {
      case 'idle': {
        // Pick a new task and start thinking
        agent.currentTask = pick(agent._taskPool);
        agent.progress = 0;
        agent.status = 'thinking';
        agent.lastAction = 'Started thinking about: ' + agent.currentTask;
        logAgent(agent, agent.lastAction, 'info');
        break;
      }

      case 'thinking': {
        agent.progress += rand(3, 7) * speed;
        if (agent.progress >= 15) {
          agent.status = 'working';
          agent.progress = 15;
          agent.lastAction = 'Working: ' + agent.currentTask;
          logAgent(agent, agent.lastAction, 'info');
        }
        break;
      }

      case 'working': {
        agent.progress += rand(1.5, 4.5) * speed;

        // Small chance to enter waiting (network/dep)
        if (Math.random() < 0.012 * speed && agent.progress < 80) {
          agent.status = 'waiting';
          agent._holdCounter = 0;
          agent.lastAction = 'Waiting on dependency';
          logAgent(agent, agent.lastAction, 'warn');
          break;
        }

        if (agent.progress >= 100) {
          agent.progress = 100;
          // ~6% chance of error on completion
          if (Math.random() < 0.06) {
            agent.status = 'error';
            agent._holdCounter = 0;
            agent.lastAction = 'Errored on: ' + agent.currentTask;
            logAgent(agent, agent.lastAction, 'err');
          } else {
            agent.status = 'complete';
            agent._holdCounter = 0;
            agent.lastAction = 'Completed: ' + agent.currentTask;
            logAgent(agent, agent.lastAction, 'ok');
            onAgentCompleted(agent);
          }
        }
        break;
      }

      case 'waiting': {
        agent._holdCounter++;
        if (agent._holdCounter >= Math.max(2, Math.floor(4 / speed))) {
          agent.status = 'working';
          agent.lastAction = 'Resumed: ' + agent.currentTask;
          logAgent(agent, agent.lastAction, 'info');
        }
        break;
      }

      case 'complete': {
        agent._holdCounter++;
        if (agent._holdCounter >= Math.max(2, Math.floor(3 / speed))) {
          agent.status = 'idle';
          agent.progress = 0;
          agent.currentTask = null;
        }
        break;
      }

      case 'error': {
        // Stay in error until restart/reset
        break;
      }
    }

    agent.updatedAt = nowIso();
  }

  function logAgent(agent, message, level = 'info') {
    const entry = { timestamp: nowIso(), message, level };
    agent.logs.unshift(entry);
    if (agent.logs.length > MAX_AGENT_LOGS) agent.logs.length = MAX_AGENT_LOGS;
    pushGlobalEvent(agent, message, level);
  }

  function pushGlobalEvent(agent, message, level) {
    globalEvents.unshift({ agent: agent.name, color: agent._color, time: nowClock(), text: message, level });
    if (globalEvents.length > MAX_GLOBAL_EVENTS) globalEvents.length = MAX_GLOBAL_EVENTS;
    renderEventStream();
  }

  function onAgentCompleted(agent) {
    // Drive missions forward
    MISSIONS.forEach(m => {
      if (m.drivers.includes(agent.id)) {
        m.progress = Math.min(100, m.progress + m.perCompletion);
        if (m.progress >= 100) {
          toast('ok', 'MISSION COMPLETE', m.title);
          triggerBurst(m.title);
          m.progress = 0; // loop
        }
      }
    });

    // Stats bump (decoupled from raw randomness)
    sim.orders += Math.floor(rand(0, 3));
    sim.revenue += rand(2, 14);
    if (agent.id === 'deploy') triggerBurst(pick(agent._taskPool));
  }

  // ============================================================
  // 5. CONTROLS (Start / Pause / Reset — global + per-agent)
  // ============================================================

  function startAgent(id) {
    const a = findAgent(id);
    if (!a) return;
    a.active = true;
    if (a.status === 'error' || a.status === 'complete') {
      a.status = 'idle';
      a.progress = 0;
    }
    a.updatedAt = nowIso();
    logAgent(a, 'Agent started', 'info');
  }

  function pauseAgent(id) {
    const a = findAgent(id);
    if (!a) return;
    a.active = false;
    a.lastAction = 'Paused';
    a.updatedAt = nowIso();
    logAgent(a, 'Agent paused', 'warn');
  }

  function resetAgent(id) {
    const a = findAgent(id);
    if (!a) return;
    a.status = 'idle';
    a.progress = 0;
    a.currentTask = null;
    a.lastAction = 'Reset';
    a.active = false;
    a._holdCounter = 0;
    a.updatedAt = nowIso();
    logAgent(a, 'Agent reset', 'info');
  }

  function startAllAgents() {
    sim.paused = false;
    agents.forEach(a => startAgent(a.id));
    toast('ok', 'AGENTS', `Started all ${agents.length} agents`);
    paintAll();
  }

  function pauseAllAgents() {
    sim.paused = true;
    agents.forEach(a => { a.active = false; a.updatedAt = nowIso(); });
    toast('warn', 'AGENTS', 'All agents paused');
    paintAll();
  }

  function resetAllAgents() {
    sim.paused = true;
    initAgents();
    // Reset mission progress to initial values
    MISSIONS[0].progress = 75;
    MISSIONS[1].progress = 60;
    MISSIONS[2].progress = 40;
    globalEvents.length = 0;
    renderEventStream();
    toast('info', 'AGENTS', 'All agents reset to idle');
    paintAll();
  }

  // Expose for debugging / future wiring
  window.__agents = {
    list: () => agents,
    start: startAgent,
    pause: pauseAgent,
    reset: resetAgent,
    startAll: startAllAgents,
    pauseAll: pauseAllAgents,
    resetAll: resetAllAgents,
    sim
  };

  // ============================================================
  // 6. PAINTERS (DOM updates)
  // ============================================================

  function paintChamber(agent) {
    const ch = document.querySelector(`.chamber[data-room="${agent.id}"]`);
    if (!ch) return;

    // Update task text
    const taskEl = ch.querySelector('.chamber__task');
    if (taskEl) {
      taskEl.textContent = agent.active
        ? (agent.currentTask
            ? `${statusLabel(agent.status)} · ${agent.currentTask}`
            : statusLabel(agent.status))
        : (agent.status === 'error' ? '⚠ error — needs restart' : 'idle · awaiting start');
    }

    // Status data attribute (available for future CSS hooks)
    ch.dataset.status = agent.status;
    ch.dataset.active = String(agent.active);
  }

  function statusLabel(s) {
    return {
      idle: 'Idle',
      thinking: 'Thinking…',
      working: 'Working',
      waiting: 'Waiting',
      complete: 'Complete ✓',
      error: 'Error ⚠'
    }[s] || s;
  }

  function paintDrawerIfOpen() {
    if (!drawerAgent) return;
    const a = findAgent(drawerAgent.id);
    if (!a) return;
    setText('drawer-name', a.name.toUpperCase());
    setText('drawer-role', a.role);
    setText('drawer-status', statusLabel(a.status));
    setText('drawer-queue', a.logs.length);
    const taskEl = $('drawer-task');
    if (taskEl) {
      taskEl.textContent = a.currentTask
        ? `${a.currentTask} — ${Math.floor(a.progress)}% complete`
        : (a.lastAction || '—');
    }
    const bar = document.querySelector('.drawer__bar-fill');
    if (bar) bar.style.setProperty('--w', Math.floor(a.progress) + '%');

    // Update log list with this agent's logs
    const logList = document.querySelector('.log-list');
    if (logList) {
      logList.innerHTML = a.logs.slice(0, 6).map(L => {
        const time = (new Date(L.timestamp));
        const ts = `${pad2(time.getHours())}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`;
        return `<li><span class="t">${ts}</span> ${escapeHtml(L.message)}</li>`;
      }).join('') || '<li><span class="t">--:--:--</span> No activity yet</li>';
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function paintStats() {
    const active = agents.filter(a => a.active && a.status !== 'idle' && a.status !== 'error').length;
    const flows = agents.filter(a => a.status === 'working').length;
    setText('stat-agents-active', active);
    setText('stat-flows', flows);
    setText('stat-revenue', fmtMoney(sim.revenue));
    setText('stat-orders', fmtInt(sim.orders));
    setText('stat-health', sim.health.toFixed(1));
    setText('stat-day', sim.day);

    // Usage bars drift gently
    document.querySelectorAll('.usage').forEach((row, i) => {
      const val = [sim.cpu, sim.memory, sim.network, sim.storage][i];
      if (val == null) return;
      const fill = row.querySelector('.usage__fill');
      const num  = row.querySelector('b');
      if (fill) fill.style.setProperty('--w', val.toFixed(0) + '%');
      if (num)  num.textContent = Math.floor(val) + '%';
    });
  }

  function paintMissions() {
    const missionEls = document.querySelectorAll('.mission');
    MISSIONS.forEach((m, i) => {
      const el = missionEls[i];
      if (!el) return;
      const fill = el.querySelector('.mission__fill');
      const pct = el.querySelector('.mission__pct');
      if (fill) fill.style.setProperty('--w', m.progress.toFixed(0) + '%');
      if (pct) pct.textContent = Math.floor(m.progress) + '%';
    });
  }

  function paintAll() {
    agents.forEach(paintChamber);
    paintStats();
    paintMissions();
    paintDrawerIfOpen();
  }

  // ============================================================
  // 7. EVENT STREAM render
  // ============================================================

  const botSvg = `<svg viewBox="0 0 24 24"><rect x="6" y="8" width="12" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9.5" cy="12" r="1" fill="currentColor"/><circle cx="14.5" cy="12" r="1" fill="currentColor"/><line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="3" r="1" fill="currentColor"/></svg>`;

  function renderEventStream() {
    const ul = $('event-stream');
    if (!ul) return;
    ul.innerHTML = globalEvents.map(e => `
      <li>
        <div class="event__avatar bot ${e.color}">${botSvg}</div>
        <div class="event__body">
          <div class="event__time">${e.time}</div>
          <div class="event__title">${escapeHtml(e.agent)}</div>
          <div class="event__desc">${escapeHtml(e.text)}</div>
        </div>
      </li>
    `).join('');
  }

  // ============================================================
  // 8. SIM DRIFTS (CPU/memory/health) — purely cosmetic
  // ============================================================

  function tickSimDrift() {
    if (sim.paused) return;
    sim.health = Math.max(94, Math.min(99.9, sim.health + (Math.random() - 0.5) * 0.08));
    sim.cpu = Math.max(20, Math.min(90, sim.cpu + (Math.random() - 0.5) * 2));
    sim.memory = Math.max(40, Math.min(92, sim.memory + (Math.random() - 0.5) * 1.4));
    sim.network = Math.max(20, Math.min(85, sim.network + (Math.random() - 0.5) * 2.5));
    sim.storage = Math.max(50, Math.min(80, sim.storage + (Math.random() - 0.5) * 0.6));
  }

  // ============================================================
  // 9. SPARKLINES (kept from previous)
  // ============================================================

  function drawSpark(rootId, color, trend = 'up') {
    const root = $(rootId);
    if (!root) return;
    const line = root.querySelector('.spark-line');
    const fill = root.querySelector('.spark-fill');
    const pts = 14, w = 60, h = 22;
    const data = [];
    for (let i = 0; i < pts; i++) {
      const x = (i / (pts - 1)) * w;
      const baseY = trend === 'up' ? h - (i / pts) * 12 - 4 : (i / pts) * 10 + 4;
      const noise = Math.sin(i * 0.6 + Date.now() / 4000) * 3 + (Math.random() - 0.5) * 2;
      data.push([x, baseY + noise]);
    }
    let d = `M${data[0][0]} ${data[0][1].toFixed(1)}`;
    for (let i = 1; i < pts; i++) d += ` L${data[i][0]} ${data[i][1].toFixed(1)}`;
    if (line) { line.setAttribute('d', d); line.style.stroke = color; }
    if (fill) fill.setAttribute('d', d + ` L${w} ${h} L0 ${h} Z`);
  }
  function drawAllSparks() {
    drawSpark('spark-revenue', '#22c55e', 'up');
    drawSpark('spark-orders', '#38e8ff', 'up');
    drawSpark('spark-flows', '#a855f7', 'up');
  }

  // ============================================================
  // 10. CLOCK
  // ============================================================
  function tickClock() { setText('hud-clock', nowClock()); }

  // ============================================================
  // 11. TOASTS
  // ============================================================
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

  // ============================================================
  // 12. MISSION BURST
  // ============================================================
  const burst = $('mission-burst');
  function triggerBurst(label) {
    if (!burst) return;
    setText('burst-name', label || pick(['api/v2 release', 'billing module', 'auth-rewrite']));
    burst.classList.add('active');
    setTimeout(() => burst.classList.remove('active'), 1800);
  }

  // ============================================================
  // 13. DRAWER
  // ============================================================
  const drawerEl = $('agent-drawer');
  const backdrop = $('backdrop');

  function openDrawer(roomKey) {
    const a = findAgent(roomKey);
    if (!a) return;
    drawerAgent = a;
    paintDrawerIfOpen();
    drawerEl.classList.add('open');
    backdrop.classList.add('show');
    drawerEl.setAttribute('aria-hidden', 'false');
  }
  function closeDrawer() {
    drawerAgent = null;
    drawerEl.classList.remove('open');
    backdrop.classList.remove('show');
    drawerEl.setAttribute('aria-hidden', 'true');
  }
  $('drawer-close')?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  document.querySelectorAll('.chamber').forEach(ch => {
    ch.addEventListener('click', () => openDrawer(ch.dataset.room));
  });

  // Wire drawer's START / PAUSE / RESTART buttons to current drawer agent
  const drawerActions = document.querySelectorAll('.drawer__actions button');
  if (drawerActions.length >= 3) {
    drawerActions[0].addEventListener('click', () => { if (drawerAgent) { startAgent(drawerAgent.id); sim.paused = false; paintAll(); }});
    drawerActions[1].addEventListener('click', () => { if (drawerAgent) { pauseAgent(drawerAgent.id); paintAll(); }});
    drawerActions[2].addEventListener('click', () => { if (drawerAgent) { resetAgent(drawerAgent.id); paintAll(); }});
  }

  // ============================================================
  // 14. SPEED CONTROL (existing)
  // ============================================================
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sp = parseFloat(btn.dataset.speed);
      if (sp === 0) {
        pauseAllAgents();
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        return;
      }
      sim.paused = false;
      sim.speed = sp;
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      toast('info', 'SPEED', `Simulation @ ${sp}×`);
    });
  });

  // ============================================================
  // 15. BOTTOM NAV + MISSIONS (cosmetic)
  // ============================================================
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      toast('info', btn.dataset.nav.toUpperCase(), `Switched to ${btn.dataset.nav} view`);
    });
  });

  document.querySelectorAll('.mission').forEach((m, i) => {
    m.addEventListener('click', () => {
      const ms = MISSIONS[i];
      toast('info', 'MISSION', `${ms?.title || 'Mission'} · ${Math.floor(ms?.progress || 0)}%`);
    });
  });

  // ============================================================
  // 16. INJECT AGENT CONTROL BAR (single new DOM element — no HTML edit)
  // ============================================================
  function injectControls() {
    const bar = document.createElement('div');
    bar.id = 'agent-controls';
    bar.style.cssText = `
      position: fixed;
      top: calc(var(--hud-top-h, 96px) + 22px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 35;
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: #0c1d3e;
      border: 1.5px solid #38e8ff;
      border-radius: 12px;
      font-family: 'Space Grotesk', sans-serif;
    `;
    bar.innerHTML = `
      <button class="primary-btn" id="ctl-start">▶ START ALL AGENTS</button>
      <button class="ghost-btn" id="ctl-pause" style="width:auto; margin:0; padding:10px 14px;">❚❚ PAUSE ALL</button>
      <button class="ghost-btn" id="ctl-reset" style="width:auto; margin:0; padding:10px 14px;">↻ RESET</button>
    `;
    document.body.appendChild(bar);
    $('ctl-start').addEventListener('click', startAllAgents);
    $('ctl-pause').addEventListener('click', pauseAllAgents);
    $('ctl-reset').addEventListener('click', resetAllAgents);
  }

  // ============================================================
  // 17. KEYBOARD SHORTCUTS
  // ============================================================
  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 's' || e.key === 'S') startAllAgents();
    if (e.key === 'p' || e.key === 'P') pauseAllAgents();
    if (e.key === 'r' || e.key === 'R') resetAllAgents();
    if (e.key === 'd' || e.key === 'D') triggerBurst('manual deploy');
  });

  // ============================================================
  // 18. API CLIENT (Phase 2 + 3)
  //
  // Tries the backend at API_BASE on boot. If reachable, the dashboard
  // pulls live agent state from the API every ~1.5s and routes controls
  // through it. If unreachable, falls back to the local mock above
  // (no change in UX).
  // ============================================================

  const API_BASE = (window.__AGENT_API_BASE__ || 'http://localhost:3000') + '/api';
  let apiMode = false;
  let researchResult = null; // Phase 3 — stored last result from Research Agent

  async function apiHealth() {
    try {
      const r = await fetch(API_BASE + '/health', { method: 'GET' });
      return r.ok;
    } catch { return false; }
  }
  async function apiGet(path) {
    const r = await fetch(API_BASE + path);
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json();
  }
  async function apiPost(path, body) {
    const r = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `POST ${path} → ${r.status}`);
    return data;
  }

  function applyServerAgents(serverAgents) {
    // Merge: keep local task pools etc, overlay server status/progress/etc
    serverAgents.forEach(sa => {
      const local = findAgent(sa.id);
      if (!local) return;
      local.status = sa.status;
      local.progress = sa.progress;
      local.active = sa.active;
      local.currentTask = sa.currentTask;
      local.lastAction = sa.lastAction;
      local.updatedAt = sa.updatedAt;
    });
    paintAll();
  }

  async function pollApi() {
    try {
      const data = await apiGet('/agents/status');
      applyServerAgents(data.agents);
    } catch (err) {
      // Drop back to local mode on persistent failure
      apiMode = false;
      setApiPill('offline');
    }
  }

  // ---------- Override controls to route through API when connected ----------
  const origStartAll = startAllAgents;
  const origPauseAll = pauseAllAgents;
  const origResetAll = resetAllAgents;
  const origStartOne = startAgent;
  const origPauseOne = pauseAgent;
  const origResetOne = resetAgent;

  async function startAllAgentsRouted() {
    if (apiMode) {
      try { await apiPost('/agents/start'); toast('ok','API','start all → API'); await pollApi(); return; }
      catch (e) { toast('warn','API',e.message); }
    }
    origStartAll();
  }
  async function pauseAllAgentsRouted() {
    if (apiMode) {
      try { await apiPost('/agents/pause'); toast('warn','API','pause all → API'); await pollApi(); return; }
      catch (e) { toast('warn','API',e.message); }
    }
    origPauseAll();
  }
  async function resetAllAgentsRouted() {
    if (apiMode) {
      try { await apiPost('/agents/reset'); toast('info','API','reset → API'); await pollApi(); return; }
      catch (e) { toast('warn','API',e.message); }
    }
    origResetAll();
  }
  async function startAgentRouted(id) {
    if (apiMode) {
      try {
        const data = await apiPost(`/agents/${id}/start`);
        // Phase 3: Research Agent returns generated ideas
        if (id === 'research' && Array.isArray(data.result)) {
          researchResult = data.result;
          toast('ok', 'RESEARCH', `Generated ${data.result.length} ideas`);
          paintDrawerIfOpen(); // re-paint to show ideas
        } else {
          toast('info','API',`${id} started`);
        }
        await pollApi();
        return;
      } catch (e) { toast('warn','API',`${id}: ${e.message}`); }
    }
    origStartOne(id);
  }
  async function stopAgentRouted(id) {
    if (apiMode) {
      try { await apiPost(`/agents/${id}/stop`); await pollApi(); return; }
      catch (e) { toast('warn','API',e.message); }
    }
    origPauseOne(id);
  }

  // Rebind injected control bar + drawer buttons to routed versions
  function rebindControls() {
    const start = document.getElementById('ctl-start');
    const pause = document.getElementById('ctl-pause');
    const reset = document.getElementById('ctl-reset');
    if (start) { start.onclick = startAllAgentsRouted; }
    if (pause) { pause.onclick = pauseAllAgentsRouted; }
    if (reset) { reset.onclick = resetAllAgentsRouted; }
    const drawerBtns = document.querySelectorAll('.drawer__actions button');
    if (drawerBtns.length >= 3) {
      drawerBtns[0].onclick = () => drawerAgent && startAgentRouted(drawerAgent.id);
      drawerBtns[1].onclick = () => drawerAgent && stopAgentRouted(drawerAgent.id);
      drawerBtns[2].onclick = () => { if (drawerAgent) origResetOne(drawerAgent.id); paintAll(); };
    }
  }

  // Visual API status indicator inside the floating control bar
  function setApiPill(state) {
    let pill = document.getElementById('api-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.id = 'api-pill';
      pill.style.cssText = 'margin-left:8px;padding:6px 10px;font-family:JetBrains Mono,monospace;font-size:10px;letter-spacing:0.16em;border-radius:999px;border:1.5px solid;';
      document.getElementById('agent-controls')?.appendChild(pill);
    }
    if (state === 'connected') {
      pill.textContent = '● API CONNECTED';
      pill.style.color = '#22c55e'; pill.style.borderColor = '#22c55e';
    } else {
      pill.textContent = '○ API OFFLINE (local mock)';
      pill.style.color = '#fbbf24'; pill.style.borderColor = '#fbbf24';
    }
  }

  // Extend drawer painter to show Research Agent's generated ideas
  const origPaintDrawer = paintDrawerIfOpen;
  paintDrawerIfOpen = function() {
    origPaintDrawer();
    if (!drawerAgent || drawerAgent.id !== 'research') return;
    const body = document.querySelector('.drawer__body');
    if (!body) return;
    let panel = document.getElementById('research-ideas');
    if (!researchResult || !Array.isArray(researchResult)) {
      if (panel) panel.remove();
      return;
    }
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'research-ideas';
      panel.className = 'drawer__section';
      body.appendChild(panel);
    }
    panel.innerHTML = `
      <div class="drawer__sec-title">GENERATED ETSY PRODUCT IDEAS (${researchResult.length})</div>
      <ol style="display:flex;flex-direction:column;gap:8px;font-size:12px;color:#eaf7ff;">
        ${researchResult.map((idea, i) => `
          <li style="background:#0e2148;border:1.5px solid #38e8ff;border-radius:6px;padding:10px 12px;">
            <div style="font-family:Space Grotesk,sans-serif;font-weight:700;color:#67e8f9;">${i+1}. ${escapeHtml(idea.title || '')}</div>
            <div style="margin-top:3px;color:#eaf7ff;">${escapeHtml(idea.description || '')}</div>
            <div style="margin-top:4px;font-family:JetBrains Mono,monospace;font-size:10.5px;color:#8fb6d9;">
              👥 ${escapeHtml(idea.target_audience || '')}
              · 💰 ${escapeHtml(idea.estimated_price_range || '')}
            </div>
          </li>
        `).join('')}
      </ol>
    `;
  };

  // ============================================================
  // 19. BOOT
  // ============================================================
  initAgents();
  injectControls();
  rebindControls();
  setApiPill('offline');
  tickClock();
  drawAllSparks();
  paintAll();

  // Try API connection; if available, switch to API-driven mode.
  apiHealth().then(ok => {
    if (ok) {
      apiMode = true;
      setApiPill('connected');
      toast('ok', 'API', 'Connected to ' + API_BASE);
      setInterval(pollApi, 1500);
      pollApi();
    } else {
      toast('info', 'API', 'Offline — using local mock');
    }
  });

  setInterval(tickClock, 1000);
  setInterval(() => {
    // Local sim only runs while NOT in API mode (server drives state instead)
    if (!apiMode) {
      tickSimDrift();
      agents.forEach(tickAgent);
      paintAll();
    }
  }, 700);
  setInterval(drawAllSparks, 4000);

  setTimeout(() => toast('info', 'SYSTEM', 'Press ▶ START ALL AGENTS to begin'), 600);
})();
