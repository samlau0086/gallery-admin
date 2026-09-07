(function () {
  var config = window.__i18n || {};
  var dictionaries = config.translations || { en: {} };
  var localeMeta = config.localeMeta || {};
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
  function getLocaleMeta(locale) { return localeMeta[locale] || { code: locale.toUpperCase(), flag: '🌐', name: locale }; }
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
    document.querySelectorAll('.language-switcher').forEach(function (node) { node.remove(); });
    var basket = document.querySelector('.basket-fab');
    if (!basket) return;
    var wrap = document.createElement('div');
    wrap.className = 'language-switcher';
    wrap.setAttribute('aria-label', text('switchLanguage'));
    var current = getLocaleMeta(lang);
    wrap.innerHTML = '<button class="language-current" type="button" aria-expanded="false" aria-haspopup="listbox" aria-label="' + text('switchLanguage') + '"><span class="language-flag" aria-hidden="true">' + current.flag + '</span><span class="language-code">' + current.code + '</span><span class="language-chevron" aria-hidden="true">⌄</span></button><div class="language-menu" role="listbox" hidden>' + supportedLocales.map(function (locale) { var meta = getLocaleMeta(locale); return '<button type="button" role="option" data-language="' + locale + '" aria-label="' + meta.name + '"><span class="language-flag" aria-hidden="true">' + meta.flag + '</span><span class="language-code">' + meta.code + '</span></button>'; }).join('') + '</div>';
    wrap.addEventListener('click', function (event) {
      var currentButton = event.target.closest('.language-current');
      if (currentButton) {
        var expanded = currentButton.getAttribute('aria-expanded') === 'true';
        currentButton.setAttribute('aria-expanded', String(!expanded));
        wrap.querySelector('.language-menu').hidden = expanded;
        wrap.classList.toggle('is-open', !expanded);
        return;
      }
      var option = event.target.closest('button[data-language]');
      if (option) {
        var next = option.dataset.language || 'en';
        localStorage.setItem('site-language', next);
        window.location.href = localizedUrl(window.location.href, next);
      }
    });
    if (!window.__languageSwitcherEventsBound) {
      document.addEventListener('click', function (event) {
        document.querySelectorAll('.language-switcher').forEach(function (switcher) {
          if (switcher.contains(event.target)) return;
          var currentButton = switcher.querySelector('.language-current');
          var menu = switcher.querySelector('.language-menu');
          if (currentButton && menu) {
            currentButton.setAttribute('aria-expanded', 'false');
            menu.hidden = true;
            switcher.classList.remove('is-open');
          }
        });
      });
      document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('.language-switcher').forEach(function (switcher) {
          var currentButton = switcher.querySelector('.language-current');
          var menu = switcher.querySelector('.language-menu');
          if (currentButton && menu) {
            currentButton.setAttribute('aria-expanded', 'false');
            menu.hidden = true;
            switcher.classList.remove('is-open');
          }
        });
      });
      window.__languageSwitcherEventsBound = true;
    }
    basket.parentNode.insertBefore(wrap, basket);
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
    document.querySelectorAll('.language-switcher button[data-language]').forEach(function (button) {
      var next = button.dataset.language || 'en';
      button.classList.toggle('active', next === lang);
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
