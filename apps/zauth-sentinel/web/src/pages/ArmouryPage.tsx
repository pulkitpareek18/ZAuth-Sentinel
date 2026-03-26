import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import type { ArmouryEntry, Personnel, SessionViewModel } from "../types";

function formatTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

type Props = { session: SessionViewModel };

export function ArmouryPage({ session }: Props) {
  const [entries, setEntries] = useState<ArmouryEntry[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [personnelId, setPersonnelId] = useState("");
  const [weaponType, setWeaponType] = useState("");
  const [weaponSerial, setWeaponSerial] = useState("");
  const [action, setAction] = useState("CHECKOUT");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const csrfToken = session.csrf_token ?? "";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [aData, pData] = await Promise.all([
        apiRequest<{ armoury: ArmouryEntry[] }>("/api/armoury"),
        apiRequest<{ personnel: Personnel[] }>("/api/personnel")
      ]);
      setEntries(aData.armoury || []);
      setPersonnel(pData.personnel || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!personnelId || !weaponType || !weaponSerial) return;
    try {
      setSaving(true);
      await apiRequest("/api/armoury", {
        method: "POST",
        csrfToken,
        body: { personnel_id: Number(personnelId), weapon_type: weaponType, weapon_serial: weaponSerial, action, reason: reason || null }
      });
      setShowForm(false);
      setPersonnelId(""); setWeaponType(""); setWeaponSerial(""); setAction("CHECKOUT"); setReason("");
      await load();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="app-main-header">
        <h1>Armoury Access Log</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Record Transaction"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "var(--space-5)", marginBottom: "var(--space-4)" }}>
          <div className="form-row">
            <div className="field">
              <span>Personnel</span>
              <select value={personnelId} onChange={(e) => setPersonnelId(e.target.value)} required>
                <option value="">Select personnel</option>
                {personnel.map((p) => <option key={p.id} value={p.id}>{p.rank} {p.full_name}</option>)}
              </select>
            </div>
            <div className="field">
              <span>Action</span>
              <select value={action} onChange={(e) => setAction(e.target.value)}>
                <option value="CHECKOUT">CHECKOUT</option>
                <option value="RETURN">RETURN</option>
              </select>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: "var(--space-3)" }}>
            <div className="field">
              <span>Weapon Type</span>
              <input value={weaponType} onChange={(e) => setWeaponType(e.target.value)} placeholder="INSAS Rifle" required />
            </div>
            <div className="field">
              <span>Serial Number</span>
              <input value={weaponSerial} onChange={(e) => setWeaponSerial(e.target.value)} placeholder="INS-2024-XXXX" required />
            </div>
          </div>
          <div className="field" style={{ marginTop: "var(--space-3)" }}>
            <span>Reason</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Patrol duty - Sector 7" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? "Recording..." : "Record Transaction"}</button>
          </div>
        </form>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Personnel</th>
              <th>Weapon</th>
              <th>Serial</th>
              <th>Action</th>
              <th>Authorized By</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="empty-state">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">No armoury transactions yet.</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id}>
                  <td>{formatTime(e.action_at)}</td>
                  <td><strong>{e.personnel_rank} {e.personnel_name}</strong></td>
                  <td>{e.weapon_type}</td>
                  <td><code style={{ fontSize: 12 }}>{e.weapon_serial}</code></td>
                  <td><span className={`badge ${e.action === "CHECKOUT" ? "badge-checkout" : "badge-return"}`}>{e.action}</span></td>
                  <td>{e.authorized_by_name || "System"}</td>
                  <td>{e.reason || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
