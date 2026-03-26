<p align="center">
  <img src="apps/zauth-core/assets/zauth-logo.svg" alt="ZeroAuth" width="80" height="80" />
</p>

<h1 align="center">ZeroAuth Sentinel</h1>

<p align="center">
  <strong>Zero-knowledge identity verification and access control for India's Armed Forces</strong>
</p>

<p align="center">
  <a href="https://sentinel.zeroauth.tech"><img src="https://img.shields.io/badge/Live-sentinel.zeroauth.tech-4b5320?style=for-the-badge" alt="Live Demo" /></a>
</p>

<p align="center">
  <a href="https://sepolia.basescan.org/address/0x13DAF65e16000B95BAf7d0Dd945E4Ec6642fADed"><img src="https://img.shields.io/badge/Base%20Sepolia-Verified-blue.svg" alt="Contract Verified" /></a>
  <a href="https://auth.zeroauth.tech/.well-known/openid-configuration"><img src="https://img.shields.io/badge/OIDC-Compliant-green.svg" alt="OIDC" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
</p>

<p align="center">
  <em>Indian Patent Granted &bull; Application No. 202311041001 &bull; US Patent Filed</em><br/>
  <em>Yushu Excellence Technologies Private Limited</em>
</p>

---

## The Problem

India's Armed Forces face critical identity and access control challenges that conventional systems cannot address:

- **Impersonation & Identity Fraud** &mdash; Forged IDs and fake credentials at remote border posts and checkpoints
- **Centralized Biometric Vulnerabilities** &mdash; Server-side biometric databases are high-value targets for adversaries
- **Remote Area Verification** &mdash; Forward posts with intermittent connectivity lack real-time identity verification
- **Armoury Accountability Gaps** &mdash; Weapon checkout/return lacks cryptographically verified audit trails
- **Insider Threat Exposure** &mdash; Password and card-based authentication is trivially compromised

## The Solution

**ZeroAuth Sentinel** eliminates these vulnerabilities through zero-knowledge cryptographic proofs. A soldier's face biometrics are processed entirely on-device &mdash; the server never sees the raw data. Identity is proven through mathematical verification, not trust.

```
Soldier's Device                      ZeroAuth Server                   Base L2 (Sepolia)
┌──────────────────┐                 ┌──────────────────┐            ┌───────────────────┐
│ 1. Face capture   │                │                  │            │ ZAuthIdentity.sol  │
│ 2. On-device      │  SHA-256 hash  │ Verify biometric │  Enroll   │ + Groth16Verifier  │
│    face matching  ├───────────────>│ commitment       ├──────────>│                   │
│ 3. Groth16 proof  │  ZK proof +   │ groth16.verify() │  Verify   │ On-chain ZK proof  │
│    generation     │  public signals│ Poseidon check   ├──────────>│ verification +     │
│ 4. Passkey sign   ├───────────────>│                  │            │ identity storage   │
│                   │                │ Issue OIDC tokens│            │                   │
│                   │<───────────────┤                  │            │                   │
└──────────────────┘  access_token   └──────────────────┘            └───────────────────┘
                      id_token
```

**Privacy invariant**: Raw biometric descriptors never leave the soldier's device. The server receives only:

| Data Transmitted | Purpose | Reversible? |
|-----------------|---------|-------------|
| `biometric_hash` | SHA-256 of quantized face embedding | No |
| `zk_proof` | Groth16 proof binding biometric to challenge | No |
| `public_signals` | Poseidon commitment + challenge binding | No |
| `passkey_assertion` | WebAuthn signature from secure enclave | No |

## Sentinel Demo Application

Sentinel is the operational demo showcasing ZeroAuth's capabilities in a military context. It provides five integrated modules:

### Personnel Roster
Real-time registry of military personnel with ZK verification status, rank, unit, clearance level (TOP SECRET / SECRET / CONFIDENTIAL / UNCLASSIFIED), and deployment status. Seeded with 15 personnel across Indian Army formations including 3 Rajputana Rifles, 4 Sikh Light Infantry, 11 Gorkha Rifles, and Corps of Signals.

