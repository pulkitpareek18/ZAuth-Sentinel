# @zauth/sdk

Minimal, zero-dependency OIDC client SDK for integrating with Z_Auth. Supports Authorization Code Flow with PKCE (S256) and works in both browser and Node.js environments.

## Installation

```bash
npm install @zauth/sdk
```

## Quick Start

```typescript
import { ZAuthClient } from "@zauth/sdk";

const client = new ZAuthClient({
  issuer: "https://auth.example.com",
  clientId: "my-app",
  redirectUri: "https://myapp.com/callback",
  scopes: ["openid", "profile", "zauth.identity"],
});

// 1. Start login — redirect user to Z_Auth
const { url, state, codeVerifier } = await client.authorize();
sessionStorage.setItem("zauth_state", state);
sessionStorage.setItem("zauth_verifier", codeVerifier);
window.location.href = url;

// 2. Handle callback (on your redirect URI page)
const savedState = sessionStorage.getItem("zauth_state")!;
const savedVerifier = sessionStorage.getItem("zauth_verifier")!;

const callback = client.parseCallback(window.location.search);
if (callback.state !== savedState) {
  throw new Error("State mismatch — possible CSRF attack");
}

// 3. Exchange code for tokens
const tokens = await client.exchangeCode(callback.code, savedVerifier);

// 4. Fetch user info
const user = await client.getUserInfo(tokens.access_token);
console.log("Logged in as:", user.preferred_username);
```

## Configuration

| Option        | Type       | Required | Default                  | Description                          |
|---------------|------------|----------|--------------------------|--------------------------------------|
| `issuer`      | `string`   | Yes      | -                        | Z_Auth issuer URL                    |
| `clientId`    | `string`   | Yes      | -                        | OAuth2 client ID                     |
| `redirectUri` | `string`   | Yes      | -                        | Redirect URI registered with Z_Auth  |
| `scopes`      | `string[]` | No       | `["openid", "profile"]`  | Requested OIDC scopes                |

## Available Scopes

| Scope             | Description                                      |
|-------------------|--------------------------------------------------|
| `openid`          | Required for OIDC. Returns a `sub` claim.        |
| `profile`         | User profile info (name, preferred_username).     |
| `email`           | User email address.                              |
| `zauth.identity`  | Z_Auth identity claims (uid, did, amr, acr).     |

## API Reference

### `new ZAuthClient(config)`

Creates a new SDK instance. See Configuration above for options.

### `client.discover(): Promise<OIDCDiscovery>`

Fetches and caches the OIDC discovery document from `{issuer}/.well-known/openid-configuration`. Called automatically by other methods.

### `client.authorize(options?): Promise<AuthorizeResult>`

Generates an authorization URL with PKCE challenge. Returns:

- `url` — Full authorization URL to redirect the user to.
- `state` — Random state parameter for CSRF protection. Store this and compare it against the callback.
- `codeVerifier` — PKCE code verifier. Store securely; it is required for the token exchange.

Optional parameters:

| Option      | Type     | Description                        |
|-------------|----------|------------------------------------|
| `prompt`    | `string` | OIDC prompt parameter (e.g., `"login"`, `"consent"`) |
| `loginHint` | `string` | Pre-fill the login identifier      |
| `nonce`     | `string` | Nonce for ID token validation      |

### `client.parseCallback(searchParams): { code, state }`

Parses the authorization callback URL parameters. Accepts a query string (`"?code=...&state=..."`) or a `URLSearchParams` instance. Throws if the response contains an `error` parameter or is missing `code`/`state`.

### `client.exchangeCode(code, codeVerifier): Promise<TokenResponse>`

Exchanges an authorization code and PKCE verifier for tokens. Returns:

```typescript
{
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
}
```

### `client.getUserInfo(accessToken): Promise<UserInfo>`

Fetches the authenticated user's profile from the UserInfo endpoint. Returns:

```typescript
{
  sub: string;
  preferred_username?: string;
  name?: string;
  uid?: string;
  did?: string;
  acr?: string;
  amr?: string[];
}
```

### `client.revokeToken(token, tokenTypeHint?): Promise<void>`

Revokes an access or refresh token. Throws if the issuer does not expose a revocation endpoint.

## Security Notes

- **PKCE is enforced.** The SDK always uses S256 code challenges. Plain code challenges are not supported.
- **State validation is your responsibility.** Always compare the `state` returned in the callback against the value you stored before redirecting.
- **Store the code verifier securely.** Use `sessionStorage` in browsers. Never expose it in URLs or logs.
- **Zero dependencies.** The SDK uses only the Web Crypto API (`crypto.subtle`) and standard Fetch API. In Node.js 18+, these are available globally. For older Node.js versions, the SDK falls back to the built-in `node:crypto` module.

## License

Apache-2.0
