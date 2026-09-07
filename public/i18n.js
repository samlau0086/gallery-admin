(function () {
  var config = window.__i18n || {};
  var dictionaries = config.translations || { en: {} };
  var localeMeta = config.localeMeta || {};
  var countryOptions = Array.isArray(config.countryOptions) ? config.countryOptions : [];
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
  function setLabelText(selector, key) {
    document.querySelectorAll(selector).forEach(function (node) {
      var labelText = Array.prototype.slice.call(node.childNodes).find(function (child) { return child.nodeType === 3 && child.textContent.trim(); });
      if (labelText) labelText.textContent = text(key);
      else node.insertBefore(document.createTextNode(text(key)), node.firstChild);
    });
  }
  function setAttr(selector, attr, key) { var node = document.querySelector(selector); if (node) node.setAttribute(attr, text(key)); }
  function fillTemplate(value, variables) { return String(value || '').replace(/\{(\w+)\}/g, function (_, key) { return variables && variables[key] !== undefined ? variables[key] : '{' + key + '}'; }); }
  function countryEntry(value) {
    var normalized = String(value || '').trim().toLowerCase();
    return countryOptions.find(function (country) {
      return country.code.toLowerCase() === normalized || Object.keys(country.names || {}).some(function (locale) { return String(country.names[locale] || '').toLowerCase() === normalized; });
    });
  }
  function countryCode(value) { var entry = countryEntry(value); return entry ? entry.code : String(value || '').trim(); }
  function countryName(value) { var entry = countryEntry(value); return entry ? (entry.names[lang] || entry.names.en || entry.code) : String(value || '').trim(); }
  function renderCountryOptions() {
    document.querySelectorAll('.country-options').forEach(function (container) {
      container.innerHTML = countryOptions.map(function (country) { return '<button type="button" role="option" data-country-code="' + escapeHtml(country.code) + '">' + escapeHtml(country.names[lang] || country.names.en || country.code) + '</button>'; }).join('');
    });
    document.querySelectorAll('#inquiry-country, #basket-country').forEach(function (input) {
      var storedCountry = localStorage.getItem('inquiry-country') || input.value;
      if (storedCountry) input.value = countryName(storedCountry);
    });
  }
  window.__fillTemplate = fillTemplate; window.__countryCode = countryCode; window.__countryName = countryName; window.__renderCountryOptions = renderCountryOptions;
  function getLocaleMeta(locale) { return localeMeta[locale] || { code: locale.toUpperCase(), flag: '🌐', name: locale }; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]; }); }
  function browserLocale() {
    if (typeof navigator === 'undefined') return '';
    var languages = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var index = 0; index < languages.length; index += 1) {
      var candidate = String(languages[index] || '').toLowerCase().split(/[-_]/)[0];
      if (supportedLocales.indexOf(candidate) >= 0) return candidate;
    }
    return '';
  }
  function suggestionText(dictionary, key, language) {
    return String(dictionary[key] || (dictionaries.en && dictionaries.en[key]) || key).replace(/\{language\}/g, language);
  }
  function closeLanguageSuggestion(modal) {
    localStorage.setItem('site-language-prompted', '1');
    document.documentElement.classList.remove('language-suggestion-open');
    modal.remove();
  }
  function showLanguageSuggestion() {
    if (params.has('lang') || stored || localStorage.getItem('site-language-prompted')) return;
    if (document.querySelector('.language-suggestion-modal')) return;
    var suggested = browserLocale();
    if (!suggested || suggested === lang || !dictionaries[suggested]) return;
    var meta = getLocaleMeta(suggested);
    var dictionary = dictionaries[suggested];
    var modal = document.createElement('div');
    modal.className = 'language-suggestion-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'language-suggestion-title');
    document.documentElement.classList.add('language-suggestion-open');
    modal.innerHTML = '<section class="language-suggestion-card"><div class="language-suggestion-locale"><span aria-hidden="true">' + escapeHtml(meta.flag) + '</span><strong>' + escapeHtml(meta.code) + '</strong></div><h2 id="language-suggestion-title">' + escapeHtml(suggestionText(dictionary, 'languageSuggestionTitle', meta.name)) + '</h2><p>' + escapeHtml(suggestionText(dictionary, 'languageSuggestionMessage', meta.name)) + '</p><div class="language-suggestion-actions"><button type="button" data-language-suggestion="dismiss">' + escapeHtml(suggestionText(dictionary, 'languageSuggestionDismiss', meta.name)) + '</button><button type="button" data-language-suggestion="accept">' + escapeHtml(suggestionText(dictionary, 'languageSuggestionAccept', meta.name)) + '</button></div></section>';
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        closeLanguageSuggestion(modal);
        return;
      }
      var action = event.target.closest('[data-language-suggestion]');
      if (!action) return;
      if (action.dataset.languageSuggestion === 'dismiss') {
        closeLanguageSuggestion(modal);
        return;
      }
      localStorage.setItem('site-language-prompted', '1');
      localStorage.setItem('site-language', suggested);
      window.location.href = localizedUrl(window.location.href, suggested);
    });
    document.body.appendChild(modal);
  }
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
    renderCountryOptions();
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
    setLabelText('#contact-modal label:nth-of-type(1)', 'name');
    setLabelText('#contact-modal label:nth-of-type(2)', 'email');
    setLabelText('#contact-modal label:nth-of-type(3)', 'whatsappOptional');
    setLabelText('#contact-modal label:nth-of-type(4)', 'message');
    setText('#contact-modal .contact-submit', 'sendMessage');
    setLabelText('#inquiry-form label:nth-of-type(1)', 'quantity');
    setLabelText('#inquiry-form label:nth-of-type(2)', 'country');
    setAttr('#inquiry-country', 'placeholder', 'searchCountry');
    setLabelText('#inquiry-form label:nth-of-type(3)', 'message');
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
  window.__applyLocale = function () { addLanguageSwitcher(); translatePage(); showLanguageSuggestion(); };
  document.addEventListener('astro:page-load', window.__applyLocale);
  localStorage.setItem('site-language', lang);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.__applyLocale); else window.__applyLocale();
}());
