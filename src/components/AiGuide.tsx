import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { buildInstructions, buildSkill } from "../lib/aiSkill";

type Tool = "claude" | "other";

export function AiGuide({ repo }: { repo: string }) {
  const { t } = useI18n();
  const [tool, setTool] = useState<Tool>("claude");
  const [copied, setCopied] = useState(false);
  const text = tool === "claude" ? buildSkill(repo) : buildInstructions(repo);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
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
      <div className="ai-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tool === "claude"} className={tool === "claude" ? "on" : ""} onClick={() => setTool("claude")}>
          Claude Code
        </button>
        <button type="button" role="tab" aria-selected={tool === "other"} className={tool === "other" ? "on" : ""} onClick={() => setTool("other")}>
          {t("ai.other")}
        </button>
      </div>
      <p>{tool === "claude" ? t("ai.claude") : t("ai.otherText")}</p>
      <div className="ai-actions">
        <button type="button" className="btn small" onClick={copy}>
          {copied ? t("ai.copied") : t("ai.copy")}
        </button>
        <a className="btn small" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`} download={tool === "claude" ? "SKILL.md" : "AGENTS.md"}>
          {t("ai.download")}
        </a>
      </div>
      <h4>{t("ai.examples")}</h4>
      <ul className="ai-examples">
        {(["ai.ex1", "ai.ex2", "ai.ex3", "ai.ex4"] as const).map((k) => (
          <li key={k}>
            <code>/glassbox "{t(k)}"</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
