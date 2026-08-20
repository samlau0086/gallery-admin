export const onRequest = async ({ request, env }: { request: Request; env: Record<string,string> }) => {
  const code = new URL(request.url).searchParams.get('code');
  if (!code) return new Response('Missing OAuth code', { status: 400 });
  const response = await fetch('https://github.com/login/oauth/access_token', { method:'POST', headers:{accept:'application/json','content-type':'application/json'}, body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:env.GITHUB_REDIRECT_URI}) });
  const token = await response.json() as {access_token?:string;error?:string};
  if (!token.access_token) return new Response(token.error||'OAuth failed', {status:502});
  const payload = JSON.stringify({token:token.access_token,provider:'github'}).replace(/</g,'\\u003c');
  const html = '<script>window.opener&&window.opener.postMessage(\'authorization:github:success:'+payload+'\',window.location.origin);window.close();</script>';
  return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
};
