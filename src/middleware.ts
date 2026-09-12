import { defineMiddleware } from 'astro:middleware';

const discoveryLinks = [
  '</.well-known/ai-catalog.json>; rel="ai-catalog"',
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</llms.txt>; rel="describedby"',
].join(', ');

const acceptsMarkdown = (request: Request) => request.headers.get('accept')?.split(',').some((entry) => {
  const [mediaType, ...parameters] = entry.trim().toLowerCase().split(';');
  if (mediaType !== 'text/markdown') return false;
  const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
  return !quality || Number(quality.trim().slice(2)) > 0;
}) ?? false;

const decodeHtml = (value: string) => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&#x27;/gi, "'");

const htmlToMarkdown = (html: string) => {
  let markdown = html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<(script|style|svg|noscript|form|button)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--(?:[\s\S]*?)-->/g, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]+alt=["']([^"']*)["'][^>]+src=["']([^"']+)["'][^>]*>/gi, '![$1]($2)')
    .replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, '![]($1)')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1\n')
    .replace(/<br\s*\/?>(?=\S)/gi, '\n')
    .replace(/<\/(p|div|section|article|header|main|aside|nav|ul|ol|figure|figcaption|table|tr)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .split('\n').map((line) => decodeHtml(line).replace(/[ \t]+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
};

const markdownTokens = (markdown: string) => Math.ceil(markdown.length / 4);

export const onRequest = defineMiddleware(async ({ request }, next) => {
  const response = await next();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    response.headers.set('Link', discoveryLinks);
    response.headers.set('Vary', 'Accept');

    if (acceptsMarkdown(request)) {
      const markdown = htmlToMarkdown(await response.text());
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/markdown; charset=UTF-8');
      headers.set('x-markdown-tokens', String(markdownTokens(markdown)));
      return new Response(markdown, { status: response.status, statusText: response.statusText, headers });
    }
  }

  return response;
});
