import type { APIRoute } from 'astro';

export const prerender = false;

type RuntimeEnv = Record<string, string | undefined>;

function getEnv(locals: App.Locals): RuntimeEnv {
  const runtime = (locals as App.Locals & { runtime?: { env?: RuntimeEnv } }).runtime;
  return runtime?.env ?? import.meta.env;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const env = getEnv(locals);
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const redirectUri = env.GITHUB_REDIRECT_URI || url.origin + '/api/auth';
  const code = url.searchParams.get('code');

  if (!code) {
    if (!clientId) return new Response('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, then restart the dev server.', { status: 500 });
    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', clientId);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('scope', 'repo');
    return Response.redirect(authorize, 302);
  }

  if (!clientId || !clientSecret) return new Response('GitHub OAuth is not configured on this deployment.', { status: 500 });
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
    });
  } catch {
    return new Response('本地服务器无法连接 GitHub。请检查网络、防火墙或代理设置；也可以部署到 Cloudflare Pages 后再测试登录。', { status: 502 });
  }
  const token = await tokenResponse.json() as { access_token?: string; error?: string; error_description?: string };
  if (!token.access_token) return new Response(token.error_description || token.error || 'GitHub OAuth failed.', { status: 502 });

  const payload = JSON.stringify({ token: token.access_token, provider: 'github' }).replace(/</g, '\\u003c');
  const message = 'authorization:github:success:' + payload;
  const html = '<!doctype html><html><body><p>登录成功，请返回管理后台。</p><script>' +
    'const message = ' + JSON.stringify(message) + ';' +
    'if (window.opener) window.opener.postMessage(message, "*");' +
    'if (window.parent && window.parent !== window) window.parent.postMessage(message, "*");' +
    'setTimeout(() => window.close(), 100);' +
    '</script></body></html>';
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
};
