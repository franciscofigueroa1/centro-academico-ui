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
