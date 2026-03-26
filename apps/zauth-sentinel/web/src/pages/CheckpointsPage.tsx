import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import type { CheckpointEntry, Personnel, SessionViewModel } from "../types";

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function resultClass(r: string): string {
  switch (r) {
    case "PASS": return "badge-pass";
    case "FAIL": return "badge-fail";
    case "FLAGGED": return "badge-flagged";
    default: return "";
  }
}

type Props = { session: SessionViewModel };

export function CheckpointsPage({ session }: Props) {
  const [entries, setEntries] = useState<CheckpointEntry[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [personnelId, setPersonnelId] = useState("");
  const [checkpointName, setCheckpointName] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState("PASS");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const csrfToken = session.csrf_token ?? "";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cpData, pData] = await Promise.all([
        apiRequest<{ checkpoints: CheckpointEntry[] }>("/api/checkpoints"),
        apiRequest<{ personnel: Personnel[] }>("/api/personnel")
      ]);
      setEntries(cpData.checkpoints || []);
      setPersonnel(pData.personnel || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!personnelId || !checkpointName) return;
    try {
      setSaving(true);
      await apiRequest("/api/checkpoints", {
        method: "POST",
        csrfToken,
        body: { personnel_id: Number(personnelId), checkpoint_name: checkpointName, location: location || null, result, notes: notes || null }
      });
      setShowForm(false);
      setPersonnelId(""); setCheckpointName(""); setLocation(""); setResult("PASS"); setNotes("");
      await load();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="app-main-header">
        <h1>Checkpoint Verification Log</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Record Verification"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
          <div className="form-row">
            <div className="field">
              <span>Personnel</span>
              <select value={personnelId} onChange={(e) => setPersonnelId(e.target.value)} required>
                <option value="">Select personnel</option>
                {personnel.map((p) => <option key={p.id} value={p.id}>{p.rank} {p.full_name} ({p.service_number})</option>)}
              </select>
            </div>
            <div className="field">
              <span>Checkpoint</span>
              <input value={checkpointName} onChange={(e) => setCheckpointName(e.target.value)} placeholder="Gate Alpha" required />
            </div>
          </div>
          <div className="form-row" style={{ marginTop: "var(--space-3)" }}>
            <div className="field">
              <span>Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sector 7, LoC" />
            </div>
            <div className="field">
              <span>Result</span>
              <select value={result} onChange={(e) => setResult(e.target.value)}>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="FLAGGED">FLAGGED</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: "var(--space-3)" }}>
            <span>Notes</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? "Recording..." : "Record Verification"}</button>
          </div>
        </form>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Personnel</th>
              <th>Checkpoint</th>
              <th>Location</th>
              <th>Method</th>
              <th>Result</th>
              <th>Verified By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="empty-state">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">No checkpoint verifications yet.</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id}>
                  <td>{formatTime(e.verified_at)}</td>
                  <td><strong>{e.personnel_rank} {e.personnel_name}</strong></td>
                  <td>{e.checkpoint_name}</td>
                  <td>{e.location || "—"}</td>
                  <td>{e.verification_method === "zk_biometric" ? "ZK Biometric" : e.verification_method}</td>
                  <td><span className={`badge ${resultClass(e.result)}`}>{e.result}</span></td>
                  <td>{e.verified_by_name || "System"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
