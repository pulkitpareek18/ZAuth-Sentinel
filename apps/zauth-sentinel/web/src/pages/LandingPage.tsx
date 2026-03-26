import { useEffect, useRef } from "react";

type LandingPageProps = {
  loginUrl: string;
  authError?: string;
  authMessage?: string;
};

function SentinelLogo({ compact }: { compact?: boolean }) {
  return (
    <div className={`sentinel-logo${compact ? " compact" : ""}`} aria-label="Sentinel">
      <span className="sentinel-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sentinelLogoGrad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#6b8a3d" />
              <stop offset="1" stopColor="#4b5320" />
            </linearGradient>
          </defs>
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="url(#sentinelLogoGrad)" />
          <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="sentinel-logo-text">Sentinel</span>
    </div>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconFace() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
    </svg>
  );
}

function IconZK() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconBlockchain() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="9" height="9" rx="1.5" />
      <rect x="14" y="1" width="9" height="9" rx="1.5" />
      <rect x="1" y="14" width="9" height="9" rx="1.5" />
      <rect x="14" y="14" width="9" height="9" rx="1.5" />
      <path d="M10 5.5h4" /><path d="M5.5 10v4" /><path d="M18.5 10v4" /><path d="M10 18.5h4" />
    </svg>
  );
}

function IconPatent() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" /><path d="M7 2v4" /><path d="M17 2v4" /><path d="M9 15l2 2 4-4" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconUserShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 14l-2 3h4l-2-3z" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function IconWifi() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2" />
    </svg>
  );
}

