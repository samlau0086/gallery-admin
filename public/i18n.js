(function () {
  var config = window.__i18n || {};
  var dictionaries = config.translations || { en: {} };
  var supportedLocales = Array.isArray(config.supportedLocales) && config.supportedLocales.length ? config.supportedLocales : Object.keys(dictionaries);
  if (!supportedLocales.length) supportedLocales = ['en'];
  var params = new URLSearchParams(window.location.search);
  var requested = params.get('lang');
  var stored = localStorage.getItem('site-language');
  var lang = supportedLocales.indexOf(requested) >= 0 ? requested : (supportedLocales.indexOf(stored) >= 0 ? stored : supportedLocales[0]);
  function text(key) { return (dictionaries[lang] && dictionaries[lang][key]) || (dictionaries.en && dictionaries.en[key]) || key; }
  function localizedUrl(url, next) { var target = new URL(url || window.location.href, window.location.origin); target.searchParams.set('lang', next); return target.pathname + (target.searchParams.toString() ? '?' + target.searchParams.toString() : ''); }
  window.__locale = lang; window.__t = text; window.__localizedUrl = localizedUrl;
  function setText(selector, key) { var node = document.querySelector(selector); if (node) node.textContent = text(key); }
  function setAttr(selector, attr, key) { var node = document.querySelector(selector); if (node) node.setAttribute(attr, text(key)); }
  function rewriteInternalLinks() {
    document.querySelectorAll('a[href^="/"]').forEach(function (link) {
      if (link.hasAttribute('data-language-link') || link.hasAttribute('data-no-lang')) return;
      var href = link.getAttribute('href') || '';
      if (href.startsWith('javascript:') || href.startsWith('#')) return;
      link.href = localizedUrl(href, lang);
    });
    document.querySelectorAll('form[action^="/"]').forEach(function (form) {
      var action = form.getAttribute('action') || '';
      form.action = localizedUrl(action, lang);
    });
  }
  function addLanguageSwitcher() {
    var header = document.querySelector('.header-right');
    if (!header || header.querySelector('.language-switcher')) return;
    var wrap = document.createElement('div');
    wrap.className = 'language-switcher';
    wrap.setAttribute('aria-label', text('switchLanguage'));
    wrap.innerHTML = supportedLocales.map(function (locale) { return '<a href="#" data-language="' + locale + '">' + locale.toUpperCase() + '</a>'; }).join('<span>/</span>');
    wrap.addEventListener('click', function (event) {
      var link = event.target.closest('a[data-language]');
      if (!link) return;
      event.preventDefault();
      var next = link.dataset.language || 'en';
      localStorage.setItem('site-language', next);
      window.location.href = localizedUrl(window.location.href, next);
    });
    header.insertBefore(wrap, header.firstChild);
  }
  function translatePage() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.locale = lang;
    setText('.category-trigger span:last-child', 'category');
    setText('.search-trigger span:last-child', 'search');
    setAttr('.global-search', 'placeholder', 'searchCollection');
    setAttr('.global-search', 'aria-label', 'searchCollection');
    setAttr('.category-list', 'aria-label', 'categories');
    setText('.category-option[data-category="All"]', 'allProducts');
    setText('.category-parent[data-filter-mode="tags"]', 'tags');
    setText('.category-parent[data-filter-mode="brands"]', 'brands');
    document.querySelectorAll('.category-submenu').forEach(function (node) {
      var submenu = node.getAttribute('data-submenu');
      var heading = node.querySelector('.category-submenu-heading');
      var loading = node.querySelector('.category-terms-loading');
      if (heading && submenu) heading.textContent = text(submenu);
      if (loading) loading.textContent = text('loading');
      node.setAttribute('aria-label', submenu ? text(submenu) : '');
    });
    setText('.basket-header h2', 'basket');
    setText('[data-basket-clear]', 'clear');
    setText('#basket-empty', 'basketEmpty');
    setAttr('.basket-close', 'aria-label', 'close');
    setText('.basket-whatsapp', 'whatsappInquiry');
    setText('.basket-email', 'emailInquiry');
    setAttr('.inquiry-close, .modal-close', 'aria-label', 'close');
    setText('#contact-modal .eyebrow', 'getInTouch');
    setText('#contact-modal h2', 'contactUs');
    setText('#contact-modal .modal-card > p', 'contactIntro');
    setText('#contact-modal label:nth-of-type(1)', 'name');
    setText('#contact-modal label:nth-of-type(2)', 'email');
    setText('#contact-modal label:nth-of-type(3)', 'whatsappOptional');
    setText('#contact-modal label:nth-of-type(4)', 'message');
    setText('#contact-modal .contact-submit', 'sendMessage');
    setText('#inquiry-form label:nth-of-type(1)', 'quantity');
    setText('#inquiry-form label:nth-of-type(2)', 'country');
    setAttr('#inquiry-country', 'placeholder', 'searchCountry');
    setText('#inquiry-form label:nth-of-type(3)', 'message');
    setText('#inquiry-submit', 'sendViaWhatsApp');
    setAttr('.basket-fab', 'aria-label', 'basket');
    setAttr('.basket-fab', 'title', 'basket');
    setText('.tab[data-category="All"]', 'all');
    setText('.tab[data-kind="new"]', 'new');
    setText('.tab[data-kind="video"]', 'video');
    setText('.tab[data-kind="photos"]', 'photos');
    setText('.collection-count', 'loadingCollection');
    setText('[data-view="grid"]', 'gallery');
    setText('[data-view="large"]', 'largeImage');
    setText('[data-view="list"]', 'listView');
    setText('#export-modal .eyebrow', 'pdfExport');
    setText('#export-modal-title', 'preparingPdf');
    setText('#export-modal-status', 'starting');
    setText('#export-cancel', 'cancel');
    setText('#export-save', 'savePdf');
    setText('.search-page-form button', 'searchButton');
    setAttr('.search-page-input', 'placeholder', 'searchCollection');
    setAttr('.search-page-input', 'aria-label', 'searchCollection');
    setText('.search-empty-page', 'noMatchingWorks');
    document.querySelectorAll('.basket-card-button, .add-to-basket-button').forEach(function (node) {
      var image = node.querySelector('img');
      node.textContent = '';
      if (image) node.appendChild(image);
      node.appendChild(document.createTextNode(' ' + text('addToBasket')));
    });
    document.querySelectorAll('.description-toggle, #detail-body-toggle').forEach(function (node) {
      var expanded = node.getAttribute('aria-expanded') === 'true';
      node.textContent = text(expanded ? 'viewLess' : 'viewMore');
    });
    document.querySelectorAll('.product-card, .back, .contact-link, .inquiry-link, .view-menu a, .category-option, .search-result').forEach(function (link) {
      if (link.tagName === 'A') link.href = localizedUrl(link.getAttribute('href') || '', lang);
    });
    rewriteInternalLinks();
    document.querySelectorAll('.language-switcher a').forEach(function (link) {
      var next = link.dataset.language || 'en';
      link.href = localizedUrl(window.location.href, next);
      link.classList.toggle('active', next === lang);
    });
    document.querySelectorAll('.product-grid .basket-card-button').forEach(function (node) {
      var image = node.querySelector('img');
      node.textContent = '';
      if (image) node.appendChild(image);
      node.appendChild(document.createTextNode(' ' + text('addToBasket')));
    });
    document.querySelectorAll('.detail-copy .contact-link').forEach(function (node) {
      if (node.textContent?.includes('WhatsApp')) node.textContent = text('whatsappInquiry');
      if (node.textContent?.includes('Email')) node.textContent = text('emailInquiry');
    });
  }
  window.__applyLocale = function () { addLanguageSwitcher(); translatePage(); };
  document.addEventListener('astro:page-load', window.__applyLocale);
  localStorage.setItem('site-language', lang);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.__applyLocale); else window.__applyLocale();
}());