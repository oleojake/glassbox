import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { buildSkill } from "../lib/aiSkill";


export function AiGuide({ repo }: { repo: string }) {
  const { t } = useI18n();
  const skill = buildSkill(repo);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(skill);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the download link still works.
    }
  };
  return (
    <div className="ai-guide">
      <h4>{t("ai.title")}</h4>
      <p>{t("ai.text")}</p>
      <ol className="ai-steps">
        <li>{t("ai.s1")}</li>
        <li>{t("ai.s2")}</li>
      </ol>
      <div className="ai-actions">
        <button type="button" className="btn small" onClick={copy}>
          {copied ? t("ai.copied") : t("ai.copy")}
        </button>
        <a className="btn small" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(skill)}`} download="SKILL.md">
          {t("ai.download")}
        </a>
      </div>
    </div>
  );
}
