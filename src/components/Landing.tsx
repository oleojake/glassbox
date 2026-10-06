import { useMemo } from "react";
import { LangSwitch, useI18n } from "../lib/i18n";
import { Markdown } from "./Markdown";

export const REPO_URL = "https://github.com/oleojake/glassbox";

// Sample note content stays in English: it is note content, not interface text.
const HERO_NOTE = `> [!REMEMBER]
> **dispatch** announces that something happened. The **reducer** decides the new state.

\`\`\`steps
- title: Create the action
  detail: It only describes what happened.
- title: Dispatch it from the component
  file: src/Editor.tsx
- title: Let the reducer update the state
  file: src/editorSlice.ts
\`\`\`
`;

export function Landing() {
  const { t } = useI18n();
  const heroOptions = useMemo(() => ({ titles: new Map<string, string>(), noteHref: "#/demo/notes/", t }), [t]);

  return (
    <div className="landing">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="logo" aria-hidden="true" />
          Glassbox
        </a>
        <nav>
          <a href="#/demo">{t("nav.demo")}</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
            {t("nav.github")}
          </a>
          <LangSwitch />
        </nav>
      </header>

      <section className="hero">
        <p className="eyebrow">{t("landing.eyebrow")}</p>
        <h1>
          {t("landing.h1a")}
          <span className="mark">{t("landing.h1b")}</span>
        </h1>
        <p className="lead">{t("landing.lead")}</p>
        <div className="cta">
          <a className="btn primary" href="#/demo">
            {t("landing.try")}
          </a>
          <a className="btn" href={REPO_URL} target="_blank" rel="noreferrer noopener">
            {t("landing.viewGithub")}
          </a>
        </div>
        <p className="fineprint">{t("landing.fine")}</p>
      </section>

      <section className="sample" aria-label="Example note">
        <div className="sample-label">
          {t("type.concept")} · {t("landing.sampleExample")}
        </div>
        <div className="sample-title">Action, dispatch, reducer</div>
        <Markdown source={HERO_NOTE} options={heroOptions} />
      </section>

      <section className="features">
        <article>
          <h3>{t("landing.f1.title")}</h3>
          <p>{t("landing.f1.text")}</p>
        </article>
        <article>
          <h3>{t("landing.f2.title")}</h3>
          <p>{t("landing.f2.text")}</p>
        </article>
        <article>
          <h3>{t("landing.f3.title")}</h3>
          <p>{t("landing.f3.text")}</p>
        </article>
      </section>

      <section className="how">
        <h2>{t("landing.how")}</h2>
        <ol>
          <li>
            <strong>{t("landing.s1.b")}</strong>
            {t("landing.s1.t")}
          </li>
          <li>
            <strong>{t("landing.s2.b")}</strong>
            {t("landing.s2.t")}
          </li>
          <li>
            <strong>{t("landing.s3.b")}</strong>
            {t("landing.s3.t")}
          </li>
        </ol>
        <p className="fineprint">{t("landing.next")}</p>
      </section>

      <footer className="footer">
        <span>{t("landing.footer")}</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
          github.com/oleojake/glassbox
        </a>
      </footer>
    </div>
  );
}
