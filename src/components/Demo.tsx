import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { SUGGESTED_TYPES, backlinks, baseOf, folderOf, searchNotes, splitFrontmatter, type Note, type NoteType, type Project } from "../lib/content";
import { homeHref, noteHref, projectHref, tagHref, typeHref, type Route, type Scope } from "../lib/router";
import { useWorkspace } from "../lib/useWorkspace";
import { GitHubError } from "../lib/github";
import { LangSwitch, useI18n, type Key } from "../lib/i18n";
import { Markdown } from "./Markdown";
import { REPO_URL } from "./Landing";
import { AiGuide } from "./AiGuide";
import { FolderTree } from "./FolderTree";
import { cleanFolderPath } from "../lib/useWorkspace";

const TYPES: readonly NoteType[] = SUGGESTED_TYPES;

export function Demo({ route }: { route: Exclude<Route, { name: "landing" | "connect" | "docs" }> }) {
  const { t } = useI18n();
  const scope: Scope = route.scope;
  const { mode, connected, repo, status, error, notes, projects, save, create, remove, createProject, folders, createFolder, moveNote, removeFolder, reset, reload, hasChanges } = useWorkspace(scope);
  useEffect(() => {
    if (scope === "mine" && !connected) window.location.hash = "#/connect";
  }, [scope, connected]);
  const fail = (err: unknown) => window.alert(`${t("note.saveError")} ${err instanceof Error ? err.message : String(err)}`);
  const treeActions = {
    onMove: async (slug: string, folder: string) => {
      try {
        const next = await moveNote?.(slug, folder);
        if (next && next !== slug && note?.slug === slug) window.location.hash = noteHref(next, scope);
      } catch (err) {
        fail(err);
      }
    },
    onNewNote: (folder: string) => {
      window.location.hash = noteHref(create(folder), scope) + "?edit";
    },
    onNewFolder: async (parent: string) => {
      const name = window.prompt(t("side.newFolderPrompt"))?.trim();
      const path = name ? cleanFolderPath(parent ? `${parent}/${name}` : name) : "";
      if (!path) return;
      try {
        await createFolder?.(path);
      } catch (err) {
        fail(err);
      }
    },
    onDeleteFolder: async (folder: string) => {
      const count = notes.filter((n) => n.slug.startsWith(`${folder}/`)).length;
      if (!window.confirm(t("tree.deleteConfirm").replace("{n}", String(count)).replace("{folder}", folder))) return;
      try {
        await removeFolder?.(folder);
      } catch (err) {
        fail(err);
      }
    },
  };
  const disconnect = () => {
    reset();
    window.location.hash = "#/";
  };
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  // Links may use the file name alone, so every note is known by its path and by its name.
  const titles = useMemo(() => {
    const map = new Map(notes.map((n) => [n.slug, n.title]));
    for (const n of notes) if (!map.has(baseOf(n.slug))) map.set(baseOf(n.slug), n.title);
    return map;
  }, [notes]);
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

  const note = route.name === "note" ? (notes.find((n) => n.slug === route.slug) ?? notes.find((n) => baseOf(n.slug) === route.slug)) : undefined;
  const project = route.name === "project" ? projects.find((p) => p.slug === route.slug) : undefined;

  const link = (n: Note) => (
    <a key={n.slug} href={noteHref(n.slug, scope)} className={note?.slug === n.slug ? "active" : ""}>
      {n.title}
    </a>
  );

  return (
    <div className={`app scope-${scope}`}>
      <div className={`demo-banner ${scope === "mine" ? "is-mine" : "is-demo"}`}>
        <span>
          {scope === "mine" ? (
            <>
              <strong>{t("mine.label")}</strong> {repo} · {t("mine.banner")}
            </>
          ) : (
            <>
              <strong>{t("demo.label")}</strong>
              {t("demo.banner")}
            </>
          )}
        </span>
        <span className="banner-actions">
          {scope === "mine" && (
            <button type="button" className="link" onClick={disconnect}>
              {t("demo.disconnect")}
            </button>
          )}
          {scope === "demo" && hasChanges && (
            <button type="button" className="link" onClick={reset}>
              {t("demo.reset")}
            </button>
          )}
          {scope === "demo" && (
            <a href={connected ? homeHref("mine") : "#/connect"}>{connected ? t("nav.mine") : t("demo.connectCta")}</a>
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
            <span className={`scope-tag ${scope}`}>{scope === "mine" ? t("mine.tag") : t("demo.tag")}</span>
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
              window.location.hash = noteHref(slug, scope) + "?edit";
            }}
          >
            {t("side.new")}
          </button>

          {createProject && (
            <button
              type="button"
              className="new"
              onClick={async () => {
                const name = window.prompt(t("side.newProjectPrompt"))?.trim();
                if (!name) return;
                try {
                  window.location.hash = projectHref(await createProject(name), scope);
                } catch (err) {
                  window.alert(`${t("note.saveError")} ${err instanceof Error ? err.message : String(err)}`);
                }
              }}
            >
              {t("side.newProject")}
            </button>
          )}

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
                  <a href={homeHref(scope)}>{t("side.all")}</a>
                  <span>{notes.length}</span>
                </h4>
              </nav>
              <FolderTree
                scope={scope}
                notes={notes}
                projects={projects}
                folders={folders}
                activeSlug={note?.slug}
                activeProject={project?.slug}
                editable={scope === "mine"}
                {...treeActions}
              />
            </>
          )}
          {scope === "demo" && (
            <a className="side-docs" href="#/demo/docs">
              {t("demo.docsLink")}
            </a>
          )}
          {scope === "mine" && notes.length > 0 && <AiGuide repo={repo ?? ""} />}
        </aside>

        <main className="main" key={route.name === "demo" ? "home" : "slug" in route ? route.slug : "x"}>
          {status === "loading" && <p className="muted">{t("ws.loading")}</p>}
          {status === "error" && (
            <p className="muted">
              {t("ws.error")} {error}{" "}
              <button type="button" className="link" onClick={reload}>
                {t("ws.retry")}
              </button>
            </p>
          )}
          {status === "ready" && scope === "mine" && notes.length === 0 && route.name === "demo" && (
            <div className="empty">
              <p>{t("ws.empty")}</p>
              <AiGuide repo={repo ?? ""} />
            </div>
          )}
          {status === "ready" && route.name === "demo" && <Home scope={scope} notes={results} projects={projects} query={query} tag={route.tag} type={route.type} />}
          {status === "ready" && route.name === "note" &&
            (note ? (
              <NoteView key={note.slug} scope={scope} note={note} notes={notes} projects={projects} titles={titles} onSave={save} onDelete={remove} folders={folders} onMove={moveNote} />
            ) : (
              <p className="muted">{t("note.missing")} <a href={homeHref(scope)}>{t("back")}</a></p>
            ))}
          {status === "ready" && route.name === "project" &&
            (project ? (
              <ProjectView scope={scope} project={project} folder={route.folder} folders={folders} notes={notes} projects={projects} titles={titles} />
            ) : (
              <p className="muted">{t("project.missing")} <a href={homeHref(scope)}>{t("back")}</a></p>
            ))}
        </main>
      </div>
    </div>
  );
}

