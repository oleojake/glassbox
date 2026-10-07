import { useMemo, useState, type DragEvent } from "react";
import { folderOf, type Note, type Project } from "../lib/content";
import { noteHref, projectHref, type Scope } from "../lib/router";
import { useI18n } from "../lib/i18n";

const DRAG_TYPE = "text/glassbox-note";

interface Node {
  name: string;
  path: string;
  folders: Node[];
  notes: Note[];
}

function buildTree(notes: Note[], folders: string[]): Node {
  const root: Node = { name: "", path: "", folders: [], notes: [] };
  const find = (path: string): Node => {
    let node = root;
    let acc = "";
    for (const part of path.split("/").filter(Boolean)) {
      acc = acc ? `${acc}/${part}` : part;
      let child = node.folders.find((f) => f.name === part);
      if (!child) {
        child = { name: part, path: acc, folders: [], notes: [] };
        node.folders.push(child);
      }
      node = child;
    }
    return node;
  };
  folders.forEach(find);
  notes.forEach((n) => find(folderOf(n.slug)).notes.push(n));
  const sort = (node: Node) => {
    node.folders.sort((a, b) => a.name.localeCompare(b.name));
    node.notes.sort((a, b) => a.title.localeCompare(b.title));
    node.folders.forEach(sort);
  };
  sort(root);
  return root;
}

interface Props {
  scope: Scope;
  notes: Note[];
  projects: Project[];
  folders: string[];
  activeSlug?: string;
  activeProject?: string;
  /** Without editing the tree is read-only (the demo): no drag and drop, no buttons. */
  editable: boolean;
  onMove: (slug: string, folder: string) => void;
  onNewNote: (folder: string) => void;
  onNewFolder: (parent: string) => void;
  onDeleteFolder: (folder: string) => void;
}

/** An IDE-style explorer: every project is a folder, with subfolders and notes inside. Notes outside any project are General. */
export function FolderTree({ scope, notes, projects, folders, activeSlug, activeProject, editable, onMove, onNewNote, onNewFolder, onDeleteFolder }: Props) {
  const { t } = useI18n();
  const tree = useMemo(() => buildTree(notes, folders), [notes, folders]);
  const projectNodes = useMemo(
    () => projects.map((p) => ({ project: p, node: tree.folders.find((f) => f.name === p.slug) ?? { name: p.slug, path: p.slug, folders: [], notes: [] } })),
    [projects, tree],
  );
  const general = useMemo(() => tree.folders.filter((f) => !projects.some((p) => p.slug === f.name)), [tree, projects]);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [over, setOver] = useState<string | null>(null);

  const toggle = (path: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (!next.delete(path)) next.add(path);
      return next;
    });

  const dropTarget = (folder: string) => !editable ? {} : ({
    onDragOver: (e: DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
      e.preventDefault();
      setOver(folder);
    },
    onDragLeave: () => setOver((cur) => (cur === folder ? null : cur)),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(null);
      const slug = e.dataTransfer.getData(DRAG_TYPE);
      if (slug) onMove(slug, folder);
    },
  });

  const renderNote = (n: Note) => (
    <a
      key={n.slug}
      className={`tree-note${activeSlug === n.slug ? " active" : ""}`}
      href={noteHref(n.slug, scope)}
      draggable={editable}
      onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, n.slug)}
    >
      {n.title}
    </a>
  );

  const renderFolder = (node: Node, project?: Project) => (
    <div key={node.path} className="tree-folder">
      <div className={`tree-row${over === node.path ? " over" : ""}${project && activeProject === project.slug ? " active" : ""}`} {...dropTarget(node.path)}>
        <button type="button" className="tree-arrow" onClick={() => toggle(node.path)} aria-expanded={!closed.has(node.path)} aria-label={node.name}>
          {closed.has(node.path) ? "▸" : "▾"}
        </button>
        {project ? (
          <a className="tree-toggle" href={projectHref(project.slug, scope)}>
            <i className="dot" style={{ background: project.color ?? "var(--accent)" }} /> {project.name}
          </a>
        ) : (
          <button type="button" className="tree-toggle" onClick={() => toggle(node.path)}>
            {node.name}
          </button>
        )}
        {editable && (
          <span className="tree-actions">
            <button type="button" title={t("tree.newNote")} aria-label={t("tree.newNote")} onClick={() => onNewNote(node.path)}>+</button>
            <button type="button" title={t("tree.newFolder")} aria-label={t("tree.newFolder")} onClick={() => onNewFolder(node.path)}>▤</button>
            {!project && <button type="button" title={t("tree.deleteFolder")} aria-label={t("tree.deleteFolder")} onClick={() => onDeleteFolder(node.path)}>×</button>}
          </span>
        )}
      </div>
      {!closed.has(node.path) && (
        <div className="tree-children">
          {node.folders.map((f) => renderFolder(f))}
          {node.notes.map(renderNote)}
        </div>
      )}
    </div>
  );

  return (
    <nav className="tree" aria-label={t("tree.title")}>
      <h4 className="side-title">{t("side.projects")}</h4>
      {projectNodes.map(({ project, node }) => renderFolder(node, project))}
      <div className={`tree-head${over === "" ? " over" : ""}`} {...dropTarget("")}>
        <h4 className="side-title">{t("side.general")}</h4>
        {editable && <button type="button" className="tree-add" onClick={() => onNewFolder("")}>{t("side.newFolder")}</button>}
      </div>
      {general.map((f) => renderFolder(f))}
      {tree.notes.map(renderNote)}
    </nav>
  );
}
