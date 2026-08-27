import type { APIRoute } from 'astro';

export const prerender = false;

type RuntimeEnv = Record<string, string | undefined>;
type InquiryItem = {
  title: string;
  sku: string;
  variants: string;
  quantity: number;
  url: string;
};

function getEnv(locals: App.Locals): RuntimeEnv {
  const runtime = (locals as App.Locals & { runtime?: { env?: RuntimeEnv } }).runtime;
  return runtime?.env ?? import.meta.env;
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

function normalizeItems(value: unknown): InquiryItem[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 200) return [];

  const items: InquiryItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const title = String(item.title || '').trim().slice(0, 300);
    const sku = String(item.sku || '').trim().slice(0, 120);
    const variants = String(item.variants || '').trim().slice(0, 300);
    const url = String(item.url || '').trim().slice(0, 1_500);
    const quantity = Math.floor(Number(item.quantity));
    if (!title || !Number.isFinite(quantity) || quantity < 1 || quantity > 999) continue;
    items.push({ title, sku, variants, quantity, url });
  }
  return items;
}

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

  const country = String(payload.country || '').trim().slice(0, 100);
  const items = normalizeItems(payload.items);
  if (!country) return json({ error: 'Please select your country.' }, 400);
  if (!items.length) return json({ error: 'Please add at least one item.' }, 400);

  const env = getEnv(locals);
  const endpoint = env.GOOGLE_APPS_SCRIPT_INQUIRY_URL;
  if (!endpoint) return json({ error: 'Inquiry service is not configured.' }, 503);

  const submittedAt = new Date().toISOString();
  const inquiryId = `INQ-${submittedAt.slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'basket-inquiry',
        inquiryId,
        country,
        items,
        submittedAt,
      }),
    });
    if (!response.ok) return json({ error: 'Unable to create your inquiry right now.' }, 502);
    return json({ ok: true, inquiryId, itemCount: items.length });
  } catch {
    return json({ error: 'Unable to create your inquiry right now.' }, 502);
  }
};
