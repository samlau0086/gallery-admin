(function () {
  const modelContext = navigator.modelContext;
  if (!modelContext || typeof modelContext.provideContext !== 'function') return;
  const jsonSchema = (properties, required) => ({ type: 'object', properties, required: required || [], additionalProperties: false });
  const navigate = (url) => { window.location.href = url; return { url }; };
  const language = () => new URLSearchParams(location.search).get('lang') || 'en';
  const tools = [
    {
      name: 'search_catalog',
      description: 'Search the published Maesvanti Gallery catalog by product name, SKU, brand, category, or tag.',
      inputSchema: jsonSchema({ query: { type: 'string', description: 'Search terms.' } }, ['query']),
      execute: async ({ query }) => {
        const response = await fetch('/api/search?q=' + encodeURIComponent(query || ''));
        if (!response.ok) throw new Error('Catalog search is unavailable.');
        const data = await response.json();
        return { results: data.results || [], url: '/search?q=' + encodeURIComponent(query || '') };
      },
    },
    {
      name: 'filter_catalog',
      description: 'Open the catalog filtered by a tag or brand.',
      inputSchema: jsonSchema({ type: { type: 'string', enum: ['tags', 'brands'] }, term: { type: 'string' } }, ['type', 'term']),
      execute: ({ type, term }) => navigate('/?lang=' + encodeURIComponent(language()) + '&filter=' + encodeURIComponent(type) + '&term=' + encodeURIComponent(term)),
    },
    {
      name: 'get_product',
      description: 'Open a published product detail page by its slug or SKU.',
      inputSchema: jsonSchema({ slug: { type: 'string' }, sku: { type: 'string' } }),
      execute: async ({ slug, sku }) => {
        let productSlug = slug;
        if (!productSlug && sku) {
          const response = await fetch('/api/products/by-sku?sku=' + encodeURIComponent(sku));
          if (!response.ok) throw new Error('Product not found.');
          productSlug = (await response.json()).slug;
        }
        if (!productSlug) throw new Error('Provide a product slug or SKU.');
        return navigate('/products/' + encodeURIComponent(productSlug) + '/?lang=' + encodeURIComponent(language()));
      },
    },
    {
      name: 'request_quote',
      description: 'Open the enquiry form for a product, optionally specifying a quantity.',
      inputSchema: jsonSchema({ slug: { type: 'string' }, quantity: { type: 'integer', minimum: 1, maximum: 999 } }, ['slug']),
      execute: ({ slug, quantity }) => {
        sessionStorage.setItem('webmcp-inquiry-quantity', String(quantity || 1));
        return navigate('/products/' + encodeURIComponent(slug) + '/?lang=' + encodeURIComponent(language()) + '#inquiry');
      },
    },
  ];
  try { modelContext.provideContext({ tools }); } catch (error) { console.warn('WebMCP unavailable:', error); }
  if (location.hash === '#inquiry') setTimeout(() => document.querySelector('[data-inquiry-product]')?.click(), 0);
})();
