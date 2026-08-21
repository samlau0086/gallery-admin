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
  const env = getEnv(locals);
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const redirectUri = url.origin + '/api/auth/callback';
  if (!code || !clientId || !clientSecret) return new Response('GitHub OAuth callback is missing configuration.', { status: 400 });
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method:'POST', headers:{accept:'application/json','content-type':'application/json'}, body:JSON.stringify({client_id:clientId,client_secret:clientSecret,code,redirect_uri:redirectUri}) });
  } catch {
    return new Response('服务器无法连接 GitHub，请检查 Cloudflare 环境变量和网络配置。', { status: 502 });
  }
  const token = await tokenResponse.json() as {access_token?:string;error?:string;error_description?:string};
  if (!token.access_token) return new Response(token.error_description || token.error || 'GitHub OAuth failed.', {status:502});
  const payload = JSON.stringify({token:token.access_token,provider:'github'}).replace(/</g,'\\u003c');
  const message = 'authorization:github:success:' + payload;
  const html = '<!doctype html><html><body><p>GitHub 登录成功，正在返回后台。</p><script>' +
    'const message=' + JSON.stringify(message) + ';' +
    'const target=window.opener||window.parent;' +
    'function finish(event){' +
      'if(event.data!=="authorizing:github"||!target)return;' +
      'window.removeEventListener("message",finish,false);' +
      'target.postMessage(message,event.origin);' +
      'setTimeout(()=>window.close(),100);' +
    '}' +
    'window.addEventListener("message",finish,false);' +
    'if(target&&target!==window)target.postMessage("authorizing:github","*");' +
    '</script></body></html>';
  return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
};
