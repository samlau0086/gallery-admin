import type { APIRoute } from 'astro';
export const prerender = false;
type RuntimeEnv = Record<string, string | undefined>;
function getEnv(locals: App.Locals): RuntimeEnv {
  const runtime = (locals as App.Locals & { runtime?: { env?: RuntimeEnv } }).runtime;
  return runtime?.env ?? import.meta.env;
}
export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const callback = new URL('/api/auth/callback', url.origin);
    callback.searchParams.set('code', code);
    const state = url.searchParams.get('state');
    if (state) callback.searchParams.set('state', state);
    return Response.redirect(callback, 302);
  }
  const env = getEnv(locals);
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = env.GITHUB_REDIRECT_URI || url.origin + '/api/auth/callback';
  if (!clientId) return new Response('GitHub OAuth is not configured.', { status: 500 });
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'repo');
  return Response.redirect(authorize, 302);
};
