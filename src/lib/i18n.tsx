import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "es";

const en = {
  "nav.demo": "Demo",
  "nav.github": "GitHub",
  "landing.eyebrow": "Notes for developers who build with AI",
  "landing.h1a": "Understand the code ",
  "landing.h1b": "your AI writes.",
  "landing.lead":
    "Glassbox keeps what you learn as clear, visual notes: diagrams, steps and code. They are plain Markdown files in a GitHub repo you own.",
  "landing.try": "Try the demo",
  "landing.viewGithub": "View on GitHub",
  "landing.fine": "No account needed. In the demo, your edits stay in your browser.",
  "landing.sampleExample": "Redux",
  "landing.f1.title": "Easy to scan",
  "landing.f1.text": "Every note has a type, tags and an optional project, so you can find it again in seconds.",
  "landing.f2.title": "Your repo, your notes",
  "landing.f2.text": "Each note is a file in a private GitHub repo. Every save is a commit: history and backups included.",
  "landing.f3.title": "Ready for AI",
  "landing.f3.text": "Put an INSTRUCTIONS.md in your notes repo and any AI assistant can write notes in the right format.",
  "landing.how": "How it works",
  "landing.s1.b": "Copy the template.",
  "landing.s1.t": " You get a private notes repo with the format and AI instructions inside.",
  "landing.s2.b": "Write notes",
  "landing.s2.t": " in the browser, or ask your AI to write them straight into the repo.",
  "landing.s3.b": "Read and review",
  "landing.s3.t": " them in Glassbox, with search, tags and projects.",
  "landing.next": "GitHub sign-in is the next milestone. For now the demo runs fully in your browser.",
  "landing.footer": "Open source, free to use and copy.",
  "demo.label": "Demo.",
  "demo.banner": " Your changes stay in this browser. GitHub sync is coming next.",
  "demo.reset": "Reset demo",
  "demo.getCode": "Get the code",
  "side.search": "Search (Ctrl+K)",
  "side.searchLabel": "Search notes",
  "side.new": "+ New note",
  "side.results": "Results",
  "side.noMatch": "No notes match.",
  "side.all": "All notes",
  "side.projects": "Projects",
  "side.general": "General",
  "home.title": "All notes",
  "home.resultsFor": "Results for",
  "home.all": "All",
  "home.noMatch": "No notes match these filters.",
  "home.filterType": "Filter by type",
  "home.filterTag": "Filter by tag",
  "note.missing": "That note doesn't exist.",
  "project.missing": "That project doesn't exist.",
  "back": "Back to all notes",
  "note.updated": "Updated",
  "note.edit": "Edit",
  "note.save": "Save",
  "note.cancel": "Cancel",
  "note.source": "Markdown source",
  "note.mentioned": "Mentioned in",
  "project.label": "Project",
  "project.repo": "Repository",
  "project.notes": "Notes in this project",
  "project.none": "No notes linked to this project yet.",
  "status.active": "active",
  "status.paused": "paused",
  "status.archived": "archived",
  "type.concept": "Concept",
  "type.recipe": "Recipe",
  "type.decision": "Decision",
  "type.reference": "Reference",
  "callout.remember": "Remember",
  "callout.when": "When to use",
  "callout.note": "Note",
  "callout.tip": "Tip",
  "callout.important": "Important",
  "callout.warning": "Warning",
  "callout.caution": "Caution",
  "code.copy": "Copy",
  "code.copied": "Copied",
  "link.broken": "No note named",
  "nav.connect": "Connect repo",
  "connect.title": "Connect your notes repo",
  "connect.intro": "Glassbox reads and saves your notes in a GitHub repository you own. Every save becomes a commit.",
  "connect.s1": "Create a private, empty repository on GitHub.",
  "connect.s1.link": "Create repository",
  "connect.s2": "Create a fine-grained token for that repository only, with the permission “Contents: Read and write”.",
  "connect.s2.link": "Create token",
  "connect.s3": "Paste the repository and the token here.",
  "connect.repo": "Repository (owner/name)",
  "connect.token": "Token",
  "connect.submit": "Connect",
  "connect.checking": "Checking…",
  "connect.privacy": "The token stays in this browser and is only sent to GitHub. Remove it any time with “Disconnect”.",
  "connect.err.repo": "Enter the repository as owner/name.",
  "connect.err.public": "This repository is public: anyone could read your notes. Use a private one.",
  "connect.err.push": "The token can read this repository but not write to it. Add the “Contents: Read and write” permission.",
  "connect.err.auth": "GitHub rejected the token or cannot find the repository.",
  "connect.err.generic": "Could not reach GitHub:",
  "connect.err.storage": "This browser blocked saving the token, so the connection would be lost on reload.",
  "demo.connected": "Connected to",
  "demo.disconnect": "Disconnect",
  "ws.loading": "Loading notes from GitHub…",
  "ws.error": "Could not load your repository:",
  "ws.retry": "Try again",
  "ws.empty": "Your repository has no notes yet. Create one, or ask your AI to add Markdown files to notes/ (see the format guide).",
  "ws.format": "Format guide",
  "note.saving": "Saving…",
  "note.saveError": "Could not save:",
  "note.conflict": "The note changed on GitHub. Reload and try again.",
} as const;

