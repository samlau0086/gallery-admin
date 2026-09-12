import type { APIRoute } from 'astro';

export const prerender = false;

const githubOAuthMetadataUrl = 'https://github.com/.well-known/oauth-authorization-server/login/oauth';
const githubJwksUrl = 'https://github.com/login/oauth/.well-known/jwks';

const fallbackMetadata = {
  issuer: 'https://github.com/login/oauth',
  authorization_endpoint: 'https://github.com/login/oauth/authorize',
  token_endpoint: 'https://github.com/login/oauth/access_token',
  jwks_uri: githubJwksUrl,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token', 'urn:ietf:params:oauth:grant-type:device_code'],
  code_challenge_methods_supported: ['S256'],
  scopes_supported: ['offline_access'],
};

export const GET: APIRoute = async () => {
  let metadata = fallbackMetadata;

  try {
    const response = await fetch(githubOAuthMetadataUrl, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const upstream = await response.json() as Record<string, unknown>;
      metadata = { ...fallbackMetadata, ...upstream, jwks_uri: upstream.jwks_uri || githubJwksUrl } as typeof fallbackMetadata;
    }
  } catch {
    // The fallback keeps discovery available during an upstream outage.
  }

  return new Response(JSON.stringify(metadata), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=3600',
    },
  });
};
