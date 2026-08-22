(function () {
  function init() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("input.search"));
    var trigger = document.querySelector(".search-trigger");
    if (!inputs.length || !trigger) return;
    var panels = inputs.map(function (input) { return input.closest(".search-panel"); }).filter(Boolean);
    trigger.addEventListener("click", function () { var panel = panels[0]; if (!panel) return; panels.forEach(function (item) { if (item !== panel) item.hidden = true; }); panel.hidden = !panel.hidden; trigger.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) inputs[0].focus(); });
    inputs.forEach(function (input) {
      var panel = input.closest(".search-panel"), results = panel && panel.querySelector(".search-results"), timer = 0;
      if (!results) return;
      input.addEventListener("input", function () { clearTimeout(timer); var q = input.value.trim(); if (!q) { results.hidden = true; results.innerHTML = ""; return; } timer = window.setTimeout(function () { fetch("/api/search?q=" + encodeURIComponent(q), { headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (payload) { var items = payload.results || []; results.innerHTML = items.map(function (item) { return "<a class=\"search-result\" href=\"/products/" + item.slug + "/\"><img src=\"" + item.cover + "\" alt=\"\"><span><strong>" + (item.titleZh || item.title) + "</strong><em>" + item.category + " · " + item.title + "</em></span></a>"; }).join("") || "<div class=\"search-empty\">No matching works</div>"; results.hidden = false; }).catch(function (error) { results.innerHTML = "<div class=\"search-empty\">Search unavailable (" + error.message + ")</div>"; results.hidden = false; }); }, 180); });
      input.addEventListener("keydown", function (event) { if (event.key === "Enter" && input.value.trim()) { event.preventDefault(); window.location.href = "/search?q=" + encodeURIComponent(input.value.trim()); } });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
