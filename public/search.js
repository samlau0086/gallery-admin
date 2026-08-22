(function () {
  function init() {
    var trigger = document.querySelector('.search-trigger');
    var panel = document.querySelector('#global-search-panel');
    var input = document.querySelector('.global-search');
    var results = panel && panel.querySelector('.search-results');
    if (!trigger || !panel || !input || !results || trigger.dataset.searchReady) return;
    trigger.dataset.searchReady = 'true';
    var timer = 0;
    trigger.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      trigger.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) input.focus();
    });
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var query = input.value.trim();
      if (!query) { results.hidden = true; results.innerHTML = ''; return; }
      timer = window.setTimeout(function () {
        fetch('/api/search?q=' + encodeURIComponent(query), { headers: { Accept: 'application/json' } })
          .then(function (response) { return response.json(); })
          .then(function (payload) {
            var items = payload.results || [];
            results.innerHTML = items.map(function (item) { return '<a class="search-result" href="/products/' + item.slug + '/" role="option"><img src="' + item.cover + '" alt=""><span><strong>' + (item.titleZh || item.title) + '</strong><em>' + item.category + ' · ' + item.title + '</em></span></a>'; }).join('') || '<div class="search-empty">No matching works</div>';
            results.hidden = false;
          })
          .catch(function () { results.hidden = true; });
      }, 180);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && input.value.trim()) {
        event.preventDefault();
        window.location.href = '/search?q=' + encodeURIComponent(input.value.trim());
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
