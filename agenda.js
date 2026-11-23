const agendaEventsData = window.ACADEMIC_DATA ? window.ACADEMIC_DATA.agendaEvents : [];

const agendaList = document.querySelector("#agenda-list");
const agendaEmpty = document.querySelector("#agenda-empty");
const agendaTotal = document.querySelector("#agenda-total");
const agendaSearch = document.querySelector("#agenda-search");
const courseSelect = document.querySelector("#agenda-course-filter");
const typeButtons = [...document.querySelectorAll("[data-agenda-type]")];
const resetFiltersBtn = document.querySelector("#agenda-reset");

let selectedType = "all";
let selectedCourse = "all";
let searchQuery = "";

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

function populateCourseFilter() {
  if (!courseSelect) return;
  const courses = [...new Set(agendaEventsData.map(item => item.course))];

  for (const course of courses) {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    courseSelect.append(option);
  }
}

function createEventCard(item) {
  const card = document.createElement("article");
  card.className = "agenda-card";

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

  const detail = document.createElement("p");
  detail.className = "agenda-card-detail";
  detail.textContent = item.detail;

  body.append(meta, title, course, detail);

  if (item.href && item.linkText) {
    const link = document.createElement("a");
    link.className = "agenda-card-link";
    link.href = item.href;
    link.textContent = `${item.linkText} ›`;
    body.append(link);
  }

  card.append(dateEl, body);
  return card;
}

function renderAgenda() {
  if (!agendaList) return;
  const query = normalizeText(searchQuery);

  const filtered = agendaEventsData.filter(item => {
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

populateCourseFilter();
renderAgenda();