function typeLabel(t: (key: Key) => string, type: NoteType): string {
  // Custom types have no translation: show the label as written.
  return t(`type.${type}` as Key) || type.charAt(0).toUpperCase() + type.slice(1);
}

const kindClass = (type: NoteType) => `kind-${type.replace(/[^a-z0-9-]/g, "")}`;

function NoteRow({ n, allProjects, scope }: { n: Note; allProjects: Project[]; scope: Scope }) {
  const { t } = useI18n();
  const projects = allProjects.filter((p) => n.projects.includes(p.slug));
  return (
    <a className="row" href={noteHref(n.slug, scope)}>
      <span className={`kind ${kindClass(n.type)}`}>{typeLabel(t, n.type)}</span>
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

function Home({ scope, notes, projects, query, tag, type }: { scope: Scope; notes: Note[]; projects: Project[]; query: string; tag?: string; type?: string }) {
  const { t } = useI18n();
  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes]);
  const types = useMemo(() => [...TYPES, ...[...new Set(notes.map((n) => n.type))].filter((ty) => !TYPES.includes(ty)).sort()], [notes]);
  const shown = notes.filter((n) => (!type || n.type === type) && (!tag || n.tags.includes(tag)));
  return (
    <>
      {scope === "demo" && !query && !tag && !type && (
        <section className="types-intro">
          <h2>{t("demo.types")}</h2>
          <p>{t("demo.typesIntro")}</p>
          <div className="types-grid">
            {TYPES.map((ty) => (
              <a key={ty} href={typeHref(ty, scope)} className={`type-card ${kindClass(ty)}`}>
                <strong>{typeLabel(t, ty)}</strong>
                <span>{t(`type.${ty}.desc` as Key)}</span>
              </a>
            ))}
          </div>
          <a href="#/demo/docs">{t("demo.docsLink")} →</a>
        </section>
      )}
      <h1 className="page-title">{query ? `${t("home.resultsFor")} “${query}”` : t("home.title")}</h1>
      <div className="filters" aria-label={t("home.filterType")}>
        <a className={!type ? "chip on" : "chip"} href={tag ? tagHref(tag, scope) : homeHref(scope)}>{t("home.all")}</a>
        {types.map((ty) => (
          <a key={ty} className={type === ty ? "chip on" : "chip"} href={typeHref(ty, scope)}>{typeLabel(t, ty)}</a>
        ))}
      </div>
      <div className="filters" aria-label={t("home.filterTag")}>
        {allTags.map((tg) => (
          <a key={tg} className={tag === tg ? "chip tag on" : "chip tag"} href={tag === tg ? homeHref(scope) : tagHref(tg, scope)}>#{tg}</a>
        ))}
      </div>
      <div className="rows">{shown.map((n) => <NoteRow key={n.slug} n={n} allProjects={projects} scope={scope} />)}</div>
      {!shown.length && <p className="muted">{t("home.noMatch")}</p>}
    </>
  );
}

