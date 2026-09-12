(function () {
  var whatsappUrl = window.__whatsappUrl || 'https://wa.me/447522538687';
  var storageKey = 'maesvanti-basket';
  var drawer = document.querySelector('#basket-drawer');
  var list = document.querySelector('#basket-items');
  var count = document.querySelectorAll('[data-basket-count]');
  var empty = document.querySelector('#basket-empty');
  var clearButton = document.querySelector('[data-basket-clear]');
  var countryInput;
  var countryOptions;
  var i18n = window.__i18n || {};
  var locale = window.__locale || 'en';
  var countries = Array.isArray(i18n.countryOptions) ? i18n.countryOptions : [
    { code: 'US', names: { en: 'United States' } }, { code: 'GB', names: { en: 'United Kingdom' } }, { code: 'CA', names: { en: 'Canada' } },
    { code: 'AU', names: { en: 'Australia' } }, { code: 'DE', names: { en: 'Germany' } }, { code: 'FR', names: { en: 'France' } },
    { code: 'IT', names: { en: 'Italy' } }, { code: 'ES', names: { en: 'Spain' } }, { code: 'SG', names: { en: 'Singapore' } },
    { code: 'MY', names: { en: 'Malaysia' } }, { code: 'JP', names: { en: 'Japan' } }, { code: 'KR', names: { en: 'South Korea' } },
    { code: 'CN', names: { en: 'China' } }, { code: 'HK', names: { en: 'Hong Kong' } }, { code: 'TW', names: { en: 'Taiwan' } },
    { code: 'IN', names: { en: 'India' } }, { code: 'OTHER', names: { en: 'Other' } },
  ];

  function translate(key, fallback) { return typeof window.__t === 'function' ? window.__t(key) : (i18n.translations?.[locale]?.[key] || fallback); }
  function fillTemplate(value, variables) { return typeof window.__fillTemplate === 'function' ? window.__fillTemplate(value, variables) : String(value || '').replace(/\{(\w+)\}/g, function (_, key) { return variables && variables[key] !== undefined ? variables[key] : '{' + key + '}'; }); }
  function countryName(value) { return typeof window.__countryName === 'function' ? window.__countryName(value) : (countries.find(function (country) { return country.code.toLowerCase() === String(value || '').trim().toLowerCase(); })?.names?.[locale] || countries.find(function (country) { return country.code.toLowerCase() === String(value || '').trim().toLowerCase(); })?.names?.en || String(value || '').trim()); }
  function countryCode(value) { return typeof window.__countryCode === 'function' ? window.__countryCode(value) : String(value || '').trim(); }

  function updateInquiryCopy() {
    document.querySelectorAll('[data-add-to-basket]').forEach(function (button) {
      if (button.lastChild && button.lastChild.nodeType === Node.TEXT_NODE && button.lastChild.textContent !== translate('addToBasket', 'Add to inquiry list')) {
        button.lastChild.textContent = translate('addToBasket', 'Add to inquiry list');
      }
    });
    document.querySelectorAll('[data-basket-open]').forEach(function (button) {
      button.setAttribute('aria-label', translate('basket', 'View inquiry list'));
      button.setAttribute('title', translate('basket', 'View inquiry list'));
    });
    var title = document.querySelector('#basket-title');
    if (title) {
      title.id = 'inquiry-list-title';
      if (title.textContent !== translate('basket', 'Inquiry list')) title.textContent = translate('basket', 'Inquiry list');
    }
    var panel = document.querySelector('.basket-panel');
    if (panel) panel.setAttribute('aria-labelledby', 'inquiry-list-title');
    var closeButton = document.querySelector('.basket-close');
    if (closeButton) closeButton.setAttribute('aria-label', translate('close', 'Close'));
    if (empty) empty.textContent = translate('basketEmpty', 'Your inquiry list is empty.');
  }

  function read() {
    try {
      var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(stored) ? stored.filter(function (item) { return item && item.id && item.title; }).map(function (item) {
        if (item.sku === item.title) {
          var match = String(item.url || '').match(/products\/[^/]*-([^/?#]+)\/?(?:[?#].*)?$/);
          if (match) item.sku = match[1];
        }
        return item;
      }) : [];
    } catch (_) { return []; }
  }

  function write(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
    render();
  }

  function total(items) { return items.reduce(function (sum, item) { return sum + item.quantity; }, 0); }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function closeCountryOptions() {
    if (countryOptions) countryOptions.hidden = true;
    if (countryInput) countryInput.setAttribute('aria-expanded', 'false');
  }

  function showCountryOptions() {
    if (countryOptions) countryOptions.hidden = false;
    if (countryInput) countryInput.setAttribute('aria-expanded', 'true');
  }

  function filterCountryOptions() {
    var query = countryInput ? countryInput.value.trim().toLowerCase() : '';
    if (!countryOptions) return;
    countryOptions.querySelectorAll('button').forEach(function (option) {
      option.hidden = !option.textContent.toLowerCase().includes(query);
    });
  }

  function selectCountry(country) {
    if (!countryInput) return;
    var code = countryCode(country);
    countryInput.value = countryName(code);
    localStorage.setItem('inquiry-country', code);
    closeCountryOptions();
  }

  function setupCountryPicker() {
    var footer = document.querySelector('.basket-footer');
    if (!footer || footer.querySelector('#basket-country')) return;
    footer.insertAdjacentHTML('afterbegin', '<div class="country-combobox basket-country-combobox"><input id="basket-country" name="country" placeholder="' + translate('searchCountry', 'Search country') + '" required autocomplete="off" aria-label="' + translate('country', 'Country') + '" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="basket-countries"><div id="basket-countries" class="country-options" role="listbox" hidden>' + countries.map(function (country) { return '<button type="button" role="option" data-country-code="' + escapeHtml(country.code) + '">' + escapeHtml(country.names[locale] || country.names.en || country.code) + '</button>'; }).join('') + '</div></div>');
    countryInput = document.querySelector('#basket-country');
    countryOptions = document.querySelector('#basket-countries');
    if (countryInput) countryInput.value = countryName(localStorage.getItem('inquiry-country') || '');
    countryInput?.addEventListener('focus', function () { filterCountryOptions(); showCountryOptions(); });
    countryInput?.addEventListener('input', function () {
      var country = countryInput.value.trim();
      if (country) localStorage.setItem('inquiry-country', countryCode(country)); else localStorage.removeItem('inquiry-country');
      filterCountryOptions();
      showCountryOptions();
    });
    countryInput?.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeCountryOptions(); });
  }

  function render() {
    var items = read();
    var itemCount = total(items);
    count.forEach(function (node) { node.textContent = String(itemCount); node.hidden = itemCount === 0; });
    if (clearButton) clearButton.disabled = items.length === 0;
    if (!list || !empty) return;
    empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    list.innerHTML = items.map(function (item) {
      var productUrl = item.url || '/products/' + encodeURIComponent(String(item.id).split('::')[0]) + '/';
      return '<article class="basket-item" data-basket-id="' + escapeHtml(item.id) + '">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '">' +
        '<div class="basket-item-copy"><strong><a class="basket-product-link" href="' + escapeHtml(productUrl) + '">' + escapeHtml(item.title) + '</a></strong>' +
        (item.sku ? '<span>SKU · ' + escapeHtml(item.sku) + (item.variants ? ' · ' + escapeHtml(item.variants) : '') + '</span>' : '') +
        '<div class="basket-item-actions"><div class="basket-quantity" aria-label="' + escapeHtml(translate('quantity', 'Quantity')) + '"><button type="button" data-basket-quantity="-1" aria-label="' + escapeHtml(translate('decreaseQuantity', 'Decrease quantity')) + '">−</button><span>' + item.quantity + '</span><button type="button" data-basket-quantity="1" aria-label="' + escapeHtml(translate('increaseQuantity', 'Increase quantity')) + '">+</button></div><button class="basket-remove" type="button" data-basket-remove>' + escapeHtml(translate('remove', 'Remove')) + '</button></div></div></article>';
    }).join('');
  }

  function open() { if (drawer) { drawer.hidden = false; document.body.classList.add('basket-open'); } }
  function close() { if (drawer) { drawer.hidden = true; document.body.classList.remove('basket-open'); } }

  function add(button) {
    var productCard = button.closest('.product-card');
    var variantGroups = button.closest('.detail-copy') ? button.closest('.detail-copy').querySelectorAll('.variant-group') : [];
    var variants = button.dataset.productVariants || Array.prototype.map.call(variantGroups, function (group) {
      var name = group.getAttribute('data-variant-name') || '';
      var value = group.querySelector('.variant-option.selected')?.getAttribute('data-value') || '';
      return name && value ? name + ': ' + value : '';
    }).filter(Boolean).join('; ');
    var productId = button.dataset.productId || button.dataset.productSku || button.dataset.productTitle || '';
    var productSku = productCard?.dataset.productSku || button.dataset.productSku || '';
    var item = {
      id: productId + (variants ? '::' + variants : ''),
      title: button.dataset.productTitle || '',
      sku: productSku,
      variants: variants,
      image: button.dataset.productImage || '',
      url: button.dataset.productUrl || '',
      quantity: 1
    };
    if (!item.id || !item.title) return;
    var items = read();
    var matching = items.find(function (existing) { return existing.id === item.id; });
    if (matching) matching.quantity = Math.min(999, matching.quantity + 1); else items.push(item);
    write(items);
    open();
  }

  async function inquiry(channel, button) {
    var items = read();
    if (!items.length) return;
    var countryValue = countryInput ? countryInput.value.trim() : '';
    if (!countryValue) {
      countryInput?.focus();
      showCountryOptions();
      return;
    }
    var country = countryName(countryValue);
    var countryId = countryCode(countryValue);
    localStorage.setItem('inquiry-country', countryId);
    var popup = channel === 'whatsapp' ? window.open('', '_blank') : null;
    if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = translate('inquiryPreparing', 'Preparing enquiry…'); }
    try {
      var response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ country: countryId, countryName: country, items: items.map(function (item) {
          return { title: item.title, sku: item.sku || '', variants: item.variants || '', quantity: item.quantity, url: item.url || '' };
        }) })
      });
      var result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to create inquiry.');
      var message = fillTemplate(translate('basketInquiryMessage', "I'm from {country}, hello, I would like to enquire about {count} items.\n\nInquiry ID: {id}\n\nPlease send me a quote and availability."), { country: country, count: result.itemCount, id: result.inquiryId });
      if (channel === 'email') {
        window.location.href = 'mailto:info@maesvanti.online?subject=' + encodeURIComponent(fillTemplate(translate('quoteRequestSubject', 'Quote request: {subject}'), { subject: result.inquiryId })) + '&body=' + encodeURIComponent(message);
      } else if (popup) {
        popup.location = whatsappUrl + '?text=' + encodeURIComponent(message);
      } else {
        window.open(whatsappUrl + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
      }
    } catch (error) {
      if (popup) popup.close();
      window.alert(error instanceof Error ? error.message : 'Unable to create inquiry right now.');
    } finally {
      if (button) { button.disabled = false; button.textContent = button.dataset.originalText || button.textContent; }
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var addButton = target.closest('[data-add-to-basket]');
    if (addButton) { event.preventDefault(); event.stopPropagation(); add(addButton); return; }
    if (target.closest('[data-basket-open]')) { open(); return; }
    if (target.closest('[data-basket-close]')) { close(); return; }
    if (target.closest('[data-basket-clear]')) { write([]); return; }
    var countryOption = target.closest('#basket-countries button');
    if (countryOption) { selectCountry(countryOption.dataset.countryCode || countryOption.textContent.trim()); return; }
    var item = target.closest('.basket-item');
    if (item && target.closest('[data-basket-remove]')) { write(read().filter(function (entry) { return entry.id !== item.dataset.basketId; })); return; }
    var quantity = target.closest('[data-basket-quantity]');
    if (item && quantity) {
      var items = read();
      var selected = items.find(function (entry) { return entry.id === item.dataset.basketId; });
      if (!selected) return;
      selected.quantity += Number(quantity.getAttribute('data-basket-quantity') || 0);
      write(items.filter(function (entry) { return entry.quantity > 0; }));
      return;
    }
    var inquiryButton = target.closest('[data-basket-inquiry]');
    if (inquiryButton) inquiry(inquiryButton.getAttribute('data-basket-inquiry'), inquiryButton);
    if (!target.closest('.basket-country-combobox')) closeCountryOptions();
  });

  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { close(); closeCountryOptions(); } });
  window.addEventListener('storage', function (event) { if (event.key === storageKey) render(); });
  updateInquiryCopy();
  setupCountryPicker();
  render();
})();
