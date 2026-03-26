import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { Personnel } from "../types";

function classForStatus(status: string): string {
  switch (status) {
    case "ACTIVE": return "badge-active";
    case "DEPLOYED": return "badge-deployed";
    case "ON_LEAVE": return "badge-on-leave";
    default: return "";
  }
}

function classForClearance(level: string): string {
  switch (level) {
    case "TOP_SECRET": return "badge-top-secret";
    case "SECRET": return "badge-secret";
    case "CONFIDENTIAL": return "badge-confidential";
    case "UNCLASSIFIED": return "badge-unclassified";
    default: return "";
  }
}

export function PersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (unitFilter) params.set("unit", unitFilter);
      const suffix = params.toString() ? `?${params}` : "";
      const data = await apiRequest<{ personnel: Personnel[] }>(`/api/personnel${suffix}`);
      setPersonnel(data.personnel || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [query, unitFilter]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 200);
    return () => clearTimeout(t);
  }, [load]);

  const units = Array.from(new Set(personnel.map((p) => p.unit))).sort();

  return (
    <div>
      <div className="app-main-header">
        <h1>Personnel Roster</h1>
        <span className="badge badge-active">{personnel.length} personnel</span>
      </div>

      <div className="filter-bar">
        <div className="field">
          <span>Search</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or service number" />
        </div>
        <div className="field">
          <span>Unit</span>
          <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}>
            <option value="">All Units</option>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Service No.</th>
              <th>Name</th>
              <th>Rank</th>
              <th>Unit</th>
              <th>Clearance</th>
              <th>ZK Status</th>
              <th>Status</th>
              <th>Last Checkpoint</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="empty-state">Loading...</td></tr>
            ) : personnel.length === 0 ? (
              <tr><td colSpan={9} className="empty-state">No personnel found.</td></tr>
            ) : (
              personnel.map((p) => (
                <tr key={p.id}>
                  <td><span className="avatar">{p.photo_placeholder || "?"}</span></td>
                  <td><strong>{p.service_number}</strong></td>
                  <td>{p.full_name}</td>
                  <td>{p.rank}</td>
                  <td>{p.unit}</td>
                  <td><span className={`badge ${classForClearance(p.clearance_level)}`}>{p.clearance_level.replace("_", " ")}</span></td>
                  <td>
                    <span className={`zk-badge ${p.zk_verified ? "zk-badge-verified" : "zk-badge-unverified"}`}>
                      {p.zk_verified ? (
                        <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Verified</>
                      ) : (
                        <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Pending</>
                      )}
                    </span>
                  </td>
                  <td><span className={`badge ${classForStatus(p.status)}`}>{p.status.replace("_", " ")}</span></td>
                  <td>{p.last_checkpoint || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
