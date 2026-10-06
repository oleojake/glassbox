import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { renderMarkdown, type RenderOptions } from "../lib/markdown";

let mermaidReady: Promise<typeof import("mermaid").default> | undefined;

function loadMermaid() {
  mermaidReady ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "strict",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      themeVariables: { primaryColor: "#241f45", primaryBorderColor: "#8b7bff", lineColor: "#8b8fa3" },
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
  const { titles, noteHref, repo } = options;
  const html = useMemo(() => renderMarkdown(source, { titles, noteHref, repo }), [source, titles, noteHref, repo]);

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
          copy.textContent = "Copied";
          setTimeout(() => (copy.textContent = "Copy"), 1500);
        },
        () => undefined,
      );
    }
  };

  return <div ref={ref} className="prose" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
