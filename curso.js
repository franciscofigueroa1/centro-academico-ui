const courseTabs = [...document.querySelectorAll('[role="tab"]')];

function selectCourseTab(selectedTab, moveFocus = false) {
  for (const tab of courseTabs) {
    const selected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;

    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (panel) panel.hidden = !selected;
  }

  if (moveFocus) selectedTab.focus();
}

for (const [index, tab] of courseTabs.entries()) {
  tab.addEventListener("click", () => selectCourseTab(tab));
  tab.addEventListener("keydown", event => {
    let nextIndex;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % courseTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + courseTabs.length) % courseTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = courseTabs.length - 1;

    if (nextIndex !== undefined) {
      event.preventDefault();
      selectCourseTab(courseTabs[nextIndex], true);
    }
  });
}
