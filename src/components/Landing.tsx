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
        <p className="eyebrow">Notes for developers who build with AI</p>
        <h1>
          Understand the code <span className="mark">your AI writes.</span>
        </h1>
        <p className="lead">
          Glassbox keeps what you learn as clear, visual notes: diagrams, steps and code. They are plain Markdown files
          in a GitHub repo you own.
        </p>
        <div className="cta">
          <a className="btn primary" href="#/demo">
            Try the demo
          </a>
          <a className="btn" href={REPO_URL} target="_blank" rel="noreferrer noopener">
            View on GitHub
          </a>
        </div>
        <p className="fineprint">No account needed. In the demo, your edits stay in your browser.</p>
      </section>

      <section className="sample" aria-label="Example note">
        <div className="sample-label">Concept · Redux</div>
        <div className="sample-title">Action, dispatch, reducer</div>
        <Markdown source={HERO_NOTE} options={heroOptions} />
      </section>

      <section className="features">
        <article>
          <h3>Easy to scan</h3>
          <p>Every note has a type, tags and an optional project, so you can find it again in seconds.</p>
        </article>
        <article>
          <h3>Your repo, your notes</h3>
          <p>Each note is a file in a private GitHub repo. Every save is a commit: history and backups included.</p>
        </article>
        <article>
          <h3>Ready for AI</h3>
          <p>
            Put an <code>INSTRUCTIONS.md</code> in your notes repo and any AI assistant can write notes in the right
            format.
          </p>
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
            <strong>Read and review</strong> them in Glassbox, with search, tags and projects.
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
