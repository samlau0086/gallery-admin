(function () {
  var storageKey = 'maesvanti-basket';
  var drawer = document.querySelector('#basket-drawer');
  var list = document.querySelector('#basket-items');
  var count = document.querySelectorAll('[data-basket-count]');
  var empty = document.querySelector('#basket-empty');

  function read() {
    try {
      var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(stored) ? stored.filter(function (item) { return item && item.id && item.title; }) : [];
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

  function render() {
    var items = read();
    var itemCount = total(items);
    count.forEach(function (node) { node.textContent = String(itemCount); node.hidden = itemCount === 0; });
    if (!list || !empty) return;
    empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    list.innerHTML = items.map(function (item) {
      return '<article class="basket-item" data-basket-id="' + escapeHtml(item.id) + '">' +
        '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '">' +
        '<div class="basket-item-copy"><strong>' + escapeHtml(item.title) + '</strong>' +
        (item.sku ? '<span>SKU · ' + escapeHtml(item.sku) + '</span>' : '') +
        '<div class="basket-item-actions"><div class="basket-quantity" aria-label="Quantity"><button type="button" data-basket-quantity="-1" aria-label="Decrease quantity">−</button><span>' + item.quantity + '</span><button type="button" data-basket-quantity="1" aria-label="Increase quantity">+</button></div><button class="basket-remove" type="button" data-basket-remove>Remove</button></div></div></article>';
    }).join('');
  }

  function open() { if (drawer) { drawer.hidden = false; document.body.classList.add('basket-open'); } }
  function close() { if (drawer) { drawer.hidden = true; document.body.classList.remove('basket-open'); } }

  function add(button) {
    var item = {
      id: button.dataset.productId || button.dataset.productSku || button.dataset.productTitle || '',
      title: button.dataset.productTitle || '',
      sku: button.dataset.productSku || '',
      image: button.dataset.productImage || '',
      url: button.dataset.productUrl || location.href,
      quantity: 1
    };
    if (!item.id || !item.title) return;
    var items = read();
    var matching = items.find(function (existing) { return existing.id === item.id; });
    if (matching) matching.quantity = Math.min(999, matching.quantity + 1); else items.push(item);
    write(items);
    open();
  }

  function inquiry(channel) {
    var items = read();
    if (!items.length) return;
    var message = 'Hello, I would like to enquire about the following items:\n\n' + items.map(function (item, index) {
      return (index + 1) + '. ' + item.title + (item.sku ? ' (SKU: ' + item.sku + ')' : '') + ' × ' + item.quantity + (item.url ? '\n' + item.url : '');
    }).join('\n\n') + '\n\nPlease send me a quote and availability.';
    if (channel === 'email') {
      window.location.href = 'mailto:info@maesvanti.online?subject=' + encodeURIComponent('Basket enquiry') + '&body=' + encodeURIComponent(message);
    } else {
      window.open('https://wa.me/85265426672?text=' + encodeURIComponent(message), '_blank', 'noopener');
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var addButton = target.closest('[data-add-to-basket]');
    if (addButton) { event.preventDefault(); event.stopPropagation(); add(addButton); return; }
    if (target.closest('[data-basket-open]')) { open(); return; }
    if (target.closest('[data-basket-close]')) { close(); return; }
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
    if (inquiryButton) inquiry(inquiryButton.getAttribute('data-basket-inquiry'));
  });

  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
  window.addEventListener('storage', function (event) { if (event.key === storageKey) render(); });
  render();
})();
