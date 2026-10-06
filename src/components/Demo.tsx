import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { backlinks, demoProjects, searchNotes, splitFrontmatter, type Note, type Project } from "../lib/content";
import { noteHref, projectHref, type Route } from "../lib/router";
import { useNotes } from "../lib/useNotes";
import { Markdown } from "./Markdown";
import { REPO_URL } from "./Landing";

const NOTE_HREF = "#/demo/notes/";

export function Demo({ route }: { route: Exclude<Route, { name: "landing" }> }) {
  const { notes, save, create, reset, hasChanges } = useNotes();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const titles = useMemo(() => new Map(notes.map((n) => [n.slug, n.title])), [notes]);
  const results = useMemo(() => searchNotes(notes, query), [notes, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const note = route.name === "note" ? notes.find((n) => n.slug === route.slug) : undefined;
  const project = route.name === "project" ? demoProjects.find((p) => p.slug === route.slug) : undefined;

  return (
    <div className="app">
      <div className="demo-banner">
        <span>
          <strong>Demo mode.</strong> Changes stay in this browser. GitHub sync is coming next.
        </span>
        <span className="banner-actions">
          {hasChanges && (
            <button type="button" className="link" onClick={reset}>
              Reset demo
            </button>
          )}
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
            Get the code
          </a>
        </span>
      </div>

      <div className="layout">
        <aside className="sidebar">
          <a className="brand" href="#/">
            <span className="logo" aria-hidden="true" />
            Glassbox
          </a>
          <input
            ref={searchRef}
            className="search"
            type="search"
            placeholder="Search notes (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search notes"
          />
          <div className="side-head">
            <span>Notes</span>
            <button
              type="button"
              className="link"
              onClick={() => {
                const slug = create();
                window.location.hash = noteHref(slug) + "?edit";
              }}
            >
              + New
            </button>
          </div>
          <nav className="side-list">
            {results.map((n) => (
              <a key={n.slug} href={noteHref(n.slug)} className={note?.slug === n.slug ? "active" : ""}>
                {n.title}
              </a>
            ))}
            {!results.length && <p className="muted">No notes match.</p>}
          </nav>
          <div className="side-head">
            <span>Projects</span>
          </div>
          <nav className="side-list">
            {demoProjects.map((p) => (
              <a key={p.slug} href={projectHref(p.slug)} className={project?.slug === p.slug ? "active" : ""}>
                <i className="dot" style={{ background: p.color ?? "var(--accent)" }} />
                {p.name}
              </a>
            ))}
          </nav>
        </aside>

        <main className="main">
          {route.name === "demo" && <Home notes={results} query={query} />}
          {route.name === "note" &&
            (note ? (
              <NoteView key={note.slug} note={note} notes={notes} titles={titles} onSave={save} />
            ) : (
              <p className="muted">That note doesn't exist. <a href="#/demo">Back to all notes</a></p>
            ))}
          {route.name === "project" &&
            (project ? (
              <ProjectView project={project} notes={notes} titles={titles} />
            ) : (
              <p className="muted">That project doesn't exist. <a href="#/demo">Back to all notes</a></p>
            ))}
        </main>
      </div>
    </div>
  );
}

function Home({ notes, query }: { notes: Note[]; query: string }) {
  return (
    <>
      <h1>{query ? `Results for "${query}"` : "All notes"}</h1>
      <div className="cards">
        {notes.map((n) => (
          <a key={n.slug} className="card" href={noteHref(n.slug)}>
            <span className={`pill type-${n.type}`}>{n.type}</span>
            <h3>{n.title}</h3>
            <p>{n.summary}</p>
            <div className="tags">{n.tags.map((t) => <span key={t}>#{t}</span>)}</div>
          </a>
        ))}
      </div>
      {!notes.length && <p className="muted">No notes match your search.</p>}
    </>
  );
}

function NoteView({
  note,
  notes,
  titles,
  onSave,
}: {
  note: Note;
  notes: Note[];
  titles: Map<string, string>;
  onSave: (slug: string, raw: string) => void;
}) {
  const [editing, setEditing] = useState(() => window.location.hash.endsWith("?edit"));
  const [draft, setDraft] = useState(note.raw);
  const deferred = useDeferredValue(editing ? splitFrontmatter(draft).body : note.body);
  const noteProjects = demoProjects.filter((p) => note.projects.includes(p.slug));
  const repo = noteProjects.find((p) => p.repo)?.repo;
  const options = useMemo(() => ({ titles, noteHref: NOTE_HREF, repo }), [titles, repo]);
  const linkedFrom = useMemo(() => backlinks(notes, note.slug), [notes, note.slug]);

  const startEdit = () => {
    setDraft(note.raw);
    setEditing(true);
  };
  const saveEdit = () => {
    onSave(note.slug, draft);
    setEditing(false);
  };

  return (
    <article>
      <header className="note-head">
        <span className={`pill type-${note.type}`}>{note.type}</span>
        <h1>{note.title}</h1>
        <p className="lead">{note.summary}</p>
        <div className="meta">
          {note.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
          {noteProjects.map((p) => (
            <a key={p.slug} className="tag project" href={projectHref(p.slug)}>{p.name}</a>
          ))}
          {note.updated && <span className="muted">Updated {note.updated}</span>}
        </div>
        <div className="actions">
          {editing ? (
            <>
              <button type="button" className="btn primary small" onClick={saveEdit}>Save</button>
              <button type="button" className="btn small" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <button type="button" className="btn small" onClick={startEdit}>Edit</button>
          )}
        </div>
      </header>

      {editing ? (
        <div className="editor">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} aria-label="Markdown source" />
          <div className="editor-preview">
            <Markdown source={deferred} options={options} />
          </div>
        </div>
      ) : (
        <Markdown source={deferred} options={options} />
      )}

      {!editing && linkedFrom.length > 0 && (
        <footer className="backlinks">
          <h4>Mentioned in</h4>
          {linkedFrom.map((n) => <a key={n.slug} href={noteHref(n.slug)}>{n.title}</a>)}
        </footer>
      )}
    </article>
  );
}

function ProjectView({ project, notes, titles }: { project: Project; notes: Note[]; titles: Map<string, string> }) {
  const projectNotes = notes.filter((n) => n.projects.includes(project.slug));
  const options = useMemo(() => ({ titles, noteHref: NOTE_HREF, repo: project.repo }), [titles, project.repo]);
  return (
    <article>
      <header className="note-head">
        <span className="pill" style={{ background: project.color ?? "var(--accent)" }}>{project.status}</span>
        <h1>{project.name}</h1>
        <p className="lead">{project.description}</p>
        <div className="meta">
          {project.stack.map((s) => <span key={s} className="tag">{s}</span>)}
          {project.repo && <a className="tag project" href={project.repo} target="_blank" rel="noreferrer noopener">Repository</a>}
        </div>
      </header>
      <Markdown source={project.body} options={options} />
      <h2>Notes in this project</h2>
      <div className="cards">
        {projectNotes.map((n) => (
          <a key={n.slug} className="card" href={noteHref(n.slug)}>
            <span className={`pill type-${n.type}`}>{n.type}</span>
            <h3>{n.title}</h3>
            <p>{n.summary}</p>
          </a>
        ))}
      </div>
      {!projectNotes.length && <p className="muted">No notes linked to this project yet.</p>}
    </article>
  );
}
