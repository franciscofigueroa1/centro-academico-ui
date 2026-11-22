const searchInput = document.querySelector("#subject-search");
const subjectCards = [...document.querySelectorAll(".subject-card")];
const emptyState = document.querySelector("#empty-state");

function normalizeText(text) {
  return text
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
