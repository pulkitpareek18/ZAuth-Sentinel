import { Router } from "express";
import { config } from "../config.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import {
  clearOauthCookies,
  clearSessionCookie,
  createSession,
  deleteSession,
  issueOauthCookies,
  issueSessionCookie,
  readOauthStateCookie,
  readPkceCookie,
  readSessionCookie
} from "../services/sessionService.js";
import { upsertSentinelUser } from "../services/userService.js";
import { acrRank } from "../utils/assurance.js";
import { sendApiError } from "../utils/http.js";
import { randomToken, sha256Base64Url } from "../utils/security.js";

type OAuthTokenResponse = {
  access_token?: string;
  error?: string;
};

type UserInfoResponse = {
  sub?: string;
  preferred_username?: string;
  name?: string;
  uid?: string;
  did?: string;
  acr?: string;
  amr?: string[];
};

function callbackTransitionPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Finishing secure sign-in | Sentinel</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root {
  color-scheme: light dark;
  --bg: #0f1115;
  --bg-accent: #1a2332;
  --card: #1a1c1f;
  --text: #e8eaed;
  --subtext: #94a3b8;
  --line: #2d3748;
  --brand: #6b8a3d;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f1f5f0;
    --bg-accent: #e8f0e0;
    --card: #ffffff;
    --text: #1f1f1f;
    --subtext: #444746;
    --line: #d2d7c8;
    --brand: #4b5320;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(circle at 12% -18%, var(--bg-accent) 0%, var(--bg) 45%, var(--bg) 100%);
  color: var(--text);
  font-family: "Inter", "Segoe UI", Arial, sans-serif;
}
.card {
  width: 100%;
  max-width: 500px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--card);
  padding: 32px 30px;
}
h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 600;
}
p {
  margin: 12px 0 0;
  color: var(--subtext);
  font-size: 16px;
}
.spinner {
  margin-top: 20px;
  width: 22px;
  height: 22px;
  border: 2px solid color-mix(in oklab, var(--line) 75%, var(--brand) 25%);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
small {
  display: block;
  margin-top: 18px;
  color: var(--subtext);
}
</style>
</head>
<body>
  <div class="card">
    <h1>Finishing secure sign-in...</h1>
    <p>Completing your Z Auth verification and preparing Sentinel.</p>
    <div class="spinner" aria-hidden="true"></div>
    <small id="status">Please wait.</small>
  </div>
  <script>
    const statusEl = document.getElementById('status');
    const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

    const run = async () => {
      try {
        const response = await fetch('/api/auth/callback/complete' + window.location.search, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          const error = encodeURIComponent(data.error || 'sign_in_failed');
          const message = encodeURIComponent(data.message || 'Unable to complete sign-in.');
          window.location.replace('/?auth_error=' + error + '&auth_message=' + message);
          return;
        }
        setStatus('Secure sign-in complete. Redirecting...');
        window.location.replace(data.redirect_to || '/');
      } catch (_error) {
        window.location.replace('/?auth_error=callback_network_error&auth_message=' + encodeURIComponent('Network issue while finishing sign-in.'));
      }
    };

    run();
  </script>
</body>
</html>`;
}

const loginRateLimiter = createRateLimiter({
  windowMs: config.loginRateWindowMs,
  max: config.loginRateMax,
  keyPrefix: "sentinel-login"
});

const callbackRateLimiter = createRateLimiter({
  windowMs: config.callbackRateWindowMs,
  max: config.callbackRateMax,
  keyPrefix: "sentinel-callback"
});

export const authRouter = Router();

authRouter.get("/login", loginRateLimiter, (_req, res) => {
  const state = randomToken(16);
  const verifier = randomToken(32);
  const challenge = sha256Base64Url(verifier);

  issueOauthCookies(res, state, verifier);

  const authorizeUrl = new URL(`${config.authIssuer}/oauth2/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.sentinelClientId);
  authorizeUrl.searchParams.set("redirect_uri", config.sentinelRedirectUri);
  authorizeUrl.searchParams.set("scope", "openid profile zauth.identity");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("prompt", "login");

  res.redirect(authorizeUrl.toString());
});

authRouter.get("/callback", callbackRateLimiter, (_req, res) => {
  res.type("html").send(callbackTransitionPage());
});

authRouter.get("/api/auth/callback/complete", callbackRateLimiter, async (req, res) => {
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");
  const providerError = req.query.error ? String(req.query.error) : null;

  if (providerError) {
    clearOauthCookies(res);
    sendApiError(res, 400, "authorization_failed", providerError);
    return;
  }

  const expectedState = readOauthStateCookie(req.cookies as Record<string, unknown>);
  const verifier = readPkceCookie(req.cookies as Record<string, unknown>);

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    clearOauthCookies(res);
    sendApiError(res, 400, "invalid_callback", "Missing or mismatched state/verifier.");
    return;
  }

  try {
    const tokenResponse = await fetch(`${config.authIssuerInternal}/oauth2/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.sentinelClientId,
        code,
        redirect_uri: config.sentinelRedirectUri,
        code_verifier: verifier
      })
    });

    const tokenJson = (await tokenResponse.json()) as OAuthTokenResponse;
    if (!tokenResponse.ok || !tokenJson.access_token) {
      throw new Error(tokenJson.error || "token_exchange_failed");
    }

    const userInfoResponse = await fetch(`${config.authIssuerInternal}/oauth2/userinfo`, {
      headers: { authorization: `Bearer ${tokenJson.access_token}` }
    });

    const userInfo = (await userInfoResponse.json()) as UserInfoResponse;
    if (!userInfo.sub) {
      throw new Error("userinfo_missing_sub");
    }

    const acr = userInfo.acr ?? "urn:zauth:aal1";
    if (acrRank(acr) < acrRank(config.sentinelRequiredAcr)) {
      clearOauthCookies(res);
      sendApiError(res, 403, "assurance_too_low", `Sign in requires ${config.sentinelRequiredAcr}.`, {
        required_acr: config.sentinelRequiredAcr,
        current_acr: acr
      });
      return;
    }

    const sentinelUser = await upsertSentinelUser(userInfo.sub, userInfo.preferred_username, userInfo.name);
    const sentinelSessionId = await createSession(sentinelUser, {
      acr,
      amr: Array.isArray(userInfo.amr) ? userInfo.amr : ["passkey"],
      uid: userInfo.uid,
      did: userInfo.did
    });

    issueSessionCookie(res, sentinelSessionId);
    clearOauthCookies(res);

    res.status(200).json({
      ok: true,
      redirect_to: `${config.sentinelAppOrigin}/?auth=success`
    });
  } catch (error) {
    clearOauthCookies(res);
    sendApiError(res, 400, "sign_in_failed", (error as Error).message);
  }
});

authRouter.post("/logout", async (req, res) => {
  const sid = readSessionCookie(req.cookies as Record<string, unknown>);
  await deleteSession(sid);
  clearSessionCookie(res);
  res.redirect("/");
});

authRouter.post("/api/logout", async (req, res) => {
  const sid = readSessionCookie(req.cookies as Record<string, unknown>);
  await deleteSession(sid);
  clearSessionCookie(res);
  res.status(200).json({ logged_out: true });
});
