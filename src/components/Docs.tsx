import { useMemo } from "react";
import { LangSwitch, useI18n, type Key } from "../lib/i18n";
import { Markdown } from "./Markdown";

// Note content stays in English: it is the example being explained, not interface text.
const SECTIONS: { id: string; source: string }[] = [
  { id: "callout", source: "> [!REMEMBER]\n> **dispatch** announces that something happened.\n\n> [!WHEN]\n> Use it when only the final value matters.\n\n> [!CAUTION]\n> Never mutate the state directly." },
  { id: "steps", source: "```steps\n- title: Create the action\n  detail: It only describes what happened.\n- title: Dispatch it\n  file: src/Editor.tsx\n```" },
  { id: "files", source: "```files\nsrc/Editor.tsx — the component\nsrc/editorSlice.ts — the reducer\n```" },
  { id: "code", source: "```ts title=\"sum.ts\"\n// Adds two numbers.\nexport const sum = (a: number, b: number) => a + b;\n```" },
  { id: "compare", source: "| vs | Debounce | Throttle |\n|---|---|---|\n| Runs | after the burst ends | at most every N ms |\n| Good for | search boxes | scroll handlers |" },
  { id: "diagram", source: "```mermaid\nflowchart LR\n  A[Click] --> B[Dispatch] --> C[Reducer] --> D[New state]\n```" },
  { id: "links", source: "See [[event-loop]] to understand why this does not block." },
];

const fence = (src: string) => "````markdown\n" + src + "\n````";

export function Docs() {
  const { t } = useI18n();
  const options = useMemo(() => ({ titles: new Map([["event-loop", "The event loop"]]), noteHref: "#/demo/notes/", t }), [t]);
  return (
    <div className="landing docs">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="logo" aria-hidden="true" />
          Glassbox
        </a>
        <nav>
          <a href="#/demo">{t("nav.demo")}</a>
          <LangSwitch />
        </nav>
      </header>
      <h1 className="page-title">{t("docs.title")}</h1>
      <p className="lead">{t("docs.intro")}</p>
      {SECTIONS.map((sec) => (
        <section key={sec.id} className="doc-block">
          <h2>{t(`docs.${sec.id}.title` as Key)}</h2>
          <p>{t(`docs.${sec.id}.text` as Key)}</p>
          <div className="doc-pair">
            <div>
              <h4>{t("docs.write")}</h4>
              <Markdown source={fence(sec.source)} options={options} />
            </div>
            <div>
              <h4>{t("docs.see")}</h4>
              <Markdown source={sec.source} options={options} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
