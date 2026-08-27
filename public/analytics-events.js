(function () {
  function track(name, parameters) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, parameters || {});
  }

  function text(selector) {
    var element = document.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }

  function productFrom(element) {
    var card = element && element.closest ? element.closest('.product-card') : null;
    var detail = document.querySelector('main[data-product-slug]');
    var title = card?.dataset.productTitle || text('h1');
    var itemId = card?.dataset.productSku || card?.dataset.productId || detail?.getAttribute('data-product-slug') || text('.sku').replace(/^SKU\s*[·.]\s*/, '');

    return {
      item_id: itemId || undefined,
      item_name: title || undefined,
    };
  }

  function readBasketItems() {
    try {
      var stored = JSON.parse(localStorage.getItem('maesvanti-basket') || '[]');
      if (!Array.isArray(stored)) return [];
      return stored.filter(function (item) { return item && item.id && item.title; }).map(function (item) {
        return {
          item_id: item.sku || item.id,
          item_name: item.title,
          quantity: Number(item.quantity) || 1,
        };
      });
    } catch (_) {
      return [];
    }
  }

  function trackContact(channel, element) {
    var product = productFrom(element);
    track('generate_lead', {
      lead_channel: channel,
      item_id: product.item_id,
      item_name: product.item_name,
    });
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    var addButton = target.closest('[data-add-to-basket]');
    if (addButton) {
      track('add_to_cart', { items: [productFrom(addButton)] });
      return;
    }

    if (target.closest('[data-basket-open]')) {
      track('view_cart', { items: readBasketItems() });
      return;
    }

    var productCard = target.closest('.product-card');
    if (productCard && !target.closest('button')) {
      track('select_item', { items: [productFrom(productCard)] });
      return;
    }

    var basketInquiry = target.closest('[data-basket-inquiry]');
    if (basketInquiry) {
      trackContact(basketInquiry.getAttribute('data-basket-inquiry') || 'unknown', basketInquiry);
      return;
    }

    var contactLink = target.closest('a[href^="https://wa.me/"], a[href^="mailto:"]');
    if (contactLink) trackContact(contactLink.href.startsWith('mailto:') ? 'email' : 'whatsapp', contactLink);
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.matches('.search-page-form')) {
      var searchInput = form.querySelector('input[name="q"]');
      var searchTerm = searchInput instanceof HTMLInputElement ? searchInput.value.trim() : '';
      if (searchTerm) track('search', { search_term_length: searchTerm.length });
      return;
    }

    if (form.matches('#inquiry-form')) {
      track('generate_lead', {
        lead_channel: text('#inquiry-submit').toLowerCase().includes('email') ? 'email' : 'whatsapp',
        item_id: text('#inquiry-sku') || undefined,
        item_name: text('#inquiry-title') || undefined,
      });
    }
  });

  document.addEventListener('keydown', function (event) {
    var target = event.target;
    if (event.key !== 'Enter' || !(target instanceof HTMLInputElement) || !target.matches('.global-search')) return;
    var searchTerm = target.value.trim();
    if (searchTerm) track('search', { search_term_length: searchTerm.length });
  });

  window.addEventListener('analytics:track', function (event) {
    var detail = event instanceof CustomEvent ? event.detail : null;
    if (detail && typeof detail.name === 'string') track(detail.name, detail.parameters);
  });

  var detailPage = document.querySelector('main[data-product-slug]');
  if (detailPage) track('view_item', { items: [productFrom(detailPage)] });
})();
