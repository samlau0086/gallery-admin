(function () {
  function init() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("input.search"));
    var searchTrigger = document.querySelector(".search-trigger");
    var categoryTrigger = document.querySelector(".category-trigger");
    var searchPanel = document.querySelector("#global-search-panel");
    var categoryPanel = document.querySelector("#global-category-panel");
    if (!inputs.length || !searchTrigger || !categoryTrigger || !searchPanel || !categoryPanel) return;

    function closePanels() {
      searchPanel.hidden = true;
      categoryPanel.hidden = true;
      searchTrigger.setAttribute("aria-expanded", "false");
      categoryTrigger.setAttribute("aria-expanded", "false");
    }

    function togglePanel(panel, trigger, focusTarget) {
      var isOpen = !panel.hidden;
      closePanels();
      if (!isOpen) {
        panel.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        if (focusTarget) focusTarget.focus();
      }
    }

    if (!searchTrigger.dataset.searchToggleReady) {
      searchTrigger.dataset.searchToggleReady = "1";
      searchTrigger.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        togglePanel(searchPanel, searchTrigger, inputs[0]);
      }, true);
    }
    if (!categoryTrigger.dataset.categoryToggleReady) {
      categoryTrigger.dataset.categoryToggleReady = "1";
      categoryTrigger.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        togglePanel(categoryPanel, categoryTrigger);
      }, true);
    }
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".header-left, .search-panel, .category-panel")) closePanels();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePanels();
    });
    inputs.forEach(function (input) {
      var panel = input.closest(".search-panel"), results = panel && panel.querySelector(".search-results"), timer = 0;
      if (panel && !results) { results = document.createElement("div"); results.className = "search-results"; results.setAttribute("role", "listbox"); results.hidden = true; panel.appendChild(results); }
      if (!results) return;
      input.addEventListener("input", function () { clearTimeout(timer); var q = input.value.trim(); if (!q) { results.hidden = true; results.innerHTML = ""; return; } timer = window.setTimeout(function () { fetch("/api/search?q=" + encodeURIComponent(q), { headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (payload) { var items = payload.results || []; results.innerHTML = items.map(function (item) { return "<a class=\"search-result\" href=\"/products/" + item.slug + "/\"><img src=\"" + item.cover + "\" alt=\"\"><span><strong>" + (item.titleZh || item.title) + "</strong><em>" + item.category + " · " + item.title + "</em></span></a>"; }).join("") || "<div class=\"search-empty\">No matching works</div>"; results.hidden = false; }).catch(function (error) { results.innerHTML = "<div class=\"search-empty\">Search unavailable (" + error.message + ")</div>"; results.hidden = false; }); }, 180); });
      input.addEventListener("keydown", function (event) { if (event.key === "Enter" && input.value.trim()) { event.preventDefault(); window.location.href = "/search?q=" + encodeURIComponent(input.value.trim()); } });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
