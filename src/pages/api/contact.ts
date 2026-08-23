import type { APIRoute } from 'astro';

export const prerender = false;

type RuntimeEnv = Record<string, string | undefined>;

function getEnv(locals: App.Locals): RuntimeEnv {
  const runtime = (locals as App.Locals & { runtime?: { env?: RuntimeEnv } }).runtime;
  return runtime?.env ?? import.meta.env;
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'Invalid request.' }, 415);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot field: real visitors never see or fill this field.
  if (String(payload.website || '').trim()) return json({ ok: true });

  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const message = String(payload.message || '').trim();
  const whatsapp = String(payload.whatsapp || '').trim();
  const product = String(payload.product || '').trim();
  const source = String(payload.source || 'gallery-admin').trim();

  if (name.length < 2 || name.length > 100) return json({ error: 'Please enter your name.' }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200) return json({ error: 'Please enter a valid email.' }, 400);
  if (message.length < 10 || message.length > 4000) return json({ error: 'Please enter a message.' }, 400);

  const env = getEnv(locals);
  const endpoint = env.GOOGLE_APPS_SCRIPT_URL;
  if (!endpoint) return json({ error: 'Contact form is not configured.' }, 503);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email, whatsapp, product, message, source, rating: payload.rating || '', title: payload.title || '', variants: payload.variants || '', submittedAt: new Date().toISOString() }),
    });
    if (!response.ok) return json({ error: 'Unable to send your message right now.' }, 502);
    return json({ ok: true });
  } catch {
    return json({ error: 'Unable to send your message right now.' }, 502);
  }
};
