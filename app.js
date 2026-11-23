const THEME_KEY = "ca_tema_preferido";
const CHAT_KEY = "ca_chat_historial";
const STEPS_KEY = "centro_academico_pasos_trabajo3";
const API_STATUS_KEY = "ca_api_estado";

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

/* Boton Configurar API / API funcionando (abajo a la izquierda) */
function initApiConfig() {
  const apiBtn = document.querySelector("#api-config-btn");
  const apiLabel = document.querySelector("#api-btn-label");
  if (!apiBtn || !apiLabel) return;

  let isConnected = true;
  try {
    const saved = localStorage.getItem(API_STATUS_KEY);
    if (saved === "disconnected") isConnected = false;
  } catch {
    // Por defecto conectada
  }

  function renderApiButton() {
    apiBtn.classList.toggle("is-connected", isConnected);
    apiLabel.textContent = isConnected ? "API funcionando" : "Configurar API";
  }

  renderApiButton();

  const modal = document.createElement("div");
  modal.id = "api-modal";
  modal.className = "modal-backdrop";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "api-modal-title");
  modal.hidden = true;

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h2 id="api-modal-title">Conexión API Canvas</h2>
        <button id="api-modal-close" class="modal-close" type="button" aria-label="Cerrar ventana">×</button>
      </div>
      <form id="api-modal-form" class="modal-form" novalidate>
        <div class="form-field">
          <label for="api-url-input">Servidor Canvas</label>
          <input id="api-url-input" type="url" value="https://virginiogomez.instructure.com" required>
        </div>
        <div class="form-field">
          <label for="api-token-input">Token personal</label>
          <input id="api-token-input" type="password" value="dpapi-local-token-activo" placeholder="Pega tu token de Canvas" required>
        </div>
        <p id="api-modal-status" class="api-status-note"></p>
        <div class="modal-actions">
          <button id="api-disconnect-btn" class="secondary-button" type="button">Desconectar</button>
          <button class="primary-button" type="submit">Guardar y activar</button>
        </div>
      </form>
    </div>
  `;

  document.body.append(modal);

  const closeBtn = modal.querySelector("#api-modal-close");
  const disconnectBtn = modal.querySelector("#api-disconnect-btn");
  const form = modal.querySelector("#api-modal-form");
  const tokenInput = modal.querySelector("#api-token-input");
  const statusNote = modal.querySelector("#api-modal-status");

  function openApiModal() {
    statusNote.textContent = isConnected
      ? "Estado actual: API conectada y sincronizada."
      : "Estado actual: sin conexión activa. Guarda un token para activar.";
    modal.hidden = false;
    tokenInput.focus();
  }

  function closeApiModal() {
    modal.hidden = true;
    apiBtn.focus();
  }

  apiBtn.addEventListener("click", openApiModal);
  closeBtn.addEventListener("click", closeApiModal);

  modal.addEventListener("click", event => {
    if (event.target === modal) closeApiModal();
  });

  disconnectBtn.addEventListener("click", () => {
    isConnected = false;
    try {
      localStorage.setItem(API_STATUS_KEY, "disconnected");
    } catch {
      // Ignorar
    }
    renderApiButton();
    closeApiModal();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    isConnected = true;
    try {
      localStorage.setItem(API_STATUS_KEY, "connected");
    } catch {
      // Ignorar
    }
    renderApiButton();
    closeApiModal();
  });
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

/* Chatbot academico flotante (abierto por defecto) */
function buildReply(userText) {
  const q = normalizeText(userText);
  const data = window.ACADEMIC_DATA || {};
  const courses = data.courses ? Object.values(data.courses) : [];
  const events = data.agendaEvents || [];

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
      return "Tienes todos los pasos del Trabajo 3 marcados como listos. El plazo es el martes 24 nov a las 16:30.";
    }
    const names = pending.slice(0, 3).map(s => s.title).join("; ");
    return `Te quedan ${pending.length} pasos en Trabajo 3 (entrega 24 nov, 16:30): ${names}.`;
  }

  if (q.includes("nota") || q.includes("promedio") || q.includes("aprobar") || q.includes("simulador")) {
    return "En la sección Simulador puedes mover la nota de la Ev3 en cada ramo: actualmente tu NP promedio proyectada es 5.56 con todos los ramos sobre 4.8.";
  }

  if (q.includes("entrega") || q.includes("proxima") || q.includes("plazo") || q.includes("cuando")) {
    const entregas = events.filter(e => e.category === "entrega");
    const list = entregas.map(e => `${e.title} (${e.course}, ${e.monthLabel} ${e.time})`).join(" | ");
    return `Entregas próximas: ${list}.`;
  }

  if (q.includes("agenda") || q.includes("semana") || q.includes("evento") || q.includes("evaluacion") || q.includes("clase")) {
    const list = events.slice(0, 4).map(e => `${e.monthLabel} ${e.time}: ${e.title} (${e.course})`).join(" | ");
    return `Próximos eventos en agenda: ${list}.`;
  }

  if (q.includes("ramo") || q.includes("asignatura")) {
    const list = courses.map(c => `${c.name} (${c.progress}%)`).join(", ");
    return `Tus asignaturas en seguimiento son: ${list}.`;
  }

  return "Puedo ayudarte con tus próximas entregas, pasos pendientes del Trabajo 3, eventos de la agenda o la estrategia de notas del Simulador.";
}

function initChatbot() {
  const widget = document.createElement("aside");
  widget.className = "chatbot-widget";
  widget.setAttribute("aria-label", "Asistente académico");

  widget.innerHTML = `
    <div id="chatbot-panel" class="chatbot-panel">
      <div class="chatbot-header">
        <strong>Asistente académico</strong>
        <button id="chatbot-close" class="modal-close" type="button" aria-label="Minimizar asistente">−</button>
      </div>
      <div class="chatbot-chips" aria-label="Consultas rápidas">
        <button type="button" class="chatbot-chip" data-prompt="¿Qué falta del Trabajo 3?">Trabajo 3</button>
        <button type="button" class="chatbot-chip" data-prompt="¿Cómo voy en notas?">Simulador</button>
        <button type="button" class="chatbot-chip" data-prompt="¿Cuál es la próxima entrega?">Entregas</button>
        <button type="button" class="chatbot-chip" data-prompt="Eventos de la semana">Agenda</button>
      </div>
      <div id="chatbot-messages" class="chatbot-messages" aria-live="polite"></div>
      <form id="chatbot-form" class="chatbot-form">
        <label class="sr-only" for="chatbot-input">Escribe tu consulta</label>
        <input id="chatbot-input" type="text" placeholder="Pregunta por notas, entregas o pasos" autocomplete="off">
        <button type="submit" class="primary-button chatbot-send">Enviar</button>
      </form>
    </div>
    <button id="chatbot-toggle" class="chatbot-toggle" type="button" aria-expanded="true" aria-controls="chatbot-panel">
      <span class="chatbot-dot" aria-hidden="true"></span>
      <span>Asistente</span>
    </button>
  `;

  document.body.append(widget);

  const toggleBtn = widget.querySelector("#chatbot-toggle");
  const closeBtn = widget.querySelector("#chatbot-close");
  const panel = widget.querySelector("#chatbot-panel");
  const messagesEl = widget.querySelector("#chatbot-messages");
  const form = widget.querySelector("#chatbot-form");
  const input = widget.querySelector("#chatbot-input");
  const chips = [...widget.querySelectorAll(".chatbot-chip")];

  let history = [
    { role: "bot", text: "Hola Francisco. Pregúntame por tus notas, el simulador de examen o lo que falta del Trabajo 3." }
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

  /* Abierto por defecto en escritorio, minimizado en pantallas muy pequenas para no tapar todo */
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
