const THEME_KEY = "ca_tema_preferido";
const CHAT_KEY = "ca_chat_historial";
const STEPS_KEY = "centro_academico_pasos_trabajo3";
const API_CONFIG_KEY = "ca_apis_config_v2";

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* Estado compartido de APIs (Canvas + Google Gemini) */
const DEFAULT_API_CONFIG = {
  connected: true,
  canvasUrl: "https://virginiogomez.instructure.com",
  canvasToken: "canvas_demo_token_activo",
  geminiKey: "AIzaSy_demo_gemini_activa"
};

function loadApiConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(API_CONFIG_KEY) || "null");
    if (raw && typeof raw === "object") {
      return {
        connected: Boolean(raw.connected && raw.canvasToken && raw.geminiKey),
        canvasUrl: raw.canvasUrl || DEFAULT_API_CONFIG.canvasUrl,
        canvasToken: raw.canvasToken || "",
        geminiKey: raw.geminiKey || ""
      };
    }
  } catch {
    // Usar configuracion por defecto
  }
  return { ...DEFAULT_API_CONFIG };
}

function saveApiConfig(config) {
  try {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignorar
  }
}

let apiConfig = loadApiConfig();

function areApisReady() {
  return Boolean(apiConfig.connected && apiConfig.canvasToken.trim() && apiConfig.geminiKey.trim());
}

/* Tema claro / oscuro */
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

  const toggleBtn = document.querySelector("#theme-toggle");
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-pressed", String(isDark));
    toggleBtn.textContent = isDark ? "Modo claro" : "Modo oscuro";
  }
}

const savedTheme = (() => {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
})();

applyTheme(savedTheme);

const themeToggle = document.querySelector("#theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignorar si storage esta bloqueado
    }
  });
}

/* Temporizador en vivo para la proxima entrega */
function initCountdown() {
  const timerEl = document.querySelector("#countdown-timer");
  const alertEl = document.querySelector("#countdown-alert");
  const cardEl = document.querySelector("#next-deadline-card");
  const badgeEl = document.querySelector("#countdown-badge");
  if (!timerEl) return;

  const deadlineIso = (window.ACADEMIC_DATA && window.ACADEMIC_DATA.nextDeadlineIso) || "2026-11-24T16:30:00";
  const targetTime = new Date(deadlineIso).getTime();

  function tick() {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      timerEl.textContent = "00h 00m 00s";
      if (alertEl) alertEl.textContent = "Plazo cumplido: verifica que el envío esté confirmado.";
      if (badgeEl) badgeEl.textContent = "Cerrado";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = n => String(n).padStart(2, "0");
    timerEl.textContent = days > 0
      ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

    const hoursLeft = totalSeconds / 3600;
    if (cardEl && badgeEl && alertEl) {
      cardEl.classList.remove("state-good", "state-warn", "state-bad");
      badgeEl.classList.remove("b-low", "b-med", "b-crit");

      if (hoursLeft <= 36) {
        cardEl.classList.add("state-bad");
        badgeEl.classList.add("b-crit");
        badgeEl.textContent = "Urgente";
        alertEl.textContent = "Alerta: queda poco tiempo para cerrar y subir el Trabajo 3.";
      } else if (hoursLeft <= 72) {
        cardEl.classList.add("state-warn");
        badgeEl.classList.add("b-med");
        badgeEl.textContent = "En curso";
        alertEl.textContent = "Avanza hoy en los pasos pendientes de la entrega.";
      } else {
        cardEl.classList.add("state-good");
        badgeEl.classList.add("b-low");
        badgeEl.textContent = "A tiempo";
        alertEl.textContent = "Tienes buen margen de tiempo para la entrega.";
      }
    }
  }

  tick();
  setInterval(tick, 1000);
}

initCountdown();

