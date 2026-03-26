import { useCallback, useEffect, useMemo, useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PersonnelPage } from "./pages/PersonnelPage";
import { CheckpointsPage } from "./pages/CheckpointsPage";
import { ArmouryPage } from "./pages/ArmouryPage";
import { DispatchesPage } from "./pages/DispatchesPage";
import { apiRequest, ApiRequestError } from "./lib/api";
import type { SessionViewModel } from "./types";
import { ToastStack, type ToastMessage, type ToastTone } from "./components/ToastStack";

type SessionLoadState = {
  loading: boolean;
  value: SessionViewModel | null;
};

type Page = "dashboard" | "personnel" | "checkpoints" | "armoury" | "dispatches";

function SentinelLogoSmall() {
  return (
    <div className="sentinel-logo compact" aria-label="Sentinel">
      <span className="sentinel-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sidebarLogoGrad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#6b8a3d" />
              <stop offset="1" stopColor="#4b5320" />
            </linearGradient>
          </defs>
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="url(#sidebarLogoGrad)" />
          <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="sentinel-logo-text">Sentinel</span>
    </div>
  );
}

function IconDashboard() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconPersonnel() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconCheckpoint() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function IconArmoury() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function IconDispatches() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}

const NAV_ITEMS: { id: Page; label: string; icon: () => JSX.Element }[] = [
  { id: "dashboard", label: "Dashboard", icon: IconDashboard },
  { id: "personnel", label: "Personnel", icon: IconPersonnel },
  { id: "checkpoints", label: "Checkpoints", icon: IconCheckpoint },
  { id: "armoury", label: "Armoury", icon: IconArmoury },
  { id: "dispatches", label: "Dispatches", icon: IconDispatches },
];

export default function App() {
  const [sessionState, setSessionState] = useState<SessionLoadState>({ loading: true, value: null });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const pushToast = useCallback((tone: ToastTone, text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((cur) => [...cur, { id, tone, text }].slice(-4));
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 4200);
  }, []);

  const readAndClearAuthQuery = useCallback(() => {
    const u = new URL(window.location.href);
    const auth = u.searchParams.get("auth");
    setAuthError(u.searchParams.get("auth_error") || "");
    setAuthMessage(u.searchParams.get("auth_message") || "");
    if (auth === "success") pushToast("success", "Secure sign-in complete.");
    if (auth || u.searchParams.get("auth_error") || u.searchParams.get("auth_message")) {
      u.searchParams.delete("auth"); u.searchParams.delete("auth_error"); u.searchParams.delete("auth_message");
      const q = u.searchParams.toString();
      window.history.replaceState({}, "", `${u.pathname}${q ? `?${q}` : ""}`);
    }
  }, [pushToast]);

  const loadSession = useCallback(async () => {
    setSessionState((c) => ({ ...c, loading: true }));
    try {
      const session = await apiRequest<SessionViewModel>("/api/session");
      setSessionState({ loading: false, value: session });
    } catch (err) {
      const fallback: SessionViewModel = { authenticated: false, login_url: "/login" };
      setSessionState({ loading: false, value: fallback });
      if (!(err instanceof ApiRequestError && err.status === 401)) {
        pushToast("error", "Unable to verify session.");
      }
    }
  }, [pushToast]);

  useEffect(() => { readAndClearAuthQuery(); void loadSession(); }, [loadSession, readAndClearAuthQuery]);

  const loginUrl = useMemo(() => sessionState.value?.login_url || "/login", [sessionState.value]);

  if (sessionState.loading) {
    return (
      <>
        <main className="screen">
          <section className="loading-shell">
            <div className="loading-spinner" aria-hidden="true" />
            <h1>Finishing secure sign-in...</h1>
            <p>Preparing Sentinel.</p>
          </section>
        </main>
        <ToastStack toasts={toasts} />
      </>
    );
  }

  const session = sessionState.value;
  const isAuthenticated = Boolean(session?.authenticated && session.user && session.assurance);

  if (!isAuthenticated || !session) {
    return (
      <>
        <LandingPage loginUrl={loginUrl} authError={authError || undefined} authMessage={authMessage || undefined} />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  const displayName = session.user?.display_name || session.user?.email || "Operator";

  const handleLogout = async () => {
    try { await apiRequest("/api/logout", { method: "POST" }); } catch { /* best-effort */ }
    await loadSession();
  };

  return (
    <>
      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="sidebar-logo">
            <SentinelLogoSmall />
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-link ${currentPage === item.id ? "is-active" : ""}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <item.icon />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <strong>{displayName}</strong>
              <span>{session.user?.rank} &middot; {session.user?.unit}</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" style={{ width: "100%" }} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="app-main">
          {currentPage === "dashboard" && <DashboardPage session={session} onNavigate={setCurrentPage} />}
          {currentPage === "personnel" && <PersonnelPage />}
          {currentPage === "checkpoints" && <CheckpointsPage session={session} />}
          {currentPage === "armoury" && <ArmouryPage session={session} />}
          {currentPage === "dispatches" && <DispatchesPage session={session} onSessionExpired={loadSession} onNotify={pushToast} />}
        </main>
      </div>
      <ToastStack toasts={toasts} />
    </>
  );
}
