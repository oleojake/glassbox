import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { backlinks, demoProjects, searchNotes, splitFrontmatter, type Note, type NoteType, type Project } from "../lib/content";
import { noteHref, projectHref, tagHref, typeHref, type Route } from "../lib/router";
import { useNotes } from "../lib/useNotes";
import { LangSwitch, useI18n, type Key } from "../lib/i18n";
import { Markdown } from "./Markdown";
import { REPO_URL } from "./Landing";

const NOTE_HREF = "#/demo/notes/";
const TYPES: NoteType[] = ["concept", "recipe", "decision", "reference"];

export function Demo({ route }: { route: Exclude<Route, { name: "landing" }> }) {
  const { t } = useI18n();
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
  const general = notes.filter((n) => n.projects.length === 0);

  const link = (n: Note) => (
    <a key={n.slug} href={noteHref(n.slug)} className={note?.slug === n.slug ? "active" : ""}>
      {n.title}
    </a>
  );

  return (
    <div className="app">
      <div className="demo-banner">
        <span>
          <strong>{t("demo.label")}</strong>{t("demo.banner")}
        </span>
        <span className="banner-actions">
          {hasChanges && (
            <button type="button" className="link" onClick={reset}>
              {t("demo.reset")}
            </button>
          )}
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
            {t("demo.getCode")}
          </a>
          <LangSwitch />
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
            placeholder={t("side.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("side.searchLabel")}
          />
          <button
            type="button"
            className="new"
            onClick={() => {
              const slug = create();
              window.location.hash = noteHref(slug) + "?edit";
            }}
          >
            {t("side.new")}
          </button>

          {query ? (
            <nav className="side-group">
              <h4>{t("side.results")}</h4>
              {results.map(link)}
              {!results.length && <p className="muted">{t("side.noMatch")}</p>}
            </nav>
          ) : (
            <>
              <nav className="side-group">
                <h4>
                  <a href="#/demo">{t("side.all")}</a>
                  <span>{notes.length}</span>
                </h4>
              </nav>
              <h4 className="side-title">{t("side.projects")}</h4>
              {demoProjects.map((p) => (
                <nav key={p.slug} className="side-group">
                  <a className={`side-project${project?.slug === p.slug ? " active" : ""}`} href={projectHref(p.slug)}>
                    <i className="dot" style={{ background: p.color ?? "var(--accent)" }} />
                    {p.name}
                  </a>
                  {notes.filter((n) => n.projects.includes(p.slug)).map(link)}
                </nav>
              ))}
              <h4 className="side-title">{t("side.general")}</h4>
              <nav className="side-group">{general.map(link)}</nav>
            </>
          )}
        </aside>

        <main className="main" key={route.name === "demo" ? "home" : "slug" in route ? route.slug : "x"}>
          {route.name === "demo" && <Home notes={results} query={query} tag={route.tag} type={route.type} />}
          {route.name === "note" &&
            (note ? (
              <NoteView key={note.slug} note={note} notes={notes} titles={titles} onSave={save} />
            ) : (
              <p className="muted">{t("note.missing")} <a href="#/demo">{t("back")}</a></p>
            ))}
          {route.name === "project" &&
            (project ? (
              <ProjectView project={project} notes={notes} titles={titles} />
            ) : (
              <p className="muted">{t("project.missing")} <a href="#/demo">{t("back")}</a></p>
            ))}
        </main>
      </div>
    </div>
  );
}

function typeLabel(t: (key: Key) => string, type: NoteType): string {
  return t(`type.${type}` as Key);
}

function NoteRow({ n }: { n: Note }) {
  const { t } = useI18n();
  const projects = demoProjects.filter((p) => n.projects.includes(p.slug));
  return (
    <a className="row" href={noteHref(n.slug)}>
      <span className={`kind kind-${n.type}`}>{typeLabel(t, n.type)}</span>
      <span className="row-main">
        <strong>{n.title}</strong>
        <span className="row-summary">{n.summary}</span>
        <span className="row-meta">
          {projects.map((p) => p.name).join(", ") || t("side.general")}
          {n.tags.length > 0 && <> · {n.tags.map((tg) => `#${tg}`).join(" ")}</>}
        </span>
      </span>
    </a>
  );
}

function Home({ notes, query, tag, type }: { notes: Note[]; query: string; tag?: string; type?: string }) {
  const { t } = useI18n();
  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes]);
  const shown = notes.filter((n) => (!type || n.type === type) && (!tag || n.tags.includes(tag)));
  return (
    <>
      <h1 className="page-title">{query ? `${t("home.resultsFor")} “${query}”` : t("home.title")}</h1>
      <div className="filters" aria-label={t("home.filterType")}>
        <a className={!type ? "chip on" : "chip"} href={tag ? tagHref(tag) : "#/demo"}>{t("home.all")}</a>
        {TYPES.map((ty) => (
          <a key={ty} className={type === ty ? "chip on" : "chip"} href={typeHref(ty)}>{typeLabel(t, ty)}</a>
        ))}
      </div>
      <div className="filters" aria-label={t("home.filterTag")}>
        {allTags.map((tg) => (
          <a key={tg} className={tag === tg ? "chip tag on" : "chip tag"} href={tag === tg ? "#/demo" : tagHref(tg)}>#{tg}</a>
        ))}
      </div>
      <div className="rows">{shown.map((n) => <NoteRow key={n.slug} n={n} />)}</div>
      {!shown.length && <p className="muted">{t("home.noMatch")}</p>}
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
  const { t } = useI18n();
  const [editing, setEditing] = useState(() => window.location.hash.endsWith("?edit"));
  const [draft, setDraft] = useState(note.raw);
  const deferred = useDeferredValue(editing ? splitFrontmatter(draft).body : note.body);
  const noteProjects = demoProjects.filter((p) => note.projects.includes(p.slug));
  const repo = noteProjects.find((p) => p.repo)?.repo;
  const options = useMemo(() => ({ titles, noteHref: NOTE_HREF, repo, t }), [titles, repo, t]);
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
        <div className="eyebrow-row">
          <a className={`kind kind-${note.type}`} href={typeHref(note.type)}>{typeLabel(t, note.type)}</a>
          {noteProjects.map((p) => (
            <a key={p.slug} className="proj" href={projectHref(p.slug)}>
              <i className="dot" style={{ background: p.color ?? "var(--accent)" }} />
              {p.name}
            </a>
          ))}
          {!noteProjects.length && <span className="proj muted">{t("side.general")}</span>}
        </div>
        <h1>{note.title}</h1>
        <p className="lead">{note.summary}</p>
        <div className="meta">
          {note.tags.map((tg) => <a key={tg} className="chip tag" href={tagHref(tg)}>#{tg}</a>)}
          {note.updated && <span className="muted">{t("note.updated")} {note.updated}</span>}
          <span className="spacer" />
          {editing ? (
            <>
              <button type="button" className="btn primary small" onClick={saveEdit}>{t("note.save")}</button>
              <button type="button" className="btn small" onClick={() => setEditing(false)}>{t("note.cancel")}</button>
            </>
          ) : (
            <button type="button" className="btn small" onClick={startEdit}>{t("note.edit")}</button>
          )}
        </div>
      </header>

      {editing ? (
        <div className="editor">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} aria-label={t("note.source")} />
          <div className="editor-preview">
            <Markdown source={deferred} options={options} />
          </div>
        </div>
      ) : (
        <Markdown source={deferred} options={options} />
      )}

      {!editing && linkedFrom.length > 0 && (
        <footer className="backlinks">
          <h4>{t("note.mentioned")}</h4>
          {linkedFrom.map((n) => <a key={n.slug} href={noteHref(n.slug)}>{n.title}</a>)}
        </footer>
      )}
    </article>
  );
}

function ProjectView({ project, notes, titles }: { project: Project; notes: Note[]; titles: Map<string, string> }) {
  const { t } = useI18n();
  const projectNotes = notes.filter((n) => n.projects.includes(project.slug));
  const options = useMemo(() => ({ titles, noteHref: NOTE_HREF, repo: project.repo, t }), [titles, project.repo, t]);
  return (
    <article>
      <header className="note-head">
        <div className="eyebrow-row">
          <span className="kind kind-project">{t("project.label")} · {t(`status.${project.status}` as Key)}</span>
        </div>
        <h1>{project.name}</h1>
        <p className="lead">{project.description}</p>
        <div className="meta">
          {project.stack.map((s) => <span key={s} className="chip">{s}</span>)}
          {project.repo && <a className="chip tag" href={project.repo} target="_blank" rel="noreferrer noopener">{t("project.repo")}</a>}
        </div>
      </header>
      <Markdown source={project.body} options={options} />
      <h2 className="section-title">{t("project.notes")}</h2>
      <div className="rows">{projectNotes.map((n) => <NoteRow key={n.slug} n={n} />)}</div>
      {!projectNotes.length && <p className="muted">{t("project.none")}</p>}
    </article>
  );
}
