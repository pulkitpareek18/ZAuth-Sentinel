import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { DashboardStats, SessionViewModel } from "../types";
import { AssuranceStrip } from "../components/AssuranceStrip";

type Props = {
  session: SessionViewModel;
  onNavigate: (page: "dashboard" | "personnel" | "checkpoints" | "armoury" | "dispatches") => void;
};

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function DashboardPage({ session, onNavigate }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest<DashboardStats>("/api/dashboard");
      setStats(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <div className="app-main-header">
        <h1>Dashboard</h1>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate("checkpoints")}>Record Verification</button>
      </div>

      {session.assurance && <AssuranceStrip assurance={session.assurance} />}

      {loading ? (
        <p className="empty-state">Loading dashboard...</p>
      ) : stats ? (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-card-value">{stats.total_personnel}</div>
              <div className="stat-card-label">Total Personnel</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.zk_verified}</div>
              <div className="stat-card-label">ZK Verified</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.checkpoints_today}</div>
              <div className="stat-card-label">Checkpoints Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{stats.weapons_out}</div>
              <div className="stat-card-label">Weapons Checked Out</div>
            </div>
          </div>

          <div className="activity-feed">
            <h2>Recent Activity</h2>
            {stats.recent_activity.length === 0 ? (
              <p className="empty-state">No recent activity.</p>
            ) : (
              stats.recent_activity.map((item, i) => (
                <div key={i} className="activity-item">
                  <span className={`activity-dot activity-dot-${item.type}`} />
                  <span>{item.description}</span>
                  <span className="activity-time">{formatTime(item.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="empty-state">Unable to load dashboard data.</p>
      )}
    </div>
  );
}
