(function () {
  function init() {
    var panel = document.getElementById('global-category-panel');
    if (!panel) return;

    var parents = Array.prototype.slice.call(panel.querySelectorAll('.category-parent'));
    var submenus = Array.prototype.slice.call(panel.querySelectorAll('.category-submenu'));
    var mobileQuery = window.matchMedia('(max-width: 620px)');

    function closeSubmenus() {
      parents.forEach(function (parent) { parent.classList.remove('is-open'); parent.setAttribute('aria-expanded', 'false'); });
      submenus.forEach(function (submenu) { submenu.hidden = true; });
    }

    function openSubmenu(mode) {
      parents.forEach(function (parent) {
        var open = parent.dataset.filterMode === mode;
        parent.classList.toggle('is-open', open);
        parent.setAttribute('aria-expanded', String(open));
      });
      submenus.forEach(function (submenu) { submenu.hidden = submenu.dataset.submenu !== mode; });
    }

    parents.forEach(function (parent) {
      parent.addEventListener('mouseenter', function () { if (!mobileQuery.matches) openSubmenu(parent.dataset.filterMode); });
      parent.addEventListener('focus', function () { if (!mobileQuery.matches) openSubmenu(parent.dataset.filterMode); });
      parent.addEventListener('click', function () {
        if (!mobileQuery.matches) return;
        var mode = parent.dataset.filterMode;
        var isOpen = parent.classList.contains('is-open');
        if (isOpen) closeSubmenus(); else openSubmenu(mode);
      });
    });

    panel.addEventListener('mouseleave', function () { if (!mobileQuery.matches) closeSubmenus(); });
    panel.addEventListener('click', function (event) {
      if (mobileQuery.matches && !event.target.closest('.category-parent, .category-submenu')) closeSubmenus();
    });

    fetch('/api/products?facets=1', { headers: { Accept: 'application/json' } })
      .then(function (response) { if (!response.ok) throw new Error('Facets unavailable'); return response.json(); })
      .then(function (facets) {
        ['tags', 'brands'].forEach(function (mode) {
          var terms = panel.querySelector('[data-terms="' + mode + '"]');
          if (!terms) return;
          terms.innerHTML = '';
          (facets[mode] || []).forEach(function (term) {
            var link = document.createElement('a');
            link.href = '/?filter=' + mode + '&term=' + encodeURIComponent(term);
            link.textContent = term;
            terms.appendChild(link);
          });
          if (!terms.children.length) terms.innerHTML = '<span class="category-terms-empty">No terms available</span>';
        });
      })
      .catch(function () {
        panel.querySelectorAll('.category-terms').forEach(function (terms) { terms.innerHTML = '<span class="category-terms-empty">Terms unavailable</span>'; });
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