export function LandingPage({ loginUrl, authError, authMessage }: LandingPageProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        }
      },
      { threshold: 0.08 }
    );
    const targets = document.querySelectorAll(".fade-in-section");
    targets.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <main className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-left">
            <SentinelLogo />
            <span className="nav-powered-badge">Powered by Z Auth / Pramaan</span>
          </div>
          <div className="landing-nav-links">
            <a href="#pain-points">Why Sentinel</a>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
          </div>
          <a className="btn btn-primary landing-nav-cta" href={loginUrl}>
            Secure Login
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero-section">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="hero-badge-row">
              <span className="hero-badge">
                <IconPatent />
                Indian Patent Granted
              </span>
              <span className="hero-badge hero-badge-secondary">
                <IconShield />
                Zero-Knowledge Auth
              </span>
            </div>
            <h1>
              <span className="gradient-text">Zero-knowledge</span> identity verification for India's Armed Forces
            </h1>
            <p className="lead">
              Eliminate impersonation. Verify personnel at any checkpoint &mdash; even at remote border posts.
              No biometric data ever leaves the device. Cryptographic proof, not&nbsp;trust.
            </p>
            <div className="hero-cta-row">
              <a className="btn btn-primary landing-hero-cta" href={loginUrl}>
                Access Sentinel
                <IconArrowRight />
              </a>
              <a className="btn btn-secondary landing-hero-cta-alt" href="#pain-points">
                See Why Sentinel
              </a>
            </div>
            <p className="hero-trust-line">
              No passwords &middot; No biometric data on servers &middot; Blockchain-anchored audit trail
            </p>
            {authError ? (
              <div className="alert-card" role="alert">
                <strong>Sign-in could not be completed.</strong>
                <p>{authMessage || authError}</p>
              </div>
            ) : null}
          </div>

          <aside className="landing-hero-visual" aria-label="App preview">
            <div className="hero-visual-wrapper">
              <div className="preview-window">
                <div className="preview-window-head">
                  <span className="preview-dot" /><span className="preview-dot" /><span className="preview-dot" />
                  <p>Sentinel Dashboard</p>
                </div>
                <div className="preview-body">
                  <div className="preview-stats">
                    <div className="preview-stat">
                      <div className="preview-stat-value">247</div>
                      <div className="preview-stat-label">Personnel Verified</div>
                    </div>
                    <div className="preview-stat">
                      <div className="preview-stat-value">98.4%</div>
                      <div className="preview-stat-label">ZK Verification Rate</div>
                    </div>
                    <div className="preview-stat">
                      <div className="preview-stat-value">52</div>
                      <div className="preview-stat-label">Checkpoints Today</div>
                    </div>
                    <div className="preview-stat">
                      <div className="preview-stat-value">18</div>
                      <div className="preview-stat-label">Weapons Checked Out</div>
                    </div>
                  </div>
                  <div className="preview-log">
                    <div className="preview-log-item">
                      <span className="preview-log-pass">PASS</span>
                      <span>Col. Rathore verified at Gate Alpha</span>
                    </div>
                    <div className="preview-log-item">
                      <span className="preview-log-flag">FLAG</span>
                      <span>Hav. Gogoi flagged at Camp Delta</span>
                    </div>
                    <div className="preview-log-item">
                      <span className="preview-log-pass">PASS</span>
                      <span>Maj. Chauhan verified at Forward Post</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero-shield-badge" aria-hidden="true">
                <IconShield />
                <span>ZK Protected</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Tech Strip */}
      <section className="landing-tech-section fade-in-section">
        <div className="landing-tech-inner">
          <p className="tech-strip-label">Built with military-grade security standards</p>
          <div className="tech-strip">
            <div className="tech-item"><IconKey /><span>WebAuthn / FIDO2</span></div>
            <div className="tech-item"><IconZK /><span>Groth16 ZK Proofs</span></div>
            <div className="tech-item"><IconBlockchain /><span>Base Blockchain</span></div>
            <div className="tech-item"><IconShield /><span>OpenID Connect</span></div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="landing-pain-section fade-in-section" id="pain-points">
        <div className="landing-pain-inner">
          <div className="section-header">
            <span className="section-label">Why Sentinel</span>
            <h2>Solving real challenges in force protection</h2>
            <p>Sentinel addresses the critical identity and access control gaps that conventional systems leave wide open.</p>
          </div>
          <div className="pain-grid">
            <article className="pain-card">
              <div className="pain-card-icon"><IconUserShield /></div>
              <h3>Impersonation Eliminated</h3>
              <p>ZK proofs cryptographically bind face biometrics to identity. Cannot be forged, shared, or stolen. Every verification is mathematically provable.</p>
            </article>
            <article className="pain-card">
              <div className="pain-card-icon"><IconMapPin /></div>
              <h3>Remote Border Posts</h3>
              <p>ZK proof generation runs entirely on-device. Works at forward posts with intermittent connectivity. No server round-trip needed for identity binding.</p>
            </article>
            <article className="pain-card">
              <div className="pain-card-icon"><IconTarget /></div>
              <h3>Armoury Biometric Lock</h3>
              <p>Every weapon checkout requires live biometric verification with a blockchain-anchored audit trail. Tamper-proof, irrefutable accountability.</p>
            </article>
            <article className="pain-card">
              <div className="pain-card-icon"><IconLock /></div>
              <h3>Insider Threat Defense</h3>
              <p>Beyond passwords and ID cards. Continuous identity assurance via ZK proofs at every sensitive action. Compromised credentials become useless.</p>
            </article>
            <article className="pain-card">
              <div className="pain-card-icon"><IconDatabase /></div>
              <h3>Tamper-Proof Audit</h3>
              <p>Every verification is logged with cryptographic proof and anchored to Base L2 blockchain. Cannot be altered, deleted, or disputed after the fact.</p>
            </article>
            <article className="pain-card">
              <div className="pain-card-icon"><IconWifi /></div>
              <h3>Year of Networking Ready</h3>
              <p>Aligns with Indian Army's 2026 digital modernization mandate. Standards-based OIDC integration with any existing military IT infrastructure.</p>
            </article>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-how-section fade-in-section" id="how-it-works">
        <div className="landing-how-inner">
          <div className="section-header">
            <span className="section-label">How It Works</span>
            <h2>Three steps. Zero exposure.</h2>
            <p>Verify any personnel in seconds. Biometric data never touches the server.</p>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-number">1</div>
              <div className="how-step-icon"><IconFace /></div>
              <h3>Biometric scan</h3>
              <p>The device camera captures and matches the soldier's face entirely on-device. The raw image is never transmitted to any server.</p>
            </div>
            <div className="how-connector" aria-hidden="true">
              <svg viewBox="0 0 60 8" preserveAspectRatio="none">
                <path d="M0 4 L60 4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="54,1 60,4 54,7" fill="currentColor" />
              </svg>
            </div>
            <div className="how-step">
              <div className="how-step-number">2</div>
              <div className="how-step-icon"><IconZK /></div>
              <h3>Generate ZK proof</h3>
              <p>A Groth16 zero-knowledge proof cryptographically binds identity to a server challenge &mdash; proving who you are without revealing any biometric data.</p>
            </div>
            <div className="how-connector" aria-hidden="true">
              <svg viewBox="0 0 60 8" preserveAspectRatio="none">
                <path d="M0 4 L60 4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="54,1 60,4 54,7" fill="currentColor" />
              </svg>
            </div>
            <div className="how-step">
              <div className="how-step-number">3</div>
              <div className="how-step-icon"><IconShield /></div>
              <h3>Access granted</h3>
              <p>The server verifies the proof on-chain and issues signed OIDC tokens. The checkpoint is cleared &mdash; identity stays private.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features-section fade-in-section" id="features">
        <div className="landing-features-inner">
          <div className="section-header">
            <span className="section-label">Capabilities</span>
            <h2>Complete force identity management</h2>
            <p>Everything a modern military installation needs for secure personnel verification and access control.</p>
          </div>
          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon"><IconUserShield /></div>
              <h3>Personnel Verification</h3>
              <p>Real-time ZK-verified roster with rank, unit, clearance level, and biometric verification status at a glance.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon"><IconMapPin /></div>
              <h3>Checkpoint Logging</h3>
              <p>Record and audit every identity verification at every checkpoint. PASS, FAIL, or FLAGGED &mdash; with full cryptographic provenance.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon"><IconTarget /></div>
              <h3>Armoury Access Control</h3>
              <p>Biometric-verified weapon checkout and return. Every transaction tied to a verified identity with blockchain-anchored audit trail.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon"><IconLock /></div>
              <h3>Secure Dispatches</h3>
              <p>Classified message distribution with TOP SECRET to UNCLASSIFIED classification levels. Access gated by ZK assurance level.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="landing-security-section fade-in-section" id="security">
        <div className="landing-security-inner">
          <div className="section-header">
            <span className="section-label">Security Architecture</span>
            <h2>Security that's not just a checkbox</h2>
            <p>Zero-knowledge biometric authentication verifies identity without exposing data.</p>
          </div>
          <div className="security-row">
            <div className="security-text">
              <h3>Zero-Knowledge Biometric Proofs</h3>
              <p>
                Face embeddings are processed entirely on-device. A Groth16 circuit generates a
                cryptographic proof binding identity to a server-issued challenge &mdash; the server
                verifies the proof without ever seeing the biometric&nbsp;data.
              </p>
              <ul className="security-checklist">
                <li>Poseidon hash commitment binding</li>
                <li>Client-side face matching via face-api.js</li>
                <li>SHA-256 irreversible biometric hash</li>
                <li>On-chain Groth16 proof verification</li>
              </ul>
            </div>
            <div className="security-visual">
              <div className="security-flow-card">
                <div className="flow-node"><IconFace /><span>Soldier's Device</span></div>
                <div className="flow-arrow">
                  <span className="flow-arrow-label">ZK proof only</span>
                  <svg viewBox="0 0 80 8" preserveAspectRatio="none"><path d="M0 4 L80 4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" /><polygon points="74,1 80,4 74,7" fill="currentColor" /></svg>
                </div>
                <div className="flow-node"><IconShield /><span>Sentinel Server</span></div>
              </div>
            </div>
          </div>
          <div className="security-row security-row-reverse">
            <div className="security-text">
              <h3>No Passwords, Ever</h3>
              <p>
                Sentinel uses WebAuthn FIDO2 discoverable credentials (passkeys) stored in the device's
                secure enclave. There are no passwords to steal, no phishing vectors, no server-side
                secrets to&nbsp;breach.
              </p>
              <ul className="security-checklist">
                <li>FIDO2 discoverable credentials</li>
                <li>Hardware-backed secure enclave</li>
                <li>Phishing-resistant by design</li>
              </ul>
            </div>
            <div className="security-visual">
              <div className="security-flow-card">
                <div className="flow-node"><IconKey /><span>Passkey Auth</span></div>
                <div className="flow-arrow">
                  <span className="flow-arrow-label">AAL2 Assurance</span>
                  <svg viewBox="0 0 80 8" preserveAspectRatio="none"><path d="M0 4 L80 4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" /><polygon points="74,1 80,4 74,7" fill="currentColor" /></svg>
                </div>
                <div className="flow-node"><IconBlockchain /><span>Base Blockchain</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patent */}
      <section className="landing-patent-section fade-in-section">
        <div className="landing-patent-inner">
          <div className="patent-card">
            <div className="patent-icon"><IconPatent /></div>
            <div className="patent-content">
              <h3>Patented Technology</h3>
              <p className="patent-detail"><strong>Indian Patent Granted</strong> &mdash; Application No. 202311041001</p>
              <p className="patent-detail"><strong>US Patent Filed</strong></p>
              <p className="patent-title">A system for performing person identification using biometric data and zero-knowledge proof in a decentralized network</p>
              <p className="patent-applicant">Yushu Excellence Technologies Private Limited</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="landing-bottom-cta-section fade-in-section">
        <div className="landing-bottom-cta-inner">
          <h2>Deploy Sentinel at your&nbsp;installation</h2>
          <p>Zero-knowledge identity verification. No biometric data stored on any server. Blockchain-anchored audit trail.</p>
          <a className="btn btn-primary landing-hero-cta" href={loginUrl}>
            Access Sentinel
            <IconArrowRight />
          </a>
          <p className="cta-fine-print">Standards-based OIDC &middot; Works on any device &middot; No vendor lock-in</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-col footer-col-brand">
            <SentinelLogo compact />
            <p>Zero-knowledge personnel verification and access control for India's Armed Forces. Powered by Z Auth / Pramaan.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#pain-points">Why Sentinel</a>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <a href="https://auth.zeroauth.tech" target="_blank" rel="noopener noreferrer">Z Auth</a>
            <a href="https://github.com/pulkitpareek18/Z_Auth" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://auth.zeroauth.tech/.well-known/openid-configuration" target="_blank" rel="noopener noreferrer">OIDC Discovery</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Sentinel &middot; Powered by <a href="https://auth.zeroauth.tech" target="_blank" rel="noopener noreferrer">Z Auth / Pramaan</a> &middot; Yushu Excellence Technologies</p>
        </div>
      </footer>
    </main>
  );
}
