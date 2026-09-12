import { defineMiddleware } from 'astro:middleware';

const discoveryLinks = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</llms.txt>; rel="describedby"',
].join(', ');

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    response.headers.set('Link', discoveryLinks);
  }

  return response;
});
