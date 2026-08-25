(function () {
  var metadataNode = document.getElementById('catalog-filters');
  if (!metadataNode) return;

  var metadata = JSON.parse(metadataNode.textContent || '[]');
  var bySlug = new Map(metadata.map(function (product) { return [product.slug, product]; }));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab')).slice(0, 3);
  var grid = document.getElementById('product-grid');
  var label = document.getElementById('collection-label');
  var controls;
  var mode = 'all';
  var selected = '';

  if (!grid || !tabs.length) return;

  Array.prototype.slice.call(document.querySelectorAll('.tab')).slice(3).forEach(function (tab) { tab.remove(); });

  tabs.forEach(function (tab, index) {
    var nextMode = ['all', 'tags', 'brands'][index];
    tab.textContent = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);
    tab.dataset.filterMode = nextMode;
    tab.removeAttribute('data-category');
    tab.removeAttribute('data-kind');
  });

  controls = document.createElement('div');
  controls.className = 'filter-options';
  controls.hidden = true;
  grid.parentNode.insertBefore(controls, grid);

  function slugFromCard(card) {
    var parts = card.getAttribute('href').split('/').filter(Boolean);
    return parts[parts.length - 1];
  }

  function productForCard(card) {
    return bySlug.get(slugFromCard(card)) || { brand: '', tags: [] };
  }

  function matches(card) {
    if (mode === 'all' || !selected) return true;
    var product = productForCard(card);
    return mode === 'tags'
      ? (product.tags || []).indexOf(selected) !== -1
      : product.brand === selected;
  }

  function apply() {
    Array.prototype.forEach.call(grid.querySelectorAll('.product-card'), function (card) {
      card.hidden = !matches(card);
    });
  }

  function optionsForMode() {
    var values = metadata.flatMap(function (product) {
      return mode === 'tags' ? (product.tags || []) : (product.brand ? [product.brand] : []);
    });
    return Array.from(new Set(values)).sort(function (a, b) { return a.localeCompare(b); });
  }

  function renderOptions() {
    var options = optionsForMode();
    controls.innerHTML = '';
    controls.hidden = mode === 'all' || !options.length;
    if (mode === 'all') return;

    var allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.textContent = 'All ' + (mode === 'tags' ? 'tags' : 'brands');
    allButton.className = !selected ? 'active' : '';
    allButton.dataset.value = '';
    controls.appendChild(allButton);

    options.forEach(function (value) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = value;
      button.className = selected === value ? 'active' : '';
      button.dataset.value = value;
      controls.appendChild(button);
    });
  }

  function setMode(nextMode) {
    mode = nextMode;
    selected = '';
    tabs.forEach(function (tab) { tab.classList.toggle('active', tab.dataset.filterMode === mode); });
    label.textContent = mode === 'all' ? 'All products' : mode === 'tags' ? 'All tags' : 'All brands';
    renderOptions();
    apply();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (event) {
      event.stopImmediatePropagation();
      setMode(tab.dataset.filterMode || 'all');
    }, true);
  });

  controls.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-value]');
    if (!button) return;
    selected = button.dataset.value || '';
    label.textContent = selected || ('All ' + (mode === 'tags' ? 'tags' : 'brands'));
    renderOptions();
    apply();
  });

  new MutationObserver(apply).observe(grid, { childList: true });
  setMode('all');
  setTimeout(function () { setMode(mode); }, 0);
}());
