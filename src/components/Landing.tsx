import { Markdown } from "./Markdown";

export const REPO_URL = "https://github.com/oleojake/glassbox";

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

const heroOptions = { titles: new Map<string, string>(), noteHref: "#/demo/notes/" };

export function Landing() {
  return (
    <div className="landing">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="logo" aria-hidden="true" />
          Glassbox
        </a>
        <nav>
          <a href="#/demo">Demo</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Notes for developers who build with AI</p>
          <h1>Understand the code your AI writes.</h1>
          <p className="lead">
            Glassbox turns what you learn into visual notes: diagrams, steps and code. Everything is plain Markdown,
            stored in a GitHub repo you own.
          </p>
          <div className="cta">
            <a className="btn primary" href="#/demo">
              Try the demo
            </a>
            <a className="btn" href={REPO_URL} target="_blank" rel="noreferrer noopener">
              View on GitHub
            </a>
          </div>
          <p className="fineprint">No account needed for the demo. Your edits stay in your browser.</p>
        </div>
        <div className="hero-card" aria-hidden="true">
          <div className="hero-card-title">Redux: action, dispatch, reducer</div>
          <Markdown source={HERO_NOTE} options={heroOptions} />
        </div>
      </section>

      <section className="features">
        <article>
          <h3>Visual by default</h3>
          <p>Animated diagrams, numbered steps, side-by-side comparisons and review cards, all from simple Markdown.</p>
        </article>
        <article>
          <h3>Your repo, your notes</h3>
          <p>Each note is a file in a private GitHub repo. Every save is a commit, so you get history and backups for free.</p>
        </article>
        <article>
          <h3>Ready for AI</h3>
          <p>Drop an <code>INSTRUCTIONS.md</code> in your notes repo and any AI assistant can write notes in the right format.</p>
        </article>
      </section>

      <section className="how">
        <h2>How it works</h2>
        <ol>
          <li>
            <strong>Copy the template.</strong> You get a private notes repo with the format and AI instructions inside.
          </li>
          <li>
            <strong>Write notes</strong> in the browser, or ask your AI to write them straight into the repo.
          </li>
          <li>
            <strong>Read and review</strong> them in Glassbox, with search, links between notes and projects.
          </li>
        </ol>
        <p className="fineprint">GitHub sign-in is the next milestone. For now the demo runs fully in your browser.</p>
      </section>

      <footer className="footer">
        <span>Open source, free to use and copy.</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
          github.com/oleojake/glassbox
        </a>
      </footer>
    </div>
  );
}
