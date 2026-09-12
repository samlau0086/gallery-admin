import type { APIRoute } from 'astro';

export const prerender = false;

const metadata = {
  issuer: 'https://gallery.maesvanti.online/',
  resource: 'https://gallery.maesvanti.online/',
  authorization_endpoint: 'https://gallery.maesvanti.online/api/auth',
  registration_endpoint: 'https://gallery.maesvanti.online/api/auth',
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code'],
  token_endpoint: 'https://gallery.maesvanti.online/api/auth/callback',
  revocation_endpoint: 'https://github.com/settings/applications',
  scopes_supported: ['repo'],
  agent_auth: {
    skill: 'https://gallery.maesvanti.online/auth.md',
    register_uri: 'https://gallery.maesvanti.online/api/auth',
    registration_methods_supported: ['oauth_authorization_code'],
    identity_types_supported: ['service_auth'],
    oauth_authorization_code: {
      register_uri: 'https://gallery.maesvanti.online/api/auth',
      authorization_endpoint: 'https://gallery.maesvanti.online/api/auth',
      credential_types_supported: ['oauth_access_token'],
    },
    service_auth: {
      register_uri: 'https://gallery.maesvanti.online/api/auth',
      identity_endpoint: 'https://gallery.maesvanti.online/api/auth',
      credential_types_supported: ['oauth_access_token'],
    },
    identity_endpoint: 'https://gallery.maesvanti.online/api/auth',
    claims_supported: ['sub', 'scope'],
  },
};

export const GET: APIRoute = () => new Response(JSON.stringify(metadata), {
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=3600',
  },
});





