import { useState, type FormEvent } from "react";
import { saveConnection } from "../lib/connection";
import { createGitHubClient, GitHubError, parseRepo } from "../lib/github";
import { LangSwitch, useI18n } from "../lib/i18n";

export function Connect() {
  const { t } = useI18n();
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    const ref = parseRepo(repo);
    if (!ref) return setError(t("connect.err.repo"));
    setChecking(true);
    try {
      const info = await createGitHubClient(token.trim()).getRepo(ref);
      if (!info.private) return setError(t("connect.err.public"));
      if (!info.canPush) return setError(t("connect.err.push"));
      if (!saveConnection({ repo: `${ref.owner}/${ref.repo}`, token: token.trim() })) return setError(t("connect.err.storage"));
      window.location.hash = "#/demo";
    } catch (err) {
      setError(
        err instanceof GitHubError && (err.status === 401 || err.status === 403 || err.status === 404)
          ? t("connect.err.auth")
          : `${t("connect.err.generic")} ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="landing connect">
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

      <h1 className="page-title">{t("connect.title")}</h1>
      <p className="lead">{t("connect.intro")}</p>
      <ol className="connect-steps">
        <li>
          {t("connect.s1")}{" "}
          <a href="https://github.com/new" target="_blank" rel="noreferrer noopener">
            {t("connect.s1.link")}
          </a>
        </li>
        <li>
          {t("connect.s2")}{" "}
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer noopener">
            {t("connect.s2.link")}
          </a>
        </li>
        <li>{t("connect.s3")}</li>
      </ol>

      <form onSubmit={submit} className="connect-form">
        <label htmlFor="repo">{t("connect.repo")}</label>
        <input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="oleojake/glassbox-notes" autoComplete="off" spellCheck={false} required />
        <label htmlFor="token">{t("connect.token")}</label>
        <input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" autoComplete="off" spellCheck={false} required />
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn primary" disabled={checking}>
          {checking ? t("connect.checking") : t("connect.submit")}
        </button>
        <p className="fineprint">{t("connect.privacy")}</p>
      </form>
    </div>
  );
}
