import { useState } from "react";
import './styles.css';

/* ─── CONSTANTS ──────────────────────────────────────────────────────────── */
const COLORS = ["#6c63ff","#ff6584","#43e97b","#f7971e","#00b4d8","#e040fb","#ff6b35","#26a69a"];
const GRADIENTS = [
  "linear-gradient(135deg,#6c63ff,#a78bfa)",
  "linear-gradient(135deg,#ff6584,#ffa0a0)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#00b4d8,#0077b6)",
];

/* ─── TOAST ──────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useState(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); });
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className={`toast ${type}`} style={{ color: type === "success" ? "#43e97b" : type === "error" ? "#ff6b7a" : "var(--text)" }}>
      <span style={{ fontWeight: 700 }}>{icons[type]}</span>
      <span style={{ color: "var(--text)" }}>{msg}</span>
    </div>
  );
}

/* ─── AUTH ───────────────────────────────────────────────────────────────── */
function AuthPage({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!email.trim() || !pass.trim()) return setError("Заполните все поля.");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Некорректный email.");
    if (pass.length < 6) return setError("Пароль — минимум 6 символов.");

    try {
      if (tab === "register") {
        if (!name.trim()) return setError("Введите имя.");
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, pass }) });
        if (res.status === 409) return setError('Email уже зарегистрирован.');
        if (!res.ok) return setError('Ошибка сервера.');
        const user = await res.json();
        onAuth(user);
      } else {
        const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pass }) });
        if (res.status === 401) return setError('Неверный email или пароль.');
        if (!res.ok) return setError('Ошибка сервера.');
        const user = await res.json();
        onAuth(user);
      }
    } catch (err) {
      setError('Сетевая ошибка.');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">TaskFlow</div>
        <div className="auth-sub">Система управления задачами и проектами</div>
        <div className="tab-row">
          <button className={`tab-btn${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>Войти</button>
          <button className={`tab-btn${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>Регистрация</button>
        </div>
        <div className="auth-title">{tab === "login" ? "Добро пожаловать" : "Создать аккаунт"}</div>
        {error && <div className="error-msg">{error}</div>}
        {tab === "register" && (
          <div className="field-group">
            <label className="field-label">Имя</label>
            <input className="field-input" placeholder="Иван Иванов" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="field-group">
          <label className="field-label">Email</label>
          <input className="field-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Пароль</label>
          <input className="field-input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        <button className="btn-primary" onClick={submit}>{tab === "login" ? "Войти в аккаунт" : "Создать аккаунт"}</button>
      </div>
    </div>
  );
}

/* ─── PROJECT MODAL ──────────────────────────────────────────────────────── */
function ProjectModal({ initial, workspaces, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [deadline, setDeadline] = useState(initial?.deadline || "");
  const [wsId, setWsId] = useState(initial?.workspaceId || (workspaces[0]?.id ?? ""));
  const [error, setError] = useState("");

  function save() {
    if (!name.trim()) return setError("Введите название проекта.");
    if (!wsId) return setError("Выберите рабочее пространство.");
    setError("");
    onSave({ name: name.trim(), description: desc.trim(), color, deadline, workspaceId: wsId });
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{initial ? "Редактировать проект" : "Новый проект"}</div>
        {error && <div className="error-msg">{error}</div>}
        <div className="field-group">
          <label className="field-label">Название</label>
          <input className="field-input" placeholder="Мой проект" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Описание</label>
          <input className="field-input" placeholder="Краткое описание..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Рабочее пространство</label>
          <select className="select-input" value={wsId} onChange={e => setWsId(+e.target.value)}>
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Дедлайн</label>
          <input className="field-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            style={{ colorScheme: "dark" }} />
        </div>
        <div className="field-group">
          <label className="field-label" style={{ marginBottom: 10 }}>Цвет</label>
          <div className="color-row">
            {COLORS.map(c => (
              <div key={c} className={`color-swatch${color === c ? " sel" : ""}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn-save" onClick={save}>{initial ? "Сохранить" : "Создать"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── WORKSPACE MODAL ────────────────────────────────────────────────────── */
function WorkspaceModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [grad, setGrad] = useState(0);
  const [error, setError] = useState("");

  function save() {
    if (!name.trim()) return setError("Введите название.");
    onSave({ name: name.trim(), description: desc.trim(), gradient: grad });
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Новое рабочее пространство</div>
        {error && <div className="error-msg">{error}</div>}
        <div className="field-group">
          <label className="field-label">Название</label>
          <input className="field-input" placeholder="Команда разработки" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">Описание</label>
          <input className="field-input" placeholder="Описание пространства..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label" style={{ marginBottom: 10 }}>Тема</label>
          <div style={{ display: "flex", gap: 10 }}>
            {GRADIENTS.map((g, i) => (
              <div key={i} onClick={() => setGrad(i)} style={{
                width: 36, height: 36, borderRadius: 8, background: g, cursor: "pointer",
                outline: grad === i ? "2px solid #fff" : "2px solid transparent",
                outlineOffset: 2, transition: "all .15s"
              }} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn-save" onClick={save}>Создать</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DELETE CONFIRM MODAL ───────────────────────────────────────────────── */
function ConfirmModal({ title, text, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-title" style={{ color: "var(--danger)" }}>⚠ {title}</div>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>{text}</p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn-danger-solid" onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  );
}

/* ─── WORKSPACES PAGE ────────────────────────────────────────────────────── */
function WorkspacesPage({ workspaces, activeWs, onSelect, onAdd }) {
  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Рабочие пространства</div>
          <div className="page-sub">Выберите или создайте рабочее пространство</div>
        </div>
      </div>
      <div className="content">
        <div className="ws-grid">
          {workspaces.map((ws, i) => (
            <div key={ws.id} className={`ws-card${activeWs?.id === ws.id ? " active-ws" : ""}`} onClick={() => onSelect(ws)}>
              <div className="ws-card-accent" style={{ background: GRADIENTS[ws.gradient % GRADIENTS.length] }} />
              <div className="ws-name">{ws.name}</div>
              <div className="ws-desc">{ws.description || "Нет описания"}</div>
              <div className="ws-meta">
                <div className="ws-badge">
                  <span>📁</span>
                  <span>{ws.projectCount || 0} проектов</span>
                </div>
                {activeWs?.id === ws.id && <span className="badge badge-purple">Активное</span>}
              </div>
            </div>
          ))}
          <div className="add-card" onClick={onAdd}>
            <span style={{ fontSize: 22 }}>+</span>
            <span>Новое пространство</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PROJECTS PAGE ──────────────────────────────────────────────────────── */
function ProjectsPage({ projects, workspaces, onAdd, onEdit, onDelete }) {
  const fmt = d => d ? new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Проекты</div>
          <div className="page-sub">Управление проектами команды</div>
        </div>
        <button className="btn-new" onClick={onAdd}>
          <span>+</span> Новый проект
        </button>
      </div>
      <div className="content">
        <div className="proj-table">
          <div className="proj-table-head">
            <span>Название</span>
            <span>Описание</span>
            <span>Дедлайн</span>
            <span>Действия</span>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Нет проектов</div>
              <div className="empty-sub">Создайте первый проект, нажав кнопку выше</div>
            </div>
          ) : projects.map(p => (
            <div key={p.id} className="proj-row">
              <div className="proj-name">
                <div className="proj-dot" style={{ background: p.color }} />
                {p.name}
              </div>
              <div className="proj-desc">{p.description || "—"}</div>
              <div className="proj-date">{fmt(p.deadline)}</div>
              <div className="proj-actions">
                <button className="icon-btn" title="Редактировать" onClick={() => onEdit(p)}>✏</button>
                <button className="icon-btn danger" title="Удалить" onClick={() => onDelete(p)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("tf_session") || "null"));
  const [page, setPage] = useState("workspaces");
  const [workspaces, setWorkspaces] = useState(() => JSON.parse(localStorage.getItem("tf_workspaces") || "[]"));
  const [projects, setProjects] = useState(() => JSON.parse(localStorage.getItem("tf_projects") || "[]"));
  const [activeWs, setActiveWs] = useState(() => JSON.parse(localStorage.getItem("tf_active_ws") || "null"));
  const [modal, setModal] = useState(null); // null | 'ws' | 'proj' | 'editProj' | 'delProj'
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState(null);

  function saveWs(ws) { localStorage.setItem("tf_workspaces", JSON.stringify(ws)); setWorkspaces(ws); }
  function saveProj(pr) { localStorage.setItem("tf_projects", JSON.stringify(pr)); setProjects(pr); }

  function showToast(msg, type = "success") { setToast({ msg, type }); }

  function handleAuth(u) { localStorage.setItem("tf_session", JSON.stringify(u)); setUser(u); }
  function logout() { localStorage.removeItem("tf_session"); setUser(null); }

  function addWorkspace(data) {
    const ws = { id: Date.now(), ...data, projectCount: 0, ownerId: user.id };
    const next = [...workspaces, ws];
    saveWs(next);
    if (!activeWs) { setActiveWs(ws); localStorage.setItem("tf_active_ws", JSON.stringify(ws)); }
    setModal(null);
    showToast("Пространство создано!");
  }

  function selectWs(ws) {
    setActiveWs(ws);
    localStorage.setItem("tf_active_ws", JSON.stringify(ws));
    setPage("projects");
  }

  function addProject(data) {
    const p = { id: Date.now(), ...data };
    const next = [...projects, p];
    saveProj(next);
    const nextWs = workspaces.map(w => w.id === data.workspaceId ? { ...w, projectCount: (w.projectCount || 0) + 1 } : w);
    saveWs(nextWs);
    if (activeWs?.id === data.workspaceId) setActiveWs(ws => ({ ...ws, projectCount: (ws?.projectCount || 0) + 1 }));
    setModal(null);
    showToast("Проект создан!");
  }

  function editProject(data) {
    const next = projects.map(p => p.id === editTarget.id ? { ...p, ...data } : p);
    saveProj(next);
    setModal(null);
    setEditTarget(null);
    showToast("Проект обновлён!", "info");
  }

  function deleteProject() {
    const p = editTarget;
    const next = projects.filter(x => x.id !== p.id);
    saveProj(next);
    const nextWs = workspaces.map(w => w.id === p.workspaceId ? { ...w, projectCount: Math.max(0, (w.projectCount || 1) - 1) } : w);
    saveWs(nextWs);
    setModal(null);
    setEditTarget(null);
    showToast("Проект удалён.", "error");
  }

  const visibleProjects = activeWs ? projects.filter(p => p.workspaceId === activeWs.id) : projects;

  if (!user) return (
    <>
      <AuthPage onAuth={handleAuth} />
    </>
  );

  const initials = user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const NAV = [
    { id: "workspaces", icon: "⬡", label: "Пространства" },
    { id: "projects", icon: "📋", label: "Проекты" },
  ];

  return (
    <>
      <div className="shell">
        {/* SIDEBAR */}
        <nav className="sidebar">
          <div className="sidebar-logo">TaskFlow</div>

          <div style={{ padding: "12px 0 0" }}>
            <div className="sidebar-section">Навигация</div>
            {NAV.map(n => (
              <button key={n.id} className={`sidebar-item${page === n.id ? " active" : ""}`} onClick={() => setPage(n.id)}>
                <span className="icon">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>

          {activeWs && (
            <div style={{ padding: "12px 0 0" }}>
              <div className="sidebar-section">Активное пространство</div>
              <div style={{ margin: "4px 12px 0", padding: "10px 12px", background: "rgba(108,99,255,.08)",
                borderRadius: 8, border: "1px solid rgba(108,99,255,.2)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{activeWs.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{visibleProjects.length} проектов</div>
              </div>
            </div>
          )}

          <div className="sidebar-bottom">
            <div className="user-chip" onClick={logout} title="Выйти">
              <div className="avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <span style={{ fontSize: 14, color: "var(--text-dim)" }}>↩</span>
            </div>
          </div>
        </nav>

        {/* MAIN */}
        <div className="main">
          {page === "workspaces" && (
            <WorkspacesPage workspaces={workspaces} activeWs={activeWs}
              onSelect={selectWs} onAdd={() => setModal("ws")} />
          )}
          {page === "projects" && (
            <ProjectsPage projects={visibleProjects} workspaces={workspaces}
              onAdd={() => setModal("proj")}
              onEdit={p => { setEditTarget(p); setModal("editProj"); }}
              onDelete={p => { setEditTarget(p); setModal("delProj"); }} />
          )}
        </div>
      </div>

      {/* MODALS */}
      {modal === "ws" && <WorkspaceModal onSave={addWorkspace} onClose={() => setModal(null)} />}
      {modal === "proj" && (
        <ProjectModal workspaces={workspaces} onSave={addProject} onClose={() => setModal(null)} />
      )}
      {modal === "editProj" && editTarget && (
        <ProjectModal initial={editTarget} workspaces={workspaces} onSave={editProject} onClose={() => { setModal(null); setEditTarget(null); }} />
      )}
      {modal === "delProj" && editTarget && (
        <ConfirmModal
          title="Удалить проект?"
          text={`Проект «${editTarget.name}» будет удалён безвозвратно.`}
          onConfirm={deleteProject}
          onClose={() => { setModal(null); setEditTarget(null); }}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
