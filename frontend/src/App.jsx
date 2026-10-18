import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const demoScope = `Build a responsive landing page.\nAdd a contact form.\nInclude mobile and desktop layouts.`;
const demoRequest = `Can you also add an admin dashboard\nand CSV export for all contact form submissions?`;

function normalizeForComparison(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isDuplicateText(candidate, reference) {
  const left = normalizeForComparison(candidate);
  const right = normalizeForComparison(reference);
  if (!left || !right) return false;
  if (left === right) return true;
  const contains = left.includes(right) || right.includes(left);
  return contains && Math.min(left.length, right.length) / Math.max(left.length, right.length) >= 0.82;
}

function featurePhrase(feature) {
  const value = String(feature || "this request").trim().replace(/[.!?]+$/, "");
  const match = value.match(/^(add|include|build|create|implement|support|integrate|provide|develop|design|enable|allow|export|import|track|manage|show|display|generate|send|upload|download|automate|redesign|update|remove|delete|change|modify|fix|improve)\s+(.+)$/i);
  if (!match) return `the feature “${value}”`;
  const gerunds = {
    add: "adding", include: "including", build: "building", create: "creating",
    implement: "implementing", support: "supporting", integrate: "integrating",
    provide: "providing", develop: "developing", design: "designing", enable: "enabling",
    allow: "allowing", export: "exporting", import: "importing", track: "tracking",
    manage: "managing", show: "showing", display: "displaying", generate: "generating",
    send: "sending", upload: "uploading", download: "downloading", automate: "automating",
    redesign: "redesigning", update: "updating", remove: "removing", delete: "deleting",
    change: "changing", modify: "modifying", fix: "fixing", improve: "improving",
  };
  return `${gerunds[match[1].toLowerCase()]} ${match[2]}`;
}

function conciseReplyFor(analysis) {
  const items = Array.isArray(analysis?.items) ? analysis.items : [];
  if (items.length !== 1 || items[0]?.classification === "in_scope") return "";
  const item = items[0];
  const feature = featurePhrase(item.feature);
  if (item.classification === "needs_clarification") {
    return `Thanks for the request. Could you confirm whether ${feature} was included in the original agreement? The scope doesn’t specify this, so I’d like to clarify before proceeding.`;
  }
  if (item.classification === "potentially_out_of_scope") {
    return `Thanks for the suggestion. The agreement doesn’t clearly cover ${feature}. Could we confirm whether it was included? If not, I can outline the additional work and estimate.`;
  }
  return "";
}

function Icon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    pulse: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.spark}</svg>;
}

