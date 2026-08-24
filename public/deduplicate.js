(function () {
  function normalize(value) {
    return (value || '').toLowerCase().replace(/[\\s\\p{P}\\p{S}]+/gu, '');
  }
  function cleanCard(card) {
    var copy = card.querySelector('.product-copy');
    var paragraph = copy && copy.querySelector('p');
    if (!copy || !paragraph) return;
    var description = normalize(paragraph.textContent);
    var titles = [copy.querySelector('strong'), copy.querySelector('span')].map(function (node) { return normalize(node && node.textContent); });
    if (description && titles.indexOf(description) !== -1) {
      var wrap = paragraph.closest('.description-wrap');
      if (wrap) wrap.remove(); else paragraph.remove();
    }
  }
  function cleanAll() { document.querySelectorAll('.product-card').forEach(cleanCard); }
  function init() {
    cleanAll();
    document.querySelectorAll('.product-grid').forEach(function (grid) {
      new MutationObserver(cleanAll).observe(grid, { childList: true });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
