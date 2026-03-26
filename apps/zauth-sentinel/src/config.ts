import dotenv from "dotenv";

dotenv.config();

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

type SentinelConfig = {
  sentinelPort: number;
  sentinelHost: string;
  authIssuer: string;
  authIssuerInternal: string;
  sentinelClientId: string;
  sentinelBaseUrl: string;
  sentinelRedirectUri: string;
  sentinelAppOrigin: string;
  sentinelRequiredAcr: string;
  sessionCookieSecure: boolean;
  sessionTtlSeconds: number;
  csrfSecret: string;
  loginRateWindowMs: number;
  loginRateMax: number;
  callbackRateWindowMs: number;
  callbackRateMax: number;
  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    max: number;
  };
};

export const config: SentinelConfig = {
  sentinelPort: Number(process.env.SENTINEL_PORT ?? 3003),
  sentinelHost: process.env.SENTINEL_HOST ?? "0.0.0.0",
  authIssuer: stripTrailingSlash(process.env.AUTH_ISSUER ?? "http://localhost:3000"),
  authIssuerInternal: stripTrailingSlash(process.env.AUTH_ISSUER_INTERNAL ?? process.env.AUTH_ISSUER ?? "http://localhost:3000"),
  sentinelClientId: process.env.SENTINEL_CLIENT_ID ?? "sentinel-web-client",
  sentinelBaseUrl: stripTrailingSlash(process.env.SENTINEL_BASE_URL ?? "http://localhost:3003"),
  sentinelRedirectUri: process.env.SENTINEL_REDIRECT_URI ?? "http://localhost:3003/callback",
  sentinelAppOrigin: stripTrailingSlash(process.env.SENTINEL_APP_ORIGIN ?? process.env.SENTINEL_BASE_URL ?? "http://localhost:3003"),
  sentinelRequiredAcr: process.env.SENTINEL_REQUIRED_ACR ?? "urn:zauth:aal1",
  sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === "true",
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 12),
  csrfSecret: process.env.SENTINEL_CSRF_SECRET ?? process.env.TENANT_SALT ?? "sentinel-dev-csrf-secret",
  loginRateWindowMs: Number(process.env.SENTINEL_LOGIN_RATE_WINDOW_MS ?? 60_000),
  loginRateMax: Number(process.env.SENTINEL_LOGIN_RATE_MAX ?? 20),
  callbackRateWindowMs: Number(process.env.SENTINEL_CALLBACK_RATE_WINDOW_MS ?? 60_000),
  callbackRateMax: Number(process.env.SENTINEL_CALLBACK_RATE_MAX ?? 40),
  postgres: {
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? "zauth",
    password: process.env.POSTGRES_PASSWORD ?? "zauth",
    database: process.env.POSTGRES_DB ?? "zauth",
    max: Number(process.env.SENTINEL_DB_POOL_MAX ?? 10)
  }
};