function App() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [scope, setScope] = useState(demoScope);
  const [request, setRequest] = useState(demoRequest);
  const [result, setResult] = useState(null);
  const [editedReply, setEditedReply] = useState("");
  const [editingReply, setEditingReply] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [backendState, setBackendState] = useState("checking");
  const [ollamaState, setOllamaState] = useState("checking");

  const selectedProject = projects.find((project) => String(project.id) === projectId);
  const analysisCount = useMemo(
    () => projects.reduce((total, project) => total + Number(project.analysis_count || 0), 0),
    [projects]
  );

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects`);
      if (!response.ok) throw new Error("Could not load projects.");
      const data = await response.json();
      setProjects(data);
      return data;
    } catch (err) {
      setError(`${err.message} Check that the backend is running.`);
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadHistory = useCallback(async (id) => {
    if (!id) {
      setHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}/analyses`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not load analysis history.");
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    let active = true;
    fetch(`${API_URL}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error("Backend unavailable");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setBackendState("online");
        setOllamaState(data.ollama === "available" ? "online" : "offline");
      })
      .catch(() => {
        if (!active) return;
        setBackendState("offline");
        setOllamaState("offline");
      });
    return () => { active = false; };
  }, [loadProjects]);

  useEffect(() => {
    if (!projectId) {
      setHistory([]);
      return;
    }
    const project = projects.find((item) => String(item.id) === projectId);
    if (project) {
      setScope(project.agreed_scope || "");
      setEditProjectName(project.name || "");
    }
    loadHistory(projectId);
  }, [projectId, projects, loadHistory]);

  async function createProject(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim(), agreed_scope: scope }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Project creation failed.");
      await loadProjects();
      setProjectId(String(data.id));
      setResult(null);
      setEditedReply("");
      setNewProjectName("");
      setNotice(`Project “${data.name}” created successfully.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveProject(event) {
    event?.preventDefault?.();
    if (!selectedProject) return;
    setSavingProject(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editProjectName.trim(), agreed_scope: scope }),
      });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.detail || "Could not save project.");
      await loadProjects();
      setNotice("Project details saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProject(false);
    }
  }

  async function deleteSelectedProject() {
    if (!selectedProject) return;
    const confirmed = window.confirm(`Delete “${selectedProject.name}” and all its saved analyses? This cannot be undone.`);
    if (!confirmed) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Could not delete project.");
      }
      setProjectId("");
      setHistory([]);
      setResult(null);
      setEditedReply("");
      setEditingReply(false);
      setScope(demoScope);
      setEditProjectName("");
      await loadProjects();
      setNotice("Project and saved analysis history deleted.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function analyzeScope(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);
    setEditedReply("");
    setEditingReply(false);
    try {
      let activeId = projectId;
      if (!activeId) {
        const createResponse = await fetch(`${API_URL}/api/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newProjectName.trim() || "Untitled Project", agreed_scope: scope }),
        });
        const created = await createResponse.json();
        if (!createResponse.ok) throw new Error(created.detail || "Could not create project.");
        activeId = String(created.id);
        setProjectId(activeId);
        setNewProjectName("");
        await loadProjects();
      }
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: Number(activeId), agreed_scope: scope, client_request: request }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed.");
      setResult(data);
      setEditedReply(conciseReplyFor(data) || data.reply_draft || "");
      await loadHistory(activeId);
      await loadProjects();
      setNotice("Analysis complete and saved to project history.");
      window.setTimeout(() => document.getElementById("analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (err) {
      setError(`${err.message} Check that the backend and Ollama are running.`);
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    const reply = (editedReply || result?.reply_draft || "").trim();
    if (!reply) return;
    try {
      await navigator.clipboard.writeText(reply);
      setNotice("Client reply copied to clipboard.");
      setError("");
    } catch {
      setError("Clipboard access failed. Select and copy the reply manually.");
    }
  }

  function showPastAnalysis(analysis) {
    let savedResult = analysis.result;
    if (typeof savedResult === "string") {
      try { savedResult = JSON.parse(savedResult); } catch { savedResult = null; }
    }
    if (!savedResult) {
      setError("This saved analysis could not be opened.");
      return;
    }
    setResult({ ...savedResult, project_id: analysis.project_id });
    setEditedReply(conciseReplyFor(savedResult) || savedResult.reply_draft || "");
    setEditingReply(false);
    setRequest(analysis.client_request || "");
    setError("");
    setNotice(`Viewing saved analysis #${analysis.id}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function labelFor(classification) {
    return {
      in_scope: "In scope",
      potentially_out_of_scope: "Potentially out of scope",
      needs_clarification: "Needs clarification",
    }[classification] || String(classification || "Unknown").replaceAll("_", " ");
  }

  function classificationTone(classification) {
    if (classification === "in_scope") return "success";
    if (classification === "potentially_out_of_scope") return "warning";
    return "neutral";
  }

  function formatDate(value) {
    if (!value) return "Saved analysis";
    const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="sg-app">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />

      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="ScopeGuard AI home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><path className="brand-shield" d="M16 3.5 26 7v7.2c0 6.5-4.1 11.2-10 14.3C10.1 25.4 6 20.7 6 14.2V7l10-3.5Z"/><path className="brand-check" d="m11.2 15.8 3.2 3.2 6.8-7"/></svg><i /></span>
          <span className="brand-wordmark">scopeguard<span>.ai</span></span>
        </a>

        <div className="workspace-switcher">
          <span className="side-kicker">WORKSPACE</span>
          <div className="workspace-avatar">SG</div>
          <div className="workspace-meta">
            <strong>Freelance studio</strong>
            <span>Personal workspace</span>
          </div>
          <span className="workspace-chevron"><Icon name="chevron" /></span>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          <span className="side-kicker">YOUR CONSOLE</span>
          <a className="nav-link active" href="#workspace"><Icon name="grid" /><span>Overview</span><span className="nav-arrow">↗</span></a>
          <a className="nav-link" href="#project-hub"><Icon name="layers" /><span>Projects</span><span className="nav-count">{projects.length}</span></a>
          <a className="nav-link" href="#analysis-results"><Icon name="pulse" /><span>Scope analysis</span></a>
          <a className="nav-link" href="#history"><Icon name="clock" /><span>Analysis history</span></a>
        </nav>

        <div className="sidebar-projects">
          <div className="side-section-head"><span className="side-kicker">RECENT PROJECTS</span><span className="side-section-count">{projects.length.toString().padStart(2, "0")}</span></div>
          {projects.length === 0 ? (
            <p className="side-empty">Your project list will appear here.</p>
          ) : projects.slice(0, 4).map((project) => (
            <button key={project.id} type="button" className={`side-project ${String(project.id) === projectId ? "selected" : ""}`} onClick={() => { setProjectId(String(project.id)); setResult(null); setError(""); setNotice(""); }}>
              <span className="project-glyph">{(project.name || "P").slice(0, 1).toUpperCase()}</span>
              <span className="side-project-label"><strong>{project.name}</strong><small>{Number(project.analysis_count || 0)} analyses</small></span>
              <span className="side-project-dot" />
            </button>
          ))}
          <a href="#project-hub" className="new-project-link"><Icon name="plus" /> New project</a>
        </div>

        <div className="sidebar-bottom">
          <div className="engine-card">
            <div className="engine-card-top"><span className="engine-orbit"><Icon name="spark" /></span><span className={`engine-status ${backendState === "online" && ollamaState === "online" ? "is-online" : "is-offline"}`} /></div>
            <strong>Local inference</strong>
            <p>Your project data stays on your machine.</p>
            <div className="engine-lines"><span>API <b>{backendState === "checking" ? "CHECKING" : backendState === "online" ? "ONLINE" : "OFFLINE"}</b></span><span>OLLAMA <b>{ollamaState === "checking" ? "CHECKING" : ollamaState === "online" ? "ONLINE" : "OFFLINE"}</b></span></div>
          </div>
          <div className="sidebar-footer"><span className="mini-shield"><Icon name="shield" /></span><span>Privacy-first by design</span><span className="version-tag">v0.4</span></div>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" /><strong>Overview</strong></div>
          <div className="topbar-right"><span className="secure-label"><span className="secure-dot" /> PRIVATE SESSION</span><span className="topbar-divider" /><div className="profile-chip"><span className="profile-avatar">S</span><span>Studio owner</span></div></div>
        </header>

        <section className="hero" id="workspace">
          <div className="hero-copy-block">
            <div className="hero-eyebrow"><span className="eyebrow-rule" /> SCOPE INTELLIGENCE <span className="eyebrow-index">01 — 04</span></div>
            <h1>Good work deserves<br /><em>clear boundaries.</em></h1>
            <p>Compare what was promised with what's being asked. Make the next move with clarity—not guesswork.</p>
            <a className="hero-action" href="#analysis-workspace">Start an analysis <span><Icon name="arrow" /></span></a>
          </div>
          <div className="hero-visual" aria-label="Scope analysis illustration">
            <div className="visual-grid" />
            <div className="visual-ring ring-one" /><div className="visual-ring ring-two" /><div className="visual-ring ring-three" />
            <div className="visual-core"><div className="core-mark"><Icon name="shield" /></div><span>SCOPE<br />SIGNAL</span><b /></div>
            <div className="visual-label label-top"><span className="label-dot violet" /> AGREED SCOPE <b>01</b></div>
            <div className="visual-label label-bottom"><span className="label-dot lime" /> NEW REQUEST <b>02</b></div>
            <div className="visual-callout"><span className="callout-pulse" /><div><strong>Signal detected</strong><small>Compare. Verify. Respond.</small></div></div>
            <span className="visual-cross cross-a">+</span><span className="visual-cross cross-b">+</span>
          </div>
        </section>

        <section className="stats-strip" aria-label="Workspace statistics">
          <div className="stat-cell"><span className="stat-icon violet-icon"><Icon name="layers" /></span><div><span className="stat-label">ACTIVE PROJECTS</span><strong>{projects.length.toString().padStart(2, "0")}</strong></div><span className="stat-note">In your workspace</span></div>
          <div className="stat-cell"><span className="stat-icon lime-icon"><Icon name="pulse" /></span><div><span className="stat-label">ANALYSES RUN</span><strong>{analysisCount.toString().padStart(2, "0")}</strong></div><span className="stat-note">Saved for reference</span></div>
          <div className="stat-cell"><span className="stat-icon blue-icon"><Icon name="shield" /></span><div><span className="stat-label">PROCESSING</span><strong className="stat-word">LOCAL AI</strong></div><span className="stat-note">Ollama-powered</span></div>
        </section>

        <section className="project-hub section-block" id="project-hub">
          <div className="section-heading">
            <div><span className="section-index">01 / WORKSPACE</span><h2>Project control</h2><p>Choose a project or create a fresh scope to assess.</p></div>
            <span className="section-side-note"><span className="tiny-status" /> {loadingProjects ? "Syncing projects" : `${projects.length} ${projects.length === 1 ? "project" : "projects"} connected`}</span>
          </div>
          <div className="project-control-grid">
            <div className="control-panel current-project-panel">
              <div className="panel-topline"><span className="panel-icon"><Icon name="layers" /></span><span className="panel-caption">CURRENT PROJECT</span><span className="panel-tag">01</span></div>
              <label htmlFor="project-select">Select workspace project</label>
              <select id="project-select" value={projectId} onChange={(event) => { setProjectId(event.target.value); setResult(null); setEditedReply(""); setError(""); setNotice(""); }} disabled={loadingProjects}>
                <option value="">Start without a saved project</option>
                {projects.map((project) => <option key={project.id} value={String(project.id)}>{project.name} · {Number(project.analysis_count || 0)} analyses</option>)}
              </select>
              {selectedProject ? (
                <form className="project-edit-fields" onSubmit={saveProject}>
                  <label htmlFor="edit-project-name">Project name</label>
                  <input id="edit-project-name" value={editProjectName} onChange={(event) => setEditProjectName(event.target.value)} maxLength={200} required />
                  <div className="project-control-actions"><button type="submit" className="button-quiet" disabled={savingProject || !editProjectName.trim()}>{savingProject ? "Saving…" : "Save project details"}</button><button type="button" className="button-danger-quiet" onClick={deleteSelectedProject}><Icon name="trash" /> Delete</button></div>
                  <p className="field-hint">The scope you edit below is saved with this project.</p>
                </form>
              ) : <p className="panel-helper">Run an analysis to save it in a new project, or create one here.</p>}
            </div>

            <div className="control-panel create-project-panel">
              <div className="panel-topline"><span className="panel-icon lime-panel-icon"><Icon name="plus" /></span><span className="panel-caption">NEW WORKSTREAM</span><span className="panel-tag">02</span></div>
              <h3>Start somewhere new.</h3>
              <p>Create a named project to keep its scope, requests, and analysis history together.</p>
              <form onSubmit={createProject} className="create-project-form">
                <label htmlFor="new-project-name">Project name</label>
                <div className="create-project-row"><input id="new-project-name" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} maxLength={200} placeholder="e.g. Adventure game" required /><button aria-label="Create project" type="submit" disabled={!newProjectName.trim()}><Icon name="arrow" /></button></div>
              </form>
              <div className="create-panel-foot"><span><Icon name="shield" /> Private local storage</span><span>QUICK SETUP</span></div>
            </div>
          </div>
        </section>

        <section className="section-block analysis-workspace" id="analysis-workspace">
          <div className="section-heading">
            <div><span className="section-index">02 / INPUT</span><h2>Define the boundary.</h2><p>Give the model the original commitment and the new ask.</p></div>
            <div className="analysis-note"><Icon name="spark" /><span>Keep it specific.<br /><b>Better context, better judgment.</b></span></div>
          </div>
          <form className="analysis-form" onSubmit={analyzeScope}>
            <div className="input-grid">
              <article className="input-card scope-card">
                <div className="input-card-header"><div className="input-card-title"><span className="input-number">A</span><div><label htmlFor="analysis-scope">Agreed project scope</label><p>The original agreement, brief, or deliverables.</p></div></div><span className="input-type">SOURCE TEXT</span></div>
                <textarea id="analysis-scope" value={scope} onChange={(event) => setScope(event.target.value)} maxLength={12000} minLength={5} required placeholder="Paste the original project brief…" />
                <div className="input-card-footer"><span><Icon name="shield" /> Treated as source evidence</span><span className="char-count">{scope.length.toLocaleString()}/12,000</span></div>
              </article>
              <article className="input-card request-card">
                <div className="input-card-header"><div className="input-card-title"><span className="input-number request-number">B</span><div><label htmlFor="request">New client request</label><p>The change, addition, or follow-up being requested.</p></div></div><span className="input-type">NEW SIGNAL</span></div>
                <textarea id="request" value={request} onChange={(event) => setRequest(event.target.value)} maxLength={6000} minLength={3} required placeholder="Paste the client's latest message…" />
                <div className="input-card-footer"><span><Icon name="pulse" /> Compared against source scope</span><span className="char-count">{request.length.toLocaleString()}/6,000</span></div>
              </article>
            </div>
            <div className="analysis-submit-row"><div className="submit-assurance"><span className="assurance-lock"><Icon name="shield" /></span><span><strong>Private analysis</strong><small>Runs through your local Ollama instance.</small></span></div><button className="analyze-button" type="submit" disabled={loading || !scope.trim() || !request.trim()}><span className="analyze-button-icon">{loading ? <span className="spinner" /> : <Icon name="spark" />}</span><span>{loading ? "Analyzing request…" : "Analyze scope"}<small>{loading ? "Local model is evaluating the text" : "Generate findings and a client reply"}</small></span><span className="analyze-arrow"><Icon name="arrow" /></span></button></div>
          </form>
        </section>

        {error && <div className="feedback-message error-message" role="alert"><span>!</span><div><strong>Something needs attention</strong><p>{error}</p></div><button type="button" aria-label="Dismiss error" onClick={() => setError("")}>×</button></div>}
        {notice && <div className="feedback-message notice-message" role="status"><span><Icon name="check" /></span><p>{notice}</p><button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
        {loading && <div className="analysis-progress"><div className="progress-orbit"><Icon name="spark" /></div><div><strong>Reading the scope signal…</strong><p>Gemma is comparing the request with the agreed deliverables. This can take a little while on a local model.</p></div><div className="progress-track"><span /></div></div>}

        {result && (
          <section className="section-block results-section" id="analysis-results">
            <div className="section-heading results-section-heading"><div><span className="section-index">03 / FINDINGS</span><h2>Here's what changed.</h2><p>A grounded read of the request against the stated agreement.</p></div><span className="analysis-complete"><span className="tiny-status" /> ANALYSIS COMPLETE</span></div>
            <div className="results-overview"><div className="overview-mark"><Icon name="pulse" /></div><div className="overview-content"><span className="overview-label">OVERALL ASSESSMENT {selectedProject ? `· ${selectedProject.name}` : ""}</span><p>{result.summary}</p></div><div className="overview-stamp"><Icon name="shield" /><span>Evidence-led<br />review</span></div></div>
            <details className="source-scope-card"><summary aria-label="Show or hide the original agreed scope"><span><Icon name="file" /> Original agreed scope</span><span className="source-scope-toggle"><span className="toggle-closed">View source text</span><span className="toggle-open">Hide source text</span></span></summary><pre>{result.agreed_scope || "The original scope was not stored for this older analysis. The scope currently shown in the editor may differ from the scope used when this analysis was created."}</pre></details>
            <div className="findings-list">
              {(result.items || []).map((item, index) => {
                const tone = classificationTone(item.classification);
                const showReason = item.reason && !isDuplicateText(item.reason, result.summary);
                const detailText = item.evidence_explanation
                  || (item.assessment && !isDuplicateText(item.assessment, item.reason) ? item.assessment : "")
                  || (item.scope_evidence
                    ? `The verified quotation confirms only the wording shown above. It does not explicitly establish whether “${String(item.feature || "this feature").trim()}” is included or excluded, so the available agreement is insufficient to make a definitive scope decision.`
                    : "No exact quotation from the agreed scope could be verified for this finding. The available evidence is insufficient to determine whether this request is included or excluded; clarify the original agreement before deciding.");
                const hasExtraReasoning = Boolean(detailText);
                return (
                  <article className={`finding-card finding-${tone}`} key={`${item.feature}-${index}`}>
                    <div className="finding-heading"><div className="finding-title-wrap"><span className="finding-index">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.feature}</h3>{showReason && <p>{item.reason}</p>}</div></div><span className={`classification-pill ${tone}`}><span />{labelFor(item.classification)}</span></div>
                    <div className="finding-detail-grid">
                      <div className="evidence-panel"><div className="detail-label"><Icon name="shield" /><span className="detail-label-text">SOURCE EVIDENCE</span><span className="evidence-label-separator" aria-hidden="true">·</span><span className={`evidence-status ${item.evidence_verified && item.scope_evidence ? "verified" : "unverified"}`}>{item.evidence_verified && item.scope_evidence ? "VERIFIED" : "NOT VERIFIED"}</span></div>
                        {item.evidence_verified && item.scope_evidence ? <blockquote className="quote-verified">“{item.scope_evidence}”</blockquote> : <p className="evidence-empty">No verifiable quotation was supplied from the agreed scope.</p>}
                        {hasExtraReasoning && <details className="finding-extra-details"><summary><span className="toggle-closed">View assessment details</span><span className="toggle-open">Hide assessment details</span></summary><p className="evidence-explanation">{detailText}</p></details>}
                      </div>
                      <div className="assessment-panel"><div className="detail-label"><Icon name="pulse" /> RECOMMENDED NEXT STEP</div><p className="next-step-text">{item.suggested_action || "Clarify the intended requirement with the client."}</p></div>
                    </div>
                  </article>
                );
              })}
            </div>

            <article className="reply-editor-card">
              <div className="reply-card-top"><div className="reply-heading"><span className="reply-icon"><Icon name="edit" /></span><div><span className="section-index">04 / CLIENT COMMUNICATION</span><h3>Say it with clarity.</h3><p>A professional starting point. Review it, make it yours, then copy.</p></div></div><span className="draft-pill"><span /> {conciseReplyFor(result) && conciseReplyFor(result) !== result.reply_draft ? "CONCISE DRAFT" : "AI DRAFT"}</span></div>
              <div className="reply-editor-body">
                {editingReply ? <textarea className="reply-textarea" aria-label="Edit client reply" value={editedReply} onChange={(event) => setEditedReply(event.target.value)} rows={7} /> : <div className="reply-text-block">{editedReply || result.reply_draft}</div>}
                <div className="reply-actions"><div className="reply-editor-hint"><Icon name="shield" /><span>{conciseReplyFor(result) && conciseReplyFor(result) !== result.reply_draft ? "Concise draft avoids repeating the analysis. You can switch to the original AI version." : "Review before sending. The final wording is yours."}</span></div><div className="reply-buttons">{editingReply ? <><button type="button" className="button-secondary" onClick={() => { setEditedReply(conciseReplyFor(result) || result.reply_draft || ""); setEditingReply(false); }}>Reset draft</button><button type="button" className="button-primary" onClick={() => { setEditingReply(false); setNotice("Client reply changes saved in this view."); }}>Done editing <Icon name="check" /></button></> : <>{conciseReplyFor(result) && conciseReplyFor(result) !== result.reply_draft && <button type="button" className="button-secondary" onClick={() => setEditedReply(editedReply === conciseReplyFor(result) ? (result.reply_draft || "") : conciseReplyFor(result))}>{editedReply === conciseReplyFor(result) ? "Use original AI draft" : "Use concise draft"}</button>}<button type="button" className="button-secondary" onClick={() => setEditingReply(true)}><Icon name="edit" /> Edit reply</button><button type="button" className="button-primary" onClick={copyReply}><Icon name="copy" /> Copy reply</button></>}</div></div>
              </div>
            </article>
            <p className="disclaimer"><Icon name="shield" /> AI-generated suggestions can be wrong. Review the original agreement and edit the response before sending it.</p>
          </section>
        )}

        <section className="section-block history-section" id="history">
          <div className="section-heading"><div><span className="section-index">04 / MEMORY</span><h2>Analysis history</h2><p>Your previous scope decisions, kept close at hand.</p></div>{selectedProject && <span className="history-project-tag"><span className="tiny-status" /> {selectedProject.name}</span>}</div>
          {!projectId ? <div className="history-empty"><span className="history-empty-icon"><Icon name="clock" /></span><div><strong>Select a project to see its history.</strong><p>Saved analyses will appear here and stay associated with their project.</p></div><a href="#project-hub"><Icon name="arrow" /> Choose a project</a></div> : loadingHistory ? <div className="history-empty"><span className="spinner dark-spinner" /><div><strong>Loading saved analyses…</strong><p>Retrieving this project's analysis history.</p></div></div> : history.length === 0 ? <div className="history-empty"><span className="history-empty-icon"><Icon name="file" /></span><div><strong>No analyses saved yet.</strong><p>Run your first scope analysis to build a searchable trail.</p></div><a href="#analysis-workspace"><Icon name="arrow" /> Start an analysis</a></div> : (
            <div className="history-table"><div className="history-table-head"><span>CLIENT REQUEST</span><span>CREATED</span><span>STATUS</span><span /></div>{history.map((analysis) => {
              const saved = typeof analysis.result === "string" ? (() => { try { return JSON.parse(analysis.result); } catch { return {}; } })() : (analysis.result || {});
              const first = (saved.items || [])[0];
              const tone = classificationTone(first?.classification);
              return <article className="history-row" key={analysis.id}><div className="history-request"><span className="history-file-icon"><Icon name="file" /></span><div><strong>{analysis.client_request || "Untitled request"}</strong><small>Analysis #{analysis.id}</small></div></div><span className="history-date">{formatDate(analysis.created_at)}</span><span className={`history-status ${tone}`}><span />{first?.classification ? labelFor(first.classification) : "Saved"}</span><button type="button" className="history-open" onClick={() => showPastAnalysis(analysis)}>Open <Icon name="arrow" /></button></article>;
            })}</div>
          )}
        </section>

        <footer className="app-footer"><div className="footer-brand"><span className="brand-mark small-brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><path className="brand-shield" d="M16 3.5 26 7v7.2c0 6.5-4.1 11.2-10 14.3C10.1 25.4 6 20.7 6 14.2V7l10-3.5Z"/><path className="brand-check" d="m11.2 15.8 3.2 3.2 6.8-7"/></svg><i /></span><span>scopeguard<span>.ai</span></span></div><span>Built for independent professionals.</span><span>LOCAL FIRST <i /> PRIVATE BY DESIGN</span></footer>
      </main>
    </div>
  );
}

export default App;
