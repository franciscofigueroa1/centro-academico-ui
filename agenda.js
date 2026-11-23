const EXTRA_EVENTS_KEY = "ca_eventos_extra";
const DONE_EVENTS_KEY = "ca_eventos_hechos";

const baseEvents = window.ACADEMIC_DATA ? window.ACADEMIC_DATA.agendaEvents : [];

const agendaList = document.querySelector("#agenda-list");
const agendaEmpty = document.querySelector("#agenda-empty");
const agendaTotal = document.querySelector("#agenda-total");
const agendaSearch = document.querySelector("#agenda-search");
const courseSelect = document.querySelector("#agenda-course-filter");
const typeButtons = [...document.querySelectorAll("[data-agenda-type]")];
const resetFiltersBtn = document.querySelector("#agenda-reset");

const eventModal = document.querySelector("#event-modal");
const openEventModalBtn = document.querySelector("#open-event-modal");
const closeEventModalBtn = document.querySelector("#close-event-modal");
const cancelEventModalBtn = document.querySelector("#cancel-event-modal");
const eventForm = document.querySelector("#event-form");
const titleInput = document.querySelector("#event-title");
const courseInput = document.querySelector("#event-course");
const categoryInput = document.querySelector("#event-category");
const dateInput = document.querySelector("#event-date");
const timeInput = document.querySelector("#event-time");
const eventError = document.querySelector("#event-error");

const agendaAlert = document.querySelector("#agenda-alert");
const agendaAlertText = document.querySelector("#agenda-alert-text");
const closeAgendaAlertBtn = document.querySelector("#close-agenda-alert");

let selectedType = "all";
let selectedCourse = "all";
let searchQuery = "";

function loadExtraEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(EXTRA_EVENTS_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveExtraEvents(list) {
  try {
    localStorage.setItem(EXTRA_EVENTS_KEY, JSON.stringify(list));
  } catch {
    // Ignorar
  }
}

function loadDoneMap() {
  try {
    const saved = JSON.parse(localStorage.getItem(DONE_EVENTS_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveDoneMap(map) {
  try {
    localStorage.setItem(DONE_EVENTS_KEY, JSON.stringify(map));
  } catch {
    // Ignorar
  }
}

let extraEvents = loadExtraEvents();
let doneMap = loadDoneMap();

function getAllEvents() {
  return [...baseEvents, ...extraEvents].map(ev => ({
    ...ev,
    done: Boolean(doneMap[ev.id] ?? ev.done)
  }));
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categoryTagClass(category) {
  if (category === "entrega") return "tag-violet";
  if (category === "clase") return "tag-blue";
  return "tag-rose";
}

function categoryLabelText(category) {
  if (category === "entrega") return "Entrega";
  if (category === "clase") return "Clase";
  return "Evaluación";
}

function populateCourseFilter() {
  if (!courseSelect) return;
  const courses = [...new Set(getAllEvents().map(item => item.course))];
  courseSelect.innerHTML = '<option value="all">Todos los ramos</option>';

  for (const course of courses) {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    courseSelect.append(option);
  }
  courseSelect.value = selectedCourse;
}

function createEventCard(item) {
  const card = document.createElement("article");
  card.className = `agenda-card${item.done ? " is-done" : ""}`;

  const dateEl = document.createElement("time");
  dateEl.className = "event-date agenda-date";
  dateEl.setAttribute("datetime", item.dateIso);

  const daySpan = document.createElement("span");
  daySpan.textContent = item.dayLabel;

  const numStrong = document.createElement("strong");
  numStrong.textContent = item.dayNumber;

  dateEl.append(daySpan, numStrong);

  const body = document.createElement("div");
  body.className = "agenda-card-body";

  const meta = document.createElement("div");
  meta.className = "agenda-card-meta";

  const tag = document.createElement("span");
  tag.className = `event-tag ${categoryTagClass(item.category)}`;
  tag.textContent = item.categoryLabel;

  const timeText = document.createElement("span");
  timeText.className = "agenda-card-time";
  timeText.textContent = `${item.monthLabel}, ${item.time}`;

  meta.append(tag, timeText);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const course = document.createElement("p");
  course.className = "agenda-card-course";
  course.textContent = item.course;

  body.append(meta, title, course);

  if (item.detail) {
    const detail = document.createElement("p");
    detail.className = "agenda-card-detail";
    detail.textContent = item.detail;
    body.append(detail);
  }

  const actions = document.createElement("div");
  actions.className = "agenda-card-actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "secondary-button agenda-done-btn";
  toggleBtn.textContent = item.done ? "Hecho ✓" : "Marcar hecho";
  toggleBtn.setAttribute("aria-pressed", String(item.done));
  toggleBtn.addEventListener("click", () => {
    doneMap[item.id] = !item.done;
    saveDoneMap(doneMap);
    renderAgenda();
  });

  actions.append(toggleBtn);

  if (item.href && item.linkText) {
    const link = document.createElement("a");
    link.className = "agenda-card-link";
    link.href = item.href;
    link.textContent = `${item.linkText} →`;
    actions.append(link);
  }

  body.append(actions);
  card.append(dateEl, body);
  return card;
}

function renderAgenda() {
  if (!agendaList) return;
  const query = normalizeText(searchQuery);
  const allEvents = getAllEvents();

  const filtered = allEvents.filter(item => {
    const matchesType = selectedType === "all" || item.category === selectedType;
    const matchesCourse = selectedCourse === "all" || item.course === selectedCourse;
    const haystack = normalizeText(`${item.title} ${item.course} ${item.detail} ${item.categoryLabel}`);
    const matchesSearch = !query || haystack.includes(query);
    return matchesType && matchesCourse && matchesSearch;
  });

  agendaList.innerHTML = "";
  for (const item of filtered) {
    agendaList.append(createEventCard(item));
  }

  if (agendaTotal) {
    agendaTotal.textContent = `${filtered.length} ${filtered.length === 1 ? "evento" : "eventos"}`;
  }

  if (agendaEmpty) {
    agendaEmpty.hidden = filtered.length > 0;
  }
}

for (const button of typeButtons) {
  button.addEventListener("click", () => {
    selectedType = button.dataset.agendaType || "all";
    for (const current of typeButtons) {
      current.setAttribute("aria-pressed", String(current === button));
    }
    renderAgenda();
  });
}

if (courseSelect) {
  courseSelect.addEventListener("change", () => {
    selectedCourse = courseSelect.value;
    renderAgenda();
  });
}

if (agendaSearch) {
  agendaSearch.addEventListener("input", () => {
    searchQuery = agendaSearch.value;
    renderAgenda();
  });
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", () => {
    selectedType = "all";
    selectedCourse = "all";
    searchQuery = "";

    if (agendaSearch) agendaSearch.value = "";
    if (courseSelect) courseSelect.value = "all";
    for (const button of typeButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.agendaType === "all"));
    }

    renderAgenda();
  });
}

/* Modal para agregar evento */
function openEventModal() {
  if (!eventModal) return;
  if (eventError) {
    eventError.hidden = true;
    eventError.textContent = "";
  }
  if (titleInput) titleInput.classList.remove("is-invalid");
  eventModal.hidden = false;
  document.body.classList.add("modal-open");
  if (titleInput) titleInput.focus();
}

function closeEventModal() {
  if (!eventModal) return;
  eventModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (openEventModalBtn) openEventModalBtn.focus();
}

if (openEventModalBtn) openEventModalBtn.addEventListener("click", openEventModal);
if (closeEventModalBtn) closeEventModalBtn.addEventListener("click", closeEventModal);
if (cancelEventModalBtn) cancelEventModalBtn.addEventListener("click", closeEventModal);
if (closeAgendaAlertBtn && agendaAlert) {
  closeAgendaAlertBtn.addEventListener("click", () => {
    agendaAlert.hidden = true;
  });
}

if (eventModal) {
  eventModal.addEventListener("click", event => {
    if (event.target === eventModal) closeEventModal();
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && eventModal && !eventModal.hidden) {
    closeEventModal();
  }
});

if (eventForm) {
  eventForm.addEventListener("submit", event => {
    event.preventDefault();
    const title = titleInput ? titleInput.value.trim() : "";
    const course = courseInput ? courseInput.value : "Interfaz de Usuario";
    const category = categoryInput ? categoryInput.value : "entrega";
    const dateVal = dateInput ? dateInput.value : "2026-11-28";
    const timeVal = timeInput ? timeInput.value : "16:30";

    if (title.length < 3) {
      if (titleInput) titleInput.classList.add("is-invalid");
      if (eventError) {
        eventError.textContent = "Ingresa un título de al menos 3 caracteres.";
        eventError.hidden = false;
      }
      if (titleInput) titleInput.focus();
      return;
    }

    const parsedDate = new Date(`${dateVal}T${timeVal}`);
    const days = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

    const dayLabel = Number.isNaN(parsedDate.getTime()) ? "SAB" : days[parsedDate.getDay()];
    const dayNumber = dateVal.split("-")[2] || "28";
    const monthIndex = Number(dateVal.split("-")[1] || 11) - 1;
    const monthLabel = `${dayNumber} ${months[monthIndex] || "nov"}`;

    const newEvent = {
      id: `ev-${Date.now()}`,
      dayLabel,
      dayNumber,
      monthLabel,
      dateIso: `${dateVal}T${timeVal}`,
      time: timeVal,
      category,
      categoryLabel: categoryLabelText(category),
      title,
      course,
      detail: "Agregado manualmente en tu agenda.",
      href: "",
      linkText: "",
      done: false
    };

    extraEvents.push(newEvent);
    saveExtraEvents(extraEvents);
    populateCourseFilter();
    renderAgenda();
    closeEventModal();
    if (titleInput) titleInput.value = "";

    if (agendaAlert && agendaAlertText) {
      agendaAlertText.textContent = `"${title}" quedó registrado en ${course}.`;
      agendaAlert.hidden = false;
    }
  });
}

populateCourseFilter();
renderAgenda();
