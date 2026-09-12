# auth.md

## Service

Maesvanti Gallery is a public product catalog with an authenticated administration area. Agents that need to access the administration area must register through the OAuth authorization flow below and obtain the user's consent.

## Discovery

- Protected resource metadata: `https://gallery.maesvanti.online/.well-known/oauth-protected-resource`
- Authorization server metadata: `https://gallery.maesvanti.online/.well-known/oauth-authorization-server`

## Registration

Start registration at `https://gallery.maesvanti.online/api/auth` with a browser-capable user. This endpoint starts the GitHub OAuth authorization-code flow. The user must sign in to GitHub and approve access before the agent can continue.

The supported registration method is `oauth_authorization_code`. The authorization request uses the `repo` scope because the administration area uses GitHub repository access to manage catalog content.

After authorization, the callback at `https://gallery.maesvanti.online/api/auth/callback` returns the OAuth credential to the requesting administration client. Treat the credential as a bearer secret, store it securely, send it only over HTTPS, and never expose it in catalog pages, logs, or prompts.

## Identity and credentials

- Supported identity type: `service_auth`
- Supported credential type: `oauth_access_token`
- User consent is required through GitHub OAuth.
- Anonymous registration and ID-JAG identity assertions are not supported.

Use the credential only for the administration workflow and only within the scopes granted by the user. If access is no longer needed, the user should revoke the GitHub OAuth authorization from [GitHub application settings](https://github.com/settings/applications). The authorization server does not expose a separate claims endpoint or token revocation API; GitHub account settings are the revocation control for this integration.

## Public catalog access

The catalog and product pages do not require registration. Agents may read the public site and its published discovery documents without credentials. The registration flow is only for authenticated administration access.

