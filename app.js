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
    apiBtn.classList.toggle("is-disconnected", !isConnected);
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
          <label for="api-token-input">Token de acceso</label>
          <input id="api-token-input" type="password" value="token-academico-activo" placeholder="Pega tu token de Canvas" required>
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
      ? "Estado actual: API conectada (en verde)."
      : "Estado actual: desconectada (en rojo). Guarda para activar.";
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

/* Chatbot academico flotante con bordes curvos (abierto por defecto) */
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
      return "Tienes todos los pasos del Trabajo 3 marcados como listos. La entrega es el martes 24 nov a las 16:30.";
    }
    const names = pending.slice(0, 3).map(s => s.title).join("; ");
    return `Te quedan ${pending.length} pasos en Trabajo 3 (entrega 24 nov, 16:30): ${names}.`;
  }

  if (q.includes("nota") || q.includes("promedio") || q.includes("aprobar") || q.includes("simulador")) {
    return "En el Simulador tienes tus 4 ramos: Interfaz y Metodologías están en verde (sobre 5.5), Construcción en amarillo y Análisis y Diseño OO en rojo para priorizar.";
  }

  if (q.includes("horario") || q.includes("bloque")) {
    return "En la sección Agenda (abajo de la lista de eventos) tienes tu Horario semanal de lunes a viernes para los 4 ramos.";
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
    const list = courses.map(c => `${c.name} (${c.progress}%)`).join(", ");
    return `Tus 4 asignaturas son: ${list}.`;
  }

  return "Pregúntame por tus próximas entregas, pasos del Trabajo 3, el simulador de los 4 ramos o el horario semanal.";
}

function initChatbot() {
  const widget = document.createElement("aside");
  widget.className = "chatbot-widget";
  widget.setAttribute("aria-label", "Asistente académico");

  widget.innerHTML = `
    <div id="chatbot-panel" class="chatbot-panel">
      <div class="chatbot-header">
        <strong>Asistente académico</strong>
        <button id="chatbot-close" class="chatbot-min-btn" type="button" aria-label="Minimizar asistente">−</button>
      </div>
      <div class="chatbot-chips" aria-label="Consultas rápidas">
        <button type="button" class="chatbot-chip" data-prompt="¿Qué falta del Trabajo 3?">Trabajo 3</button>
        <button type="button" class="chatbot-chip" data-prompt="¿Cómo voy en notas?">Simulador</button>
        <button type="button" class="chatbot-chip" data-prompt="¿Cuál es la próxima entrega?">Entregas</button>
        <button type="button" class="chatbot-chip" data-prompt="Ver horario semanal">Horario</button>
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
    { role: "bot", text: "Hola Francisco. Pregúntame por el temporizador del Trabajo 3, tus 4 ramos en el simulador o tu horario." }
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