function NoteView({
  scope,
  note,
  notes,
  projects,
  titles,
  onSave,
  onDelete,
  folders,
  onMove,
}: {
  scope: Scope;
  note: Note;
  notes: Note[];
  projects: Project[];
  titles: Map<string, string>;
  onSave: (slug: string, raw: string) => Promise<void>;
  onDelete?: (slug: string) => Promise<void>;
  folders: string[];
  onMove?: (slug: string, folder: string) => Promise<string>;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(() => window.location.hash.endsWith("?edit"));
  const [draft, setDraft] = useState(note.raw);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const deferred = useDeferredValue(editing ? splitFrontmatter(draft).body : note.body);
  const noteProjects = projects.filter((p) => note.projects.includes(p.slug));
  const repo = noteProjects.find((p) => p.repo)?.repo;
  const options = useMemo(() => ({ titles, noteHref: noteHref("", scope), repo, t }), [titles, repo, scope, t]);
  const linkedFrom = useMemo(() => backlinks(notes, note.slug), [notes, note.slug]);

  const startEdit = () => {
    setDraft(note.raw);
    setEditing(true);
  };
  const saveEdit = async () => {
    setSaving(true);
    setSaveError(undefined);
    try {
      await onSave(note.slug, draft);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof GitHubError && err.status === 409 ? t("note.conflict") : `${t("note.saveError")} ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const moveTo = async (folder: string) => {
    if (!onMove) return;
    try {
      const next = await onMove(note.slug, folder);
      window.location.hash = noteHref(next, scope);
    } catch (err) {
      setSaveError(`${t("note.saveError")} ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const folderChoices = useMemo(() => [...new Set([...folders, ...notes.map((n) => folderOf(n.slug))].filter(Boolean))].sort(), [folders, notes]);

  const deleteNote = async () => {
    if (!onDelete || !window.confirm(t("note.deleteConfirm"))) return;
    try {
      await onDelete(note.slug);
      window.location.hash = homeHref(scope);
    } catch (err) {
      setSaveError(`${t("note.saveError")} ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <article>
      <header className="note-head">
        <div className="eyebrow-row">
          <a className={`kind ${kindClass(note.type)}`} href={typeHref(note.type, scope)}>{typeLabel(t, note.type)}</a>
          {noteProjects.map((p) => (
            <a key={p.slug} className="proj" href={projectHref(p.slug, scope)}>
              <i className="dot" style={{ background: p.color ?? "var(--accent)" }} />
              {p.name}
            </a>
          ))}
          {!noteProjects.length && <span className="proj muted">{t("side.general")}</span>}
        </div>
        <h1>{note.title}</h1>
        <p className="lead">{note.summary}</p>
        <div className="meta">
          {note.tags.map((tg) => <a key={tg} className="chip tag" href={tagHref(tg, scope)}>#{tg}</a>)}
          {note.updated && <span className="muted">{t("note.updated")} {note.updated}</span>}
          <span className="spacer" />
          {editing ? (
            <>
              <button type="button" className="btn primary small" onClick={saveEdit} disabled={saving}>{saving ? t("note.saving") : t("note.save")}</button>
              <button type="button" className="btn small" onClick={() => setEditing(false)} disabled={saving}>{t("note.cancel")}</button>
            </>
          ) : (
            <>
              <button type="button" className="btn small" onClick={startEdit}>{t("note.edit")}</button>
              {onMove && (
                <label className="folder-select">
                  {t("note.folder")}
                  <select value={folderOf(note.slug)} onChange={(e) => moveTo(e.target.value)}>
                    <option value="">{t("note.rootFolder")}</option>
                    {folderChoices.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {onDelete && <button type="button" className="btn small danger" onClick={deleteNote}>{t("note.delete")}</button>}
            </>
          )}
        </div>
      </header>

      {saveError && <p className="error" role="alert">{saveError}</p>}
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
          {linkedFrom.map((n) => <a key={n.slug} href={noteHref(n.slug, scope)}>{n.title}</a>)}
        </footer>
      )}
    </article>
  );
}

function ProjectView({
  scope,
  project,
  folder,
  folders,
  notes,
  projects,
  titles,
}: {
  scope: Scope;
  project: Project;
  folder: string;
  folders: string[];
  notes: Note[];
  projects: Project[];
  titles: Map<string, string>;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const projectNotes = useMemo(() => notes.filter((n) => n.projects.includes(project.slug)), [notes, project.slug]);
  const options = useMemo(() => ({ titles, noteHref: noteHref("", scope), repo: project.repo, t }), [titles, project.repo, scope, t]);

  // Paths below are relative to the project folder. Notes linked only from their frontmatter count as top level.
  const prefix = `${project.slug}/`;
  const rel = (n: Note) => (n.slug.startsWith(prefix) ? n.slug.slice(prefix.length) : baseOf(n.slug));
  const here = folder ? `${folder}/` : "";
  const insideFolder = projectNotes.filter((n) => rel(n).startsWith(here));
  const subfolders = useMemo(() => {
    const names = new Map<string, number>();
    const add = (path: string, count: number) => {
      if (!path.startsWith(here) || path === here.slice(0, -1)) return;
      const seg = path.slice(here.length).split("/")[0];
      if (seg) names.set(seg, (names.get(seg) ?? 0) + count);
    };
    folders.filter((f) => f.startsWith(prefix)).forEach((f) => add(f.slice(prefix.length), 0));
    projectNotes.forEach((n) => {
      const dir = folderOf(rel(n));
      if (dir) add(dir, 1);
    });
    return [...names.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [folders, projectNotes, here]);
  const shown = query ? searchNotes(projectNotes, query) : insideFolder;
  const crumbs = folder.split("/").filter(Boolean);

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
      {!folder && !query && <Markdown source={project.body} options={options} />}

      <input
        className="search project-search"
        type="search"
        placeholder={t("project.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t("project.search")}
      />

      {!query && (
        <>
          <nav className="crumbs" aria-label="Folder">
            <a href={projectHref(project.slug, scope)}>{project.name}</a>
            {crumbs.map((c, i) => (
              <span key={i}>
                {" › "}
                {i === crumbs.length - 1 ? c : <a href={projectHref(project.slug, scope, crumbs.slice(0, i + 1).join("/"))}>{c}</a>}
              </span>
            ))}
          </nav>
          {subfolders.length > 0 && (
            <div className="folder-cards">
              {subfolders.map(([name, count]) => (
                <a key={name} className="folder-card" href={projectHref(project.slug, scope, `${here}${name}`)}>
                  <strong>{name}</strong>
                  <span>{count} {count === 1 ? t("project.noteOne") : t("project.notesCount")}</span>
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="section-title">{query ? `${t("home.resultsFor")} “${query}”` : folder ? crumbs[crumbs.length - 1] : t("project.notes")}</h2>
      <div className="rows">{shown.map((n) => <NoteRow key={n.slug} n={n} allProjects={projects} scope={scope} />)}</div>
      {!shown.length && <p className="muted">{t("project.none")}</p>}
    </article>
  );
}