export type Key = keyof typeof en;

const es: Record<Key, string> = {
  "nav.demo": "Demo",
  "nav.github": "GitHub",
  "landing.eyebrow": "Apuntes para desarrolladores que programan con IA",
  "landing.h1a": "Entiende el código ",
  "landing.h1b": "que escribe tu IA.",
  "landing.lead":
    "Glassbox guarda lo que aprendes como apuntes claros y visuales: diagramas, pasos y código. Son archivos Markdown en un repositorio de GitHub que es tuyo.",
  "landing.try": "Prueba la demo",
  "landing.viewGithub": "Ver en GitHub",
  "landing.fine": "No hace falta cuenta. En la demo, tus cambios se quedan en tu navegador.",
  "landing.sampleExample": "Redux",
  "landing.f1.title": "Fácil de ojear",
  "landing.f1.text": "Cada apunte tiene tipo, etiquetas y un proyecto opcional, así que lo encuentras de nuevo en segundos.",
  "landing.f2.title": "Tu repo, tus apuntes",
  "landing.f2.text": "Cada apunte es un archivo en un repositorio privado de GitHub. Cada guardado es un commit: historial y copias incluidos.",
  "landing.f3.title": "Listo para la IA",
  "landing.f3.text": "Pon un INSTRUCTIONS.md en tu repo de apuntes y cualquier asistente de IA escribirá apuntes con el formato correcto.",
  "landing.how": "Cómo funciona",
  "landing.s1.b": "Copia la plantilla.",
  "landing.s1.t": " Obtienes un repo privado de apuntes con el formato y las instrucciones para la IA dentro.",
  "landing.s2.b": "Escribe apuntes",
  "landing.s2.t": " en el navegador, o pídele a tu IA que los escriba directamente en el repo.",
  "landing.s3.b": "Léelos y revísalos",
  "landing.s3.t": " en Glassbox, con búsqueda, etiquetas y proyectos.",
  "landing.next": "El inicio de sesión con GitHub es el siguiente hito. Por ahora la demo funciona entera en tu navegador.",
  "landing.footer": "Código abierto, libre para usar y copiar.",
  "demo.label": "Demo.",
  "demo.banner": " Tus cambios se quedan en este navegador. La sincronización con GitHub llegará pronto.",
  "demo.reset": "Restablecer demo",
  "demo.getCode": "Obtener el código",
  "side.search": "Buscar (Ctrl+K)",
  "side.searchLabel": "Buscar apuntes",
  "side.new": "+ Nuevo apunte",
  "side.results": "Resultados",
  "side.noMatch": "Ningún apunte coincide.",
  "side.all": "Todos los apuntes",
  "side.projects": "Proyectos",
  "side.general": "General",
  "home.title": "Todos los apuntes",
  "home.resultsFor": "Resultados para",
  "home.all": "Todos",
  "home.noMatch": "Ningún apunte coincide con estos filtros.",
  "home.filterType": "Filtrar por tipo",
  "home.filterTag": "Filtrar por etiqueta",
  "note.missing": "Ese apunte no existe.",
  "project.missing": "Ese proyecto no existe.",
  "back": "Volver a todos los apuntes",
  "note.updated": "Actualizado",
  "note.edit": "Editar",
  "note.save": "Guardar",
  "note.cancel": "Cancelar",
  "note.source": "Código Markdown",
  "note.mentioned": "Mencionado en",
  "project.label": "Proyecto",
  "project.repo": "Repositorio",
  "project.notes": "Apuntes de este proyecto",
  "project.none": "Todavía no hay apuntes enlazados a este proyecto.",
  "status.active": "activo",
  "status.paused": "en pausa",
  "status.archived": "archivado",
  "type.concept": "Concepto",
  "type.recipe": "Receta",
  "type.decision": "Decisión",
  "type.reference": "Referencia",
  "callout.remember": "Recuerda",
  "callout.when": "Cuándo usarlo",
  "callout.note": "Nota",
  "callout.tip": "Consejo",
  "callout.important": "Importante",
  "callout.warning": "Aviso",
  "callout.caution": "Cuidado",
  "code.copy": "Copiar",
  "code.copied": "Copiado",
  "link.broken": "No existe ningún apunte llamado",
  "nav.connect": "Conectar repo",
  "connect.title": "Conecta tu repo de apuntes",
  "connect.intro": "Glassbox lee y guarda tus apuntes en un repositorio de GitHub que es tuyo. Cada guardado se convierte en un commit.",
  "connect.s1": "Crea un repositorio privado y vacío en GitHub.",
  "connect.s1.link": "Crear repositorio",
  "connect.s2": "Crea un token de acceso detallado solo para ese repositorio, con el permiso “Contents: Read and write”.",
  "connect.s2.link": "Crear token",
  "connect.s3": "Pega aquí el repositorio y el token.",
  "connect.repo": "Repositorio (usuario/nombre)",
  "connect.token": "Token",
  "connect.submit": "Conectar",
  "connect.checking": "Comprobando…",
  "connect.privacy": "El token se queda en este navegador y solo se envía a GitHub. Puedes borrarlo cuando quieras con “Desconectar”.",
  "connect.err.repo": "Escribe el repositorio como usuario/nombre.",
  "connect.err.public": "Este repositorio es público: cualquiera podría leer tus apuntes. Usa uno privado.",
  "connect.err.push": "El token puede leer este repositorio pero no escribir. Añade el permiso “Contents: Read and write”.",
  "connect.err.auth": "GitHub ha rechazado el token o no encuentra el repositorio.",
  "connect.err.generic": "No se pudo conectar con GitHub:",
  "connect.err.storage": "Este navegador ha bloqueado guardar el token, así que la conexión se perdería al recargar.",
  "demo.connected": "Conectado a",
  "demo.disconnect": "Desconectar",
  "ws.loading": "Cargando apuntes desde GitHub…",
  "ws.error": "No se pudo cargar tu repositorio:",
  "ws.retry": "Reintentar",
  "ws.empty": "Tu repositorio aún no tiene apuntes. Crea uno o pídele a tu IA que añada archivos Markdown en notes/ (mira la guía de formato).",
  "ws.format": "Guía de formato",
  "note.saving": "Guardando…",
  "note.saveError": "No se pudo guardar:",
  "note.conflict": "El apunte ha cambiado en GitHub. Recarga e inténtalo de nuevo.",
};

const dictionaries: Record<Lang, Record<Key, string>> = { en, es };
const STORAGE_KEY = "glassbox-lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch {
    // Storage can be unavailable; fall back to the browser language.
  }
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: Key) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }, []);

  const value = useMemo<I18n>(() => ({ lang, setLang, t: (key) => dictionaries[lang][key] }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(Ctx);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <span className="lang" role="group" aria-label="Language">
      {(["en", "es"] as const).map((l) => (
        <button key={l} type="button" className={l === lang ? "on" : ""} aria-pressed={l === lang} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  );
}
