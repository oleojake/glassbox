import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { renderMarkdown, type RenderOptions } from "../lib/markdown";

let mermaidReady: Promise<typeof import("mermaid").default> | undefined;

function loadMermaid() {
  mermaidReady ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "strict",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      themeVariables: { primaryColor: "#f1ece0", primaryBorderColor: "#b9b0a0", lineColor: "#8a8274", primaryTextColor: "#26231f" },
    });
    return mermaid;
  });
  return mermaidReady;
}

interface Props {
  source: string;
  options: RenderOptions;
}

export function Markdown({ source, options }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { titles, noteHref, repo, t } = options;
  const html = useMemo(() => renderMarkdown(source, { titles, noteHref, repo, t }), [source, titles, noteHref, repo, t]);

  useEffect(() => {
    const nodes = ref.current?.querySelectorAll<HTMLElement>("pre.mermaid");
    if (!nodes?.length) return;
    let cancelled = false;
    loadMermaid()
      .then((mermaid) => (cancelled ? undefined : mermaid.run({ nodes: [...nodes], suppressErrors: true })))
      .catch(() => {
        // A diagram that fails to render stays visible as its source text.
      });
    return () => {
      cancelled = true;
    };
  }, [html]);

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const tab = target.closest<HTMLElement>("button.tab");
    if (tab) {
      const group = tab.closest(".tabs");
      group?.querySelectorAll(".tab, .tab-pane").forEach((el) => el.classList.remove("active"));
      tab.classList.add("active");
      group?.querySelector(`.tab-pane[data-pane="${tab.dataset.tab}"]`)?.classList.add("active");
      return;
    }
    const copy = target.closest<HTMLButtonElement>("button.copy");
    if (copy) {
      const code = copy.parentElement?.querySelector("code")?.textContent ?? "";
      navigator.clipboard?.writeText(code).then(
        () => {
          copy.textContent = t("code.copied");
          setTimeout(() => (copy.textContent = t("code.copy")), 1500);
        },
        () => undefined,
      );
    }
  };

  return <div ref={ref} className="prose" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
