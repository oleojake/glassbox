import { useState } from "react";
import { useI18n } from "../lib/i18n";
import instructions from "../../docs/INSTRUCTIONS.md?raw";
import format from "../../docs/FORMAT.md?raw";

// One self-contained file a user can hand to any AI assistant.
const GUIDE = `${instructions}\n\n---\n\n${format}`;

export function AiGuide() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(GUIDE);
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
      <div className="ai-actions">
        <button type="button" className="btn small" onClick={copy}>
          {copied ? t("ai.copied") : t("ai.copy")}
        </button>
        <a className="btn small" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(GUIDE)}`} download="GLASSBOX_AI_GUIDE.md">
          {t("ai.download")}
        </a>
      </div>
    </div>
  );
}