/* Sincronizar estado visual de APIs en sidebar y asistente */
function syncApiUi() {
  const ready = areApisReady();
  const apiBtn = document.querySelector("#api-config-btn");
  const apiLabel = document.querySelector("#api-btn-label");
  const chatBadge = document.querySelector("#chatbot-api-badge");
  const chatDot = document.querySelector(".chatbot-dot");

  if (apiBtn && apiLabel) {
    apiBtn.classList.toggle("is-connected", ready);
    apiBtn.classList.toggle("is-disconnected", !ready);
    apiLabel.textContent = ready ? "APIs funcionando" : "Configurar APIs";
  }

  if (chatBadge) {
    chatBadge.textContent = ready ? "Gemini activo" : "Sin API";
    chatBadge.classList.toggle("is-online", ready);
    chatBadge.classList.toggle("is-offline", !ready);
  }

  if (chatDot) {
    chatDot.classList.toggle("is-offline", !ready);
  }
}

/* Modal de configuracion de APIs (Canvas + Google Gemini) con guias paso a paso */
function initApiConfig() {
  const apiBtn = document.querySelector("#api-config-btn");
  if (!apiBtn) return;

  const modal = document.createElement("div");
  modal.id = "api-modal";
  modal.className = "modal-backdrop";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "api-modal-title");
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-card modal-card-wide">
      <div class="modal-header">
        <h2 id="api-modal-title">Configurar APIs</h2>
        <button id="api-modal-close" class="modal-close" type="button" aria-label="Cerrar ventana">×</button>
      </div>

      <form id="api-modal-form" class="modal-form" novalidate>
        <section class="api-section">
          <h3>1. API de Canvas (ramos, entregas y notas)</h3>
          <div class="form-field">
            <label for="api-url-input">URL de Canvas</label>
            <input id="api-url-input" type="url" placeholder="https://tu-institucion.instructure.com" required>
          </div>
          <div class="form-field">
            <label for="api-token-input">Token de acceso de Canvas</label>
            <input id="api-token-input" type="password" placeholder="Pega tu token personal de Canvas" required>
          </div>
          <details class="api-guide">
            <summary>¿Cómo obtener tu token de Canvas?</summary>
            <ol>
              <li>Inicia sesión en tu cuenta de Canvas.</li>
              <li>Abre <strong>Cuenta</strong> en la barra izquierda y entra a <strong>Configuración</strong>.</li>
              <li>Baja hasta <strong>Integraciones aprobadas</strong> y presiona <strong>+ Nuevo token de acceso</strong>.</li>
              <li>Escribe un propósito (ej. Centro académico), genera el token, cópialo y pégalo arriba.</li>
            </ol>
          </details>
        </section>

        <section class="api-section">
          <h3>2. API de Google Gemini (asistente académico)</h3>
          <div class="form-field">
            <label for="api-gemini-input">API Key de Google Gemini</label>
            <input id="api-gemini-input" type="password" placeholder="Pega tu clave AIza..." required>
          </div>
          <details class="api-guide">
            <summary>¿Cómo obtener tu API key de Google Gemini?</summary>
            <ol>
              <li>Entra a <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio (aistudio.google.com/apikey)</a> con tu cuenta de Google.</li>
              <li>Presiona <strong>Create API key</strong> (Crear clave de API).</li>
              <li>Copia la clave generada y pégala arriba para activar las respuestas del asistente.</li>
            </ol>
          </details>
        </section>

        <p id="api-modal-error" class="field-error" role="alert" hidden></p>
        <p id="api-modal-status" class="api-status-note"></p>

        <div class="modal-actions">
          <button id="api-disconnect-btn" class="secondary-button" type="button">Desconectar</button>
          <button class="primary-button" type="submit">Guardar y activar APIs</button>
        </div>
      </form>
    </div>
  `;

  document.body.append(modal);

  const closeBtn = modal.querySelector("#api-modal-close");
  const disconnectBtn = modal.querySelector("#api-disconnect-btn");
  const form = modal.querySelector("#api-modal-form");
  const urlInput = modal.querySelector("#api-url-input");
  const tokenInput = modal.querySelector("#api-token-input");
  const geminiInput = modal.querySelector("#api-gemini-input");
  const errorEl = modal.querySelector("#api-modal-error");
  const statusNote = modal.querySelector("#api-modal-status");

  function openApiModal() {
    urlInput.value = apiConfig.canvasUrl || DEFAULT_API_CONFIG.canvasUrl;
    tokenInput.value = apiConfig.canvasToken || "";
    geminiInput.value = apiConfig.geminiKey || "";
    errorEl.hidden = true;
    errorEl.textContent = "";
    statusNote.textContent = areApisReady()
      ? "Estado: Canvas y Google Gemini activos."
      : "Estado: faltan claves por configurar para activar la sincronización y el asistente.";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    tokenInput.focus();
  }

  function closeApiModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    apiBtn.focus();
  }

  apiBtn.addEventListener("click", openApiModal);
  closeBtn.addEventListener("click", closeApiModal);

  modal.addEventListener("click", event => {
    if (event.target === modal) closeApiModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
      closeApiModal();
    }
  });

  disconnectBtn.addEventListener("click", () => {
    apiConfig = {
      connected: false,
      canvasUrl: urlInput.value.trim() || DEFAULT_API_CONFIG.canvasUrl,
      canvasToken: "",
      geminiKey: ""
    };
    saveApiConfig(apiConfig);
    syncApiUi();
    closeApiModal();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const url = urlInput.value.trim();
    const token = tokenInput.value.trim();
    const gemini = geminiInput.value.trim();

    if (!url || !token || !gemini) {
      errorEl.textContent = "Completa la URL de Canvas, el token de Canvas y la API key de Google Gemini.";
      errorEl.hidden = false;
      return;
    }

    apiConfig = {
      connected: true,
      canvasUrl: url,
      canvasToken: token,
      geminiKey: gemini
    };
    saveApiConfig(apiConfig);
    syncApiUi();
    closeApiModal();
  });

  syncApiUi();
}

initApiConfig();

/* Buscador de asignaturas */
const searchInput = document.querySelector("#subject-search");
const subjectCards = [...document.querySelectorAll(".subject-card")];
const emptyState = document.querySelector("#empty-state");

if (searchInput && emptyState) {
  searchInput.addEventListener("input", () => {
    const query = normalizeText(searchInput.value);
    let visibleCount = 0;

    for (const card of subjectCards) {
      const subject = normalizeText(card.dataset.subject || "");
      const matches = subject.includes(query);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    }

    emptyState.hidden = visibleCount > 0;
  });
}

/* Filtros de agenda en Inicio */
const eventFilters = [...document.querySelectorAll("[data-event-filter]")];
const agendaEvents = [...document.querySelectorAll("[data-event-category]")];
const agendaCount = document.querySelector("#agenda-count");

if (eventFilters.length && agendaEvents.length) {
  for (const filterButton of eventFilters) {
    filterButton.addEventListener("click", () => {
      const selectedFilter = filterButton.dataset.eventFilter;
      let visibleEvents = 0;

      for (const eventItem of agendaEvents) {
        const isVisible = selectedFilter === "all" || eventItem.dataset.eventCategory === selectedFilter;
        eventItem.hidden = !isVisible;
        if (isVisible) visibleEvents += 1;
      }

      for (const button of eventFilters) {
        button.setAttribute("aria-pressed", String(button === filterButton));
      }

      if (agendaCount) {
        agendaCount.textContent = `${visibleEvents} ${visibleEvents === 1 ? "evento" : "eventos"}`;
      }
    });
  }
}

/* Filtro de bloques por asignatura en horario.html */
const scheduleFilters = [...document.querySelectorAll("[data-schedule-filter]")];
const scheduleCells = [...document.querySelectorAll("[data-course-cell]")];

if (scheduleFilters.length && scheduleCells.length) {
  for (const btn of scheduleFilters) {
    btn.addEventListener("click", () => {
      const target = btn.dataset.scheduleFilter || "all";

      for (const current of scheduleFilters) {
        current.setAttribute("aria-pressed", String(current === btn));
      }

      for (const cell of scheduleCells) {
        const match = target === "all" || cell.dataset.courseCell === target;
        cell.classList.toggle("is-dimmed", !match);
        cell.classList.toggle("is-highlighted", target !== "all" && match);
      }
    });
  }
}

/* Chatbot academico flotante con bordes curvos (abierto por defecto) */
function buildReply(userText) {
  if (!areApisReady()) {
    return "Las APIs están desconectadas. Abre el botón «Configurar APIs» abajo a la izquierda para ingresar tu token de Canvas y tu API key de Google Gemini.";
  }

  const q = normalizeText(userText);
  const data = window.ACADEMIC_DATA || {};
  const courses = data.courses ? Object.values(data.courses) : [];
  const events = data.agendaEvents || [];

  if (q.includes("api") || q.includes("gemini") || q.includes("token") || q.includes("canvas")) {
    return "Ambas APIs (Canvas y Google Gemini) están activas. Si necesitas ver los pasos para obtener tus claves, haz clic en «APIs funcionando» en la barra izquierda.";
  }

  if (q.includes("trabajo 3") || q.includes("paso") || q.includes("checklist") || q.includes("maqueta")) {
    let steps = (data.evaluation && data.evaluation.defaultSteps) || [];
    try {
      const saved = JSON.parse(localStorage.getItem(STEPS_KEY) || "null");
      if (Array.isArray(saved)) steps = saved;
    } catch {
      // Usar pasos por defecto
    }
    const pending = steps.filter(s => !s.done);
    if (!pending.length) {
      return "Tienes todos los pasos del Trabajo 3 marcados como listos. La entrega es el martes 24 nov a las 16:30.";
    }
    const names = pending.slice(0, 3).map(s => s.title).join("; ");
    return `Te quedan ${pending.length} pasos en Trabajo 3 (entrega 24 nov, 16:30): ${names}.`;
  }

  if (q.includes("nota") || q.includes("promedio") || q.includes("aprobar") || q.includes("simulador")) {
    return "En el Simulador tienes tus 4 ramos: Interfaz (6.0), Construcción (5.2) y Metodologías (6.1) van en verde, y Análisis y Diseño OO (3.7) en rojo para priorizar la Nota 3.";
  }

  if (q.includes("horario") || q.includes("bloque")) {
    return "En la pestaña Horario del menú izquierdo tienes tus bloques semanales de lunes a viernes con filtro para resaltar cada ramo.";
  }

  if (q.includes("entrega") || q.includes("proxima") || q.includes("plazo") || q.includes("cuando")) {
    const entregas = events.filter(e => e.category === "entrega");
    const list = entregas.map(e => `${e.title} (${e.course}, ${e.monthLabel})`).join(" | ");
    return `Entregas próximas: ${list}.`;
  }

  if (q.includes("agenda") || q.includes("semana") || q.includes("evento") || q.includes("evaluacion") || q.includes("clase")) {
    const list = events.slice(0, 4).map(e => `${e.monthLabel}: ${e.title} (${e.course})`).join(" | ");
    return `Próximos eventos en agenda: ${list}.`;
  }

  if (q.includes("ramo") || q.includes("asignatura")) {
    const list = courses.map(c => `${c.name} (Prom ${c.avg})`).join(", ");
    return `Tus 4 asignaturas son: ${list}.`;
  }

  return "Pregúntame por tus notas (N1-N3), próximas entregas, pasos del Trabajo 3, tu horario o cómo configurar las APIs de Canvas y Gemini.";
}

function initChatbot() {
  const widget = document.createElement("aside");
  widget.className = "chatbot-widget";
  widget.setAttribute("aria-label", "Asistente académico");

  widget.innerHTML = `
    <div id="chatbot-panel" class="chatbot-panel">
      <div class="chatbot-header">
        <div class="chatbot-header-left">
          <strong>Asistente académico</strong>
          <span id="chatbot-api-badge" class="chatbot-status-pill is-online">Gemini activo</span>
        </div>
        <button id="chatbot-close" class="chatbot-min-btn" type="button" aria-label="Minimizar asistente">−</button>
      </div>
      <div class="chatbot-chips" aria-label="Consultas rápidas">
        <button type="button" class="chatbot-chip" data-prompt="¿Qué falta del Trabajo 3?">Trabajo 3</button>
        <button type="button" class="chatbot-chip" data-prompt="¿Cómo voy en notas?">Notas</button>
        <button type="button" class="chatbot-chip" data-prompt="¿Cuál es la próxima entrega?">Entregas</button>
        <button type="button" class="chatbot-chip" data-prompt="Ver horario semanal">Horario</button>
      </div>
      <div id="chatbot-messages" class="chatbot-messages" aria-live="polite"></div>
      <form id="chatbot-form" class="chatbot-form">
        <label class="sr-only" for="chatbot-input">Escribe tu consulta</label>
        <input id="chatbot-input" type="text" placeholder="Pregunta por notas, entregas o horario" autocomplete="off">
        <button type="submit" class="primary-button chatbot-send">Enviar</button>
      </form>
    </div>
    <button id="chatbot-toggle" class="chatbot-toggle" type="button" aria-expanded="true" aria-controls="chatbot-panel">
      <span class="chatbot-dot" aria-hidden="true"></span>
      <span>Asistente</span>
    </button>
  `;

  document.body.append(widget);
  syncApiUi();

  const toggleBtn = widget.querySelector("#chatbot-toggle");
  const closeBtn = widget.querySelector("#chatbot-close");
  const panel = widget.querySelector("#chatbot-panel");
  const messagesEl = widget.querySelector("#chatbot-messages");
  const form = widget.querySelector("#chatbot-form");
  const input = widget.querySelector("#chatbot-input");
  const chips = [...widget.querySelectorAll(".chatbot-chip")];

  let history = [
    { role: "bot", text: "Hola Francisco. Con Canvas y Gemini conectados puedo revisar tus notas, entregas, pasos del Trabajo 3 y horario." }
  ];

  try {
    const saved = JSON.parse(sessionStorage.getItem(CHAT_KEY) || "null");
    if (Array.isArray(saved) && saved.length) history = saved;
  } catch {
    // Usar mensaje inicial
  }

  function renderMessages() {
    messagesEl.innerHTML = "";
    for (const msg of history) {
      const bubble = document.createElement("div");
      bubble.className = `chatbot-msg ${msg.role === "user" ? "is-user" : "is-bot"}`;
      bubble.textContent = msg.text;
      messagesEl.append(bubble);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function pushExchange(text) {
    const clean = text.trim();
    if (!clean) return;
    history.push({ role: "user", text: clean });
    history.push({ role: "bot", text: buildReply(clean) });

    if (history.length > 16) history = history.slice(-16);
    try {
      sessionStorage.setItem(CHAT_KEY, JSON.stringify(history));
    } catch {
      // Ignorar
    }
    renderMessages();
  }

  function setOpen(open, moveFocus = false) {
    panel.hidden = !open;
    toggleBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      renderMessages();
      if (moveFocus) input.focus();
    }
  }

  const defaultOpen = window.innerWidth > 600;
  setOpen(defaultOpen, false);

  toggleBtn.addEventListener("click", () => setOpen(panel.hidden, true));
  closeBtn.addEventListener("click", () => {
    setOpen(false, false);
    toggleBtn.focus();
  });

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      pushExchange(chip.dataset.prompt || chip.textContent);
    });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!input.value.trim()) return;
    pushExchange(input.value);
    input.value = "";
  });
}

initChatbot();
