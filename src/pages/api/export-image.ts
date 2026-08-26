import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const source = url.searchParams.get('url');
  if (!source) return new Response('Missing image URL.', { status: 400 });

  let imageUrl: URL;
  try { imageUrl = new URL(source); } catch { return new Response('Invalid image URL.', { status: 400 }); }
  if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'xcimg.szwego.com') return new Response('Image host is not allowed.', { status: 403 });

  const response = await fetch(imageUrl, { headers: { accept: 'image/avif,image/webp,image/*,*/*;q=0.8' } });
  if (!response.ok || !response.body) return new Response('Unable to load image.', { status: 502 });

  return new Response(response.body, {
    headers: {
      'content-type': response.headers.get('content-type') || 'image/jpeg',
      'cache-control': 'public, max-age=86400',
    },
  });
};
