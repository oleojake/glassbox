import { useMemo, useState, type DragEvent } from "react";
import { folderOf, type Note } from "../lib/content";
import { noteHref, type Scope } from "../lib/router";
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
  folders: string[];
  activeSlug?: string;
  onMove: (slug: string, folder: string) => void;
  onNewNote: (folder: string) => void;
  onNewFolder: (parent: string) => void;
  onDeleteFolder: (folder: string) => void;
}

/** An IDE-style explorer: folders can be created, notes dragged between them. */
export function FolderTree({ scope, notes, folders, activeSlug, onMove, onNewNote, onNewFolder, onDeleteFolder }: Props) {
  const { t } = useI18n();
  const tree = useMemo(() => buildTree(notes, folders), [notes, folders]);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [over, setOver] = useState<string | null>(null);

  const toggle = (path: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (!next.delete(path)) next.add(path);
      return next;
    });

  const dropTarget = (folder: string) => ({
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
      draggable
      onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, n.slug)}
    >
      {n.title}
    </a>
  );

  const renderFolder = (node: Node) => (
    <div key={node.path} className="tree-folder">
      <div className={`tree-row${over === node.path ? " over" : ""}`} {...dropTarget(node.path)}>
        <button type="button" className="tree-toggle" onClick={() => toggle(node.path)} aria-expanded={!closed.has(node.path)}>
          <span aria-hidden="true">{closed.has(node.path) ? "▸" : "▾"}</span> {node.name}
        </button>
        <span className="tree-actions">
          <button type="button" title={t("tree.newNote")} aria-label={t("tree.newNote")} onClick={() => onNewNote(node.path)}>+</button>
          <button type="button" title={t("tree.newFolder")} aria-label={t("tree.newFolder")} onClick={() => onNewFolder(node.path)}>▤</button>
          <button type="button" title={t("tree.deleteFolder")} aria-label={t("tree.deleteFolder")} onClick={() => onDeleteFolder(node.path)}>×</button>
        </span>
      </div>
      {!closed.has(node.path) && (
        <div className="tree-children">
          {node.folders.map(renderFolder)}
          {node.notes.map(renderNote)}
        </div>
      )}
    </div>
  );

  return (
    <nav className="tree" aria-label={t("tree.title")}>
      <div className={`tree-head${over === "" ? " over" : ""}`} {...dropTarget("")}>
        <h4 className="side-title">{t("tree.title")}</h4>
        <button type="button" className="tree-add" onClick={() => onNewFolder("")}>{t("side.newFolder")}</button>
      </div>
      {tree.folders.map(renderFolder)}
      {tree.notes.map(renderNote)}
    </nav>
  );
}
