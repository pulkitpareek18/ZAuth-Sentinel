/**
 * @zauth/sdk — Z_Auth OIDC Client SDK
 *
 * Minimal, zero-dependency OIDC client for integrating with Z_Auth.
 * Supports Authorization Code Flow with PKCE (S256).
 *
 * @example
 * ```typescript
 * import { ZAuthClient } from "@zauth/sdk";
 *
 * const client = new ZAuthClient({
 *   issuer: "https://auth.example.com",
 *   clientId: "my-app",
 *   redirectUri: "https://myapp.com/callback",
 *   scopes: ["openid", "profile", "zauth.identity"],
 * });
 *
 * // Redirect user to login
 * const { url, state, codeVerifier } = await client.authorize();
 * sessionStorage.setItem("zauth_state", state);
 * sessionStorage.setItem("zauth_verifier", codeVerifier);
 * window.location.href = url;
 *
 * // Handle callback
 * const { code, state } = client.parseCallback(window.location.search);
 * const tokens = await client.exchangeCode(code, codeVerifier);
 * const userinfo = await client.getUserInfo(tokens.access_token);
 * ```
 */

export interface ZAuthClientConfig {
  /** Z_Auth issuer URL (e.g., "https://auth.example.com") */
  issuer: string;
  /** OAuth2 client ID */
  clientId: string;
  /** Redirect URI registered with Z_Auth */
  redirectUri: string;
  /** Requested scopes (default: ["openid", "profile"]) */
  scopes?: string[];
}

export interface AuthorizeResult {
  /** Full authorization URL to redirect the user to */
  url: string;
  /** Random state parameter for CSRF protection */
  state: string;
  /** PKCE code verifier (store securely, needed for token exchange) */
  codeVerifier: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
}

export interface UserInfo {
  sub: string;
  preferred_username?: string;
  name?: string;
  uid?: string;
  did?: string;
  acr?: string;
  amr?: string[];
  [key: string]: unknown;
}

export interface OIDCDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  revocation_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
}

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  if (typeof globalThis.crypto !== "undefined") {
    globalThis.crypto.getRandomValues(array);
  } else {
    const nodeCrypto = await import("node:crypto");
    nodeCrypto.getRandomValues(array);
  }
  return base64urlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  let digest: ArrayBuffer;
  if (typeof globalThis.crypto?.subtle !== "undefined") {
    digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  } else {
    const nodeCrypto = await import("node:crypto");
    digest = nodeCrypto.createHash("sha256").update(data).digest().buffer as ArrayBuffer;
  }
  return base64urlEncode(new Uint8Array(digest));
}

function base64urlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateState(): string {
  const array = new Uint8Array(16);
  if (typeof globalThis.crypto !== "undefined") {
    globalThis.crypto.getRandomValues(array);
  }
  return base64urlEncode(array);
}

export class ZAuthClient {
  private config: Required<ZAuthClientConfig>;
  private discoveryCache: OIDCDiscovery | null = null;

  constructor(config: ZAuthClientConfig) {
    this.config = {
      ...config,
      scopes: config.scopes ?? ["openid", "profile"],
    };
  }

  /** Fetch OIDC discovery document */
  async discover(): Promise<OIDCDiscovery> {
    if (this.discoveryCache) return this.discoveryCache;
    const url = `${this.config.issuer}/.well-known/openid-configuration`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OIDC discovery failed: ${resp.status}`);
    this.discoveryCache = await resp.json() as OIDCDiscovery;
    return this.discoveryCache;
  }

  /** Generate authorization URL with PKCE */
  async authorize(options?: { prompt?: string; loginHint?: string; nonce?: string }): Promise<AuthorizeResult> {
    const discovery = await this.discover();
    const codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    if (options?.prompt) params.set("prompt", options.prompt);
    if (options?.loginHint) params.set("login_hint", options.loginHint);
    if (options?.nonce) params.set("nonce", options.nonce);

    return {
      url: `${discovery.authorization_endpoint}?${params.toString()}`,
      state,
      codeVerifier,
    };
  }

  /** Parse callback URL parameters */
  parseCallback(searchParams: string | URLSearchParams): { code: string; state: string } {
    const params = typeof searchParams === "string"
      ? new URLSearchParams(searchParams)
      : searchParams;
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      const desc = params.get("error_description") ?? error;
      throw new Error(`Authorization error: ${desc}`);
    }
    if (!code || !state) {
      throw new Error("Missing code or state in callback");
    }
    return { code, state };
  }

  /** Exchange authorization code for tokens */
  async exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
    const discovery = await this.discover();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: codeVerifier,
    });

    const resp = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${(err as Record<string,string>).error ?? resp.status}`);
    }

    return await resp.json() as TokenResponse;
  }

  /** Fetch user info using access token */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const discovery = await this.discover();
    const resp = await fetch(discovery.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) throw new Error(`UserInfo request failed: ${resp.status}`);
    return await resp.json() as UserInfo;
  }

  /** Revoke a token */
  async revokeToken(token: string, tokenTypeHint?: "access_token" | "refresh_token"): Promise<void> {
    const discovery = await this.discover();
    if (!discovery.revocation_endpoint) {
      throw new Error("Revocation endpoint not available");
    }

    const body = new URLSearchParams({
      token,
      client_id: this.config.clientId,
    });
    if (tokenTypeHint) body.set("token_type_hint", tokenTypeHint);

    const resp = await fetch(discovery.revocation_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!resp.ok) throw new Error(`Token revocation failed: ${resp.status}`);
  }
}
