import type { APIRoute } from 'astro';
export const prerender = false;
type Env = Record<string, string | undefined>;
const getEnv = (locals: App.Locals) => ((locals as App.Locals & { runtime?: { env?: Env } }).runtime?.env ?? import.meta.env) as Env;
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Invalid request.' }, 415);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || String(payload.website || '').trim()) return json({ ok: true });
  const product = String(payload.product || '').trim(); const author = String(payload.name || '').trim(); const email = String(payload.email || '').trim(); const body = String(payload.body || '').trim(); const rating = Number(payload.rating);
  if (!/^[a-z0-9-]+$/.test(product) || author.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || body.length < 10 || rating < 1 || rating > 5) return json({ error: 'Please complete the review form.' }, 400);
  const env = getEnv(locals); const token = env.GITHUB_CONTENT_TOKEN; const repo = env.GITHUB_REPO || 'samlau0086/gallery-admin'; const branch = env.GITHUB_BRANCH || 'main';
  if (!token) return json({ error: 'Review storage is not configured.' }, 503);
  const slug = `${Date.now()}-${author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)}`;
  const path = `src/content/reviews/${slug}.md`; const frontmatter = [`product: ${JSON.stringify(product)}`,`author: ${JSON.stringify(author)}`,`email: ${JSON.stringify(email)}`,`rating: ${rating}`,`title: ${JSON.stringify(String(payload.title || ''))}`,`review: ${JSON.stringify(body)}`,`date: ${JSON.stringify(new Date().toISOString().slice(0,10))}`,`variants: ${JSON.stringify(String(payload.variants || ''))}`,`status: "pending"`].join('\n'); const content = `---\n${frontmatter}\n---\n`;
  const endpoint = `https://api.github.com/repos/${repo}/contents/${path}`;
  try { const response = await fetch(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'gallery-admin' }, body: JSON.stringify({ message: `Add review for ${product}`, content: btoa(unescape(encodeURIComponent(content))), branch }) }); if (!response.ok) return json({ error: 'Unable to save review.' }, 502); return json({ ok: true }); } catch { return json({ error: 'Unable to save review.' }, 502); }
};
