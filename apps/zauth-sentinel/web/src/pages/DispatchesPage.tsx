import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiRequestError } from "../lib/api";
import type { Dispatch, SessionViewModel } from "../types";
import type { ToastTone } from "../components/ToastStack";

type Props = {
  session: SessionViewModel;
  onSessionExpired: () => void;
  onNotify: (tone: ToastTone, text: string) => void;
};

function classForClassification(c: string): string {
  switch (c) {
    case "TOP_SECRET": return "badge-top-secret";
    case "SECRET": return "badge-secret";
    case "CONFIDENTIAL": return "badge-confidential";
    case "UNCLASSIFIED": return "badge-unclassified";
    default: return "";
  }
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function DispatchesPage({ session, onSessionExpired, onNotify }: Props) {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [classification, setClassification] = useState("CONFIDENTIAL");
  const [priority, setPriority] = useState("ROUTINE");
  const [tags, setTags] = useState("");

  const csrfToken = session.csrf_token ?? "";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ dispatches: Dispatch[] }>("/api/dispatches");
      setDispatches(data.dispatches || []);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) { onSessionExpired(); return; }
    } finally { setLoading(false); }
  }, [onSessionExpired]);

  useEffect(() => { void load(); }, [load]);

  const resetEditor = () => {
    setSelectedId(null); setTitle(""); setContent(""); setClassification("CONFIDENTIAL"); setPriority("ROUTINE"); setTags("");
  };

  const selectDispatch = (d: Dispatch) => {
    setSelectedId(d.id); setTitle(d.title); setContent(d.content);
    setClassification(d.classification); setPriority(d.priority);
    setTags((d.tags || []).join(", "));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSaving(true);
      const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const body = { title: title.trim(), content, classification, priority, tags: parsedTags };

      if (selectedId !== null) {
        const updated = await apiRequest<Dispatch>(`/api/dispatches/${selectedId}`, { method: "PATCH", body, csrfToken });
        setDispatches((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        onNotify("success", "Dispatch updated.");
      } else {
        const created = await apiRequest<Dispatch>("/api/dispatches", { method: "POST", body, csrfToken });
        setDispatches((prev) => [created, ...prev]);
        setSelectedId(created.id);
        onNotify("success", "Dispatch created.");
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) { onSessionExpired(); return; }
      onNotify("error", "Unable to save dispatch.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (selectedId === null) return;
    if (!window.confirm("Delete this dispatch?")) return;
    try {
      await apiRequest(`/api/dispatches/${selectedId}`, { method: "DELETE", csrfToken });
      setDispatches((prev) => prev.filter((d) => d.id !== selectedId));
      resetEditor();
      onNotify("info", "Dispatch deleted.");
    } catch {
      onNotify("error", "Unable to delete dispatch.");
    }
  };

  return (
    <div>
      <div className="app-main-header">
        <h1>Secure Dispatches</h1>
        <button className="btn btn-primary btn-sm" onClick={resetEditor}>New Dispatch</button>
      </div>

      <div className="dispatches-grid">
        <div className="dispatch-list-panel">
          <div className="dispatch-list-header">
            <h2>Dispatches <span className="badge badge-active">{dispatches.length}</span></h2>
          </div>
          <div className="dispatch-list">
            {loading ? (
              <p className="empty-state">Loading...</p>
            ) : dispatches.length === 0 ? (
              <p className="empty-state">No dispatches yet.</p>
            ) : (
              dispatches.map((d) => (
                <button key={d.id} type="button" className={`dispatch-item ${d.id === selectedId ? "is-active" : ""}`} onClick={() => selectDispatch(d)}>
                  <div className="dispatch-item-top">
                    <strong>{d.title}</strong>
                    <span className={`badge ${classForClassification(d.classification)}`}>{d.classification.replace("_", " ")}</span>
                  </div>
                  <p>{d.content || "No content"}</p>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>{formatDate(d.updated_at)}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="dispatch-editor-panel">
          <h2>{selectedId ? "Edit Dispatch" : "New Dispatch"}</h2>
          <form onSubmit={handleSave}>
            <div className="field" style={{ marginBottom: "var(--space-3)" }}>
              <span>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Operational briefing" required />
            </div>
            <div className="form-row" style={{ marginBottom: "var(--space-3)" }}>
              <div className="field">
                <span>Classification</span>
                <select value={classification} onChange={(e) => setClassification(e.target.value)}>
                  <option value="TOP_SECRET">TOP SECRET</option>
                  <option value="SECRET">SECRET</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                </select>
              </div>
              <div className="field">
                <span>Priority</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="FLASH">FLASH</option>
                  <option value="IMMEDIATE">IMMEDIATE</option>
                  <option value="PRIORITY">PRIORITY</option>
                  <option value="ROUTINE">ROUTINE</option>
                </select>
              </div>
            </div>
            <div className="field" style={{ marginBottom: "var(--space-3)" }}>
              <span>Content</span>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Dispatch content..." rows={8} />
            </div>
            <div className="field" style={{ marginBottom: "var(--space-3)" }}>
              <span>Tags</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="operations, sector-7, urgent" />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? "Saving..." : selectedId ? "Save Changes" : "Create Dispatch"}
              </button>
              {selectedId && (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