### Checkpoint Verification Log
Cryptographically verified identity checks at installation gates and forward posts. Each verification records the personnel, checkpoint location, verification method (ZK biometric / passkey), and result (PASS / FAIL / FLAGGED) with operator attribution.

### Armoury Access Control
Biometric-verified weapon checkout and return system. Every transaction is tied to a verified identity with blockchain-anchored audit trail. Tracks weapon type, serial number, action, authorization, and reason.

### Secure Dispatches
Classified message system with military classification levels (TOP SECRET, SECRET, CONFIDENTIAL, UNCLASSIFIED) and priority markings (FLASH, IMMEDIATE, PRIORITY, ROUTINE). Access gated by ZK assurance level.

### Operations Dashboard
Real-time overview showing total personnel, ZK verification rate, checkpoint activity, outstanding weapon checkouts, and a chronological activity feed across all modules.

## Live Deployment

| Service | URL |
|---------|-----|
| **Sentinel Demo** | [sentinel.zeroauth.tech](https://sentinel.zeroauth.tech) |
| **Auth Server** | [auth.zeroauth.tech](https://auth.zeroauth.tech) |
| **Admin Console** | [console.zeroauth.tech](https://console.zeroauth.tech) |
| **OIDC Discovery** | [auth.zeroauth.tech/.well-known/openid-configuration](https://auth.zeroauth.tech/.well-known/openid-configuration) |

**On-Chain Identity Contract**: [`0x13DAF65e16000B95BAf7d0Dd945E4Ec6642fADed`](https://sepolia.basescan.org/address/0x13DAF65e16000B95BAf7d0Dd945E4Ec6642fADed) (Base Sepolia, verified)

## Architecture

```
apps/
├── zauth-core/              # OAuth/OIDC server + Pramaan V2 identity engine
│   ├── src/routes/          # OIDC, Pramaan, WebAuthn, admin, liveness endpoints
│   ├── src/services/        # ZK verification, passkey, sessions, audit, identity chain
│   ├── zk/                  # Groth16 circuit artifacts (Circom 2.1.9)
│   │   ├── biometric_commitment.circom    # Poseidon(preimage) + challenge binding
│   │   ├── biometric_commitment.wasm      # Client-side witness generator
│   │   ├── circuit_final.zkey             # Proving key (client-side)
│   │   └── verification_key.json          # Verification key (server-side)
│   └── contracts/           # Solidity smart contracts (Base Sepolia)
│       ├── ZAuthIdentity.sol              # Identity registry + Groth16 verification
│       └── Groth16Verifier.sol            # Auto-generated BN128 verifier
├── zauth-sentinel/          # Military demo — Secure Personnel Verification
│   ├── src/                 # Express backend (OAuth callback, PostgreSQL)
│   │   ├── routes/          # Dashboard, personnel, checkpoints, armoury, dispatches
│   │   ├── services/        # Business logic + seed data (15 Indian Army personnel)
│   │   └── db/              # Schema + seed (sentinel_* tables)
│   └── web/                 # React 18 + Vite frontend
│       └── src/pages/       # Landing, Dashboard, Personnel, Checkpoints, Armoury, Dispatches
├── zauth-ui/                # Admin console + status dashboard
└── zauth-notes/             # Reference notes app (OAuth client demo)

packages/
└── sdk/                     # @zauth/sdk — OIDC client library for relying parties

docker/
├── compose.base.yml         # Service definitions (Postgres 16, Redis 7, all apps)
├── compose.prod.yml         # Caddy TLS, health checks, read-only FS, resource limits
├── caddy/Caddyfile          # Reverse proxy with automatic Let's Encrypt TLS
└── compose.dev.yml          # Hot reload, local ports
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Authentication** | WebAuthn / FIDO2 passkeys (`@simplewebauthn/server`) |
| **Biometrics** | face-api.js (client-side only), SHA-256 commitments |
| **Zero-Knowledge** | Circom 2.1.9, Groth16 via snarkjs 0.7.4, Poseidon hash |
| **Identity Protocol** | OAuth 2.0 / OpenID Connect with PKCE S256 |
| **Blockchain** | Base Sepolia (L2), Solidity 0.8.24, ethers.js v6 |
| **On-Chain Verification** | `Groth16Verifier.sol` &mdash; ZK proof verification on Base |
| **Backend** | Node.js 20, Express, TypeScript, Zod validation |
| **Frontend** | React 18, Vite, TypeScript, CSS design tokens |
| **Database** | PostgreSQL 16 (append-only audit model) |
| **Cache** | Redis 7 (sessions, challenges, handoff state) |
| **Reverse Proxy** | Caddy 2 (automatic TLS via Let's Encrypt) |
| **Deployment** | Docker Compose, single-VPS production stack |

## Authentication Flow

### Pramaan V2 &mdash; ZK Biometric Authentication

```
Desktop                    Phone                      Server
  │                          │                          │
  ├─ POST /auth/handoff/start ─────────────────────────>│
  │<── QR code + handoff_id ────────────────────────────┤
  │        │                                            │
  │   Scan QR                                           │
  │        ├─ Face liveness challenge ─────────────────>│
  │        │<── [blink, turn_left, turn_right] ─────────┤
  │        ├─ Liveness frames ─────────────────────────>│
  │        ├─ Passkey assertion ───────────────────────>│
  │        ├─ Groth16 proof + public signals ──────────>│
  │        ├─ POST /auth/handoff/approve ──────────────>│
  │        │                                            │
  │ ← Poll (approved) → session + consent redirect ────┤
```

**Cross-device support**: When authenticating from a new device, the server securely provides the enrollment hash during the challenge phase so the ZK proof can be generated with the correct Poseidon preimage.

## On-Chain Identity (Base Sepolia)

Every enrollment and verification is submitted to the Base Sepolia L2 chain. The `ZAuthIdentity.sol` contract inherits a Groth16 verifier generated from the ZK circuit, enabling full on-chain proof verification.

| Function | Description |
|----------|-------------|
| `enrollIdentity()` | Verify ZK proof on-chain, store identity commitment |
| `verifyAndLog()` | Verify proof, emit `ProofVerified` event for audit trail |
| `getIdentity()` | Free view call to retrieve on-chain identity record |

**Contract**: [`0x13DAF65e16000B95BAf7d0Dd945E4Ec6642fADed`](https://sepolia.basescan.org/address/0x13DAF65e16000B95BAf7d0Dd945E4Ec6642fADed) (Verified on Sourcify + Blockscout)

## API Reference

### OIDC Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/.well-known/openid-configuration` | Discovery document |
| `GET` | `/.well-known/jwks.json` | JSON Web Key Set |
| `GET/POST` | `/oauth2/authorize` | Authorization endpoint (PKCE S256) |
| `POST` | `/oauth2/token` | Token exchange |
| `POST` | `/oauth2/revoke` | Token revocation |
| `GET` | `/oauth2/userinfo` | User claims (`sub`, `acr`, `amr`, `uid`, `did`) |

### Pramaan V2 Identity

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/pramaan/v2/enrollment/start` | Begin identity enrollment |
| `POST` | `/pramaan/v2/enrollment/complete` | Finalize with ZK proof + on-chain submission |
| `POST` | `/pramaan/v2/proof/challenge` | Request authentication challenge |
| `POST` | `/pramaan/v2/proof/submit` | Submit Groth16 proof for verification |
| `GET` | `/pramaan/v2/identity/me` | Current identity context |

### Sentinel API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard` | Aggregated stats + recent activity |
| `GET` | `/api/personnel` | Personnel roster (search, filter by unit/status) |
| `GET/POST` | `/api/checkpoints` | Checkpoint verification log + record new |
| `GET/POST` | `/api/armoury` | Armoury access log + checkout/return |
| `GET/POST/PATCH/DELETE` | `/api/dispatches` | Secure dispatches CRUD |

## SDK

```typescript
import { ZAuthClient } from "@zauth/sdk";

const client = new ZAuthClient({
  issuer: "https://auth.zeroauth.tech",
  clientId: "my-app",
  redirectUri: "https://myapp.com/callback",
  scopes: ["openid", "profile", "zauth.identity"],
});

const { url, state, codeVerifier } = await client.authorize();
window.location.href = url;

// Handle callback
const { code } = client.parseCallback(window.location.search);
const tokens = await client.exchangeCode(code, codeVerifier);
const user = await client.getUserInfo(tokens.access_token);
// → user.sub, user.uid, user.did, user.acr, user.amr
```

## Security Model

| Property | Implementation |
|----------|---------------|
| **No biometric templates server-side** | Face matching is client-side only; server stores SHA-256 hashes |
| **Zero-knowledge identity proofs** | Groth16 circuit with Poseidon commitment binding |
| **No passwords** | WebAuthn discoverable credentials (passkeys) |
| **Cross-device ZK support** | Enrollment hash provided in challenge for new-device auth |
| **On-chain ZK verification** | Groth16 proofs verified on Base Sepolia via `ZAuthIdentity.sol` |
| **Tamper-evident audit trail** | SHA-256 hash-chained events, on-chain `ProofVerified` events |
| **Nullifier-based consumption** | Recovery codes and proof requests use insert-only nullifiers |
| **PKCE S256 enforced** | All OAuth flows require proof key for code exchange |
| **Container hardening** | Read-only filesystem, memory limits, Trivy scanning |

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for the full threat model.

## Quick Start

```bash
# Clone and configure
git clone https://github.com/pulkitpareek18/ZAuth-Sentinel.git
cd ZAuth-Sentinel
cp env/.env.dev.example env/.env.dev

# Start the development stack
npm run up-dev

# Services:
#   Auth server     → http://localhost:3000
#   Sentinel app    → http://localhost:5174
#   Admin console   → http://localhost:3001
```

## Deployment

### Production (Single VPS)

```bash
# 1. Point DNS A records → VPS IP
#    auth.yourdomain.com, sentinel.yourdomain.com, console.yourdomain.com

# 2. Configure env/.env.prod with your domain and secrets

# 3. Deploy
docker compose -p zauth_prod \
  -f docker/compose.base.yml \
  -f docker/compose.prod.yml \
  --env-file env/.env.prod \
  up -d --build
```

Caddy automatically provisions TLS certificates via Let's Encrypt.

## Alignment with Indian Army Modernization

ZeroAuth Sentinel directly aligns with the Indian Army's **2026 Year of Networking & Data Centricity** initiative:

- **Standards-based OIDC integration** with existing military IT infrastructure
- **Decentralized identity** &mdash; no single point of failure for biometric databases
- **Blockchain-anchored audit** &mdash; immutable, tamper-proof accountability for every verification
- **Works at remote border posts** &mdash; ZK proof generation runs entirely on-device
- **National Blockchain Framework compatible** &mdash; aligns with India's digital infrastructure strategy

## Patent

| | |
|---|---|
| **Indian Patent** | Granted &mdash; Application No. 202311041001 |
| **US Patent** | Filed |
| **Title** | *A system for performing person identification using biometric data and zero-knowledge proof in a decentralized network* |
| **Applicant** | Yushu Excellence Technologies Private Limited |

## License

[Apache License 2.0](LICENSE)

---

<p align="center">
  <strong>ZeroAuth Sentinel</strong> &mdash; Identity verification that's mathematically provable, not just trusted.<br/>
  <em>Powered by <a href="https://auth.zeroauth.tech">ZeroAuth / Pramaan</a></em>
</p>
