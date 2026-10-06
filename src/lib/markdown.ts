import { Lexer, Marked, type Tokens } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";
import php from "highlight.js/lib/languages/php";
import markdown from "highlight.js/lib/languages/markdown";
import { parse as parseYaml } from "yaml";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("php", php);
hljs.registerLanguage("markdown", markdown);
hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
hljs.registerAliases(["js", "jsx"], { languageName: "javascript" });
hljs.registerAliases(["html"], { languageName: "xml" });
hljs.registerAliases(["sh", "shell"], { languageName: "bash" });
hljs.registerAliases(["yml"], { languageName: "yaml" });

export interface RenderOptions {
  /** Known notes, used to flag broken [[links]]. */
  titles: Map<string, string>;
  /** Hash route prefix for note links, e.g. "#/demo/notes/". */
  noteHref: string;
  /** Project repo URL; when set, paths in `files` blocks link to GitHub. */
  repo?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CALLOUTS: Record<string, string> = {
  remember: "Remember",
  when: "When to use",
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

function splitLang(info: string | undefined): { lang: string; title?: string } {
  const text = info ?? "";
  const lang = text.trim().split(/\s+/)[0] ?? "";
  const title = /title="([^"]*)"/.exec(text)?.[1];
  return { lang, title };
}

function highlight(code: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
  return escapeHtml(code);
}

function codeFigure(code: string, info: string | undefined, tabbed = false): string {
  const { lang, title } = splitLang(info);
  const head = title || lang
    ? `<figcaption><span>${escapeHtml(title ?? lang)}</span></figcaption>`
    : "";
  const body = `<pre><code class="hljs">${highlight(code, lang)}</code></pre>`;
  const copy = `<button class="copy" type="button" aria-label="Copy code">Copy</button>`;
  return `<figure class="code${tabbed ? " in-tab" : ""}">${tabbed ? "" : head}${copy}${body}</figure>`;
}

function renderSteps(source: string, md: Marked): string {
  let items: unknown;
  try {
    items = parseYaml(source);
  } catch {
    return `<pre><code>${escapeHtml(source)}</code></pre>`;
  }
  if (!Array.isArray(items)) return `<pre><code>${escapeHtml(source)}</code></pre>`;
  const lis = items
    .map((raw, i) => {
      const item = (raw ?? {}) as { title?: unknown; file?: unknown; detail?: unknown };
      const title = md.parseInline(String(item.title ?? "")) as string;
      const file = item.file ? `<code class="file">${escapeHtml(String(item.file))}</code>` : "";
      const detail = item.detail ? `<p>${md.parseInline(String(item.detail))}</p>` : "";
      return `<li style="--i:${i}"><span class="step-n">${i + 1}</span><div><strong>${title}</strong>${file}${detail}</div></li>`;
    })
    .join("");
  return `<ol class="steps">${lis}</ol>`;
}

function renderFiles(source: string, repo?: string): string {
  const lis = source
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [path, ...rest] = line.split(/\s+[—–-]\s+/);
      const desc = rest.join(" — ");
      const code = `<code>${escapeHtml(path)}</code>`;
      const link = repo
        ? `<a href="${escapeHtml(repo.replace(/\/$/, ""))}/blob/HEAD/${escapeHtml(path)}" target="_blank" rel="noreferrer noopener">${code}</a>`
        : code;
      return `<li>${link}${desc ? `<span>${escapeHtml(desc)}</span>` : ""}</li>`;
    })
    .join("");
  return `<ul class="files">${lis}</ul>`;
}

function renderTabs(inner: string, md: Marked): string {
  const blocks = Lexer.lex(inner).filter((t): t is Tokens.Code => t.type === "code");
  if (!blocks.length) return md.parse(inner) as string;
  const names = blocks.map((b) => {
    const { lang, title } = splitLang(b.lang);
    return title ?? (lang || "code");
  });
  const bar = names
    .map((n, i) => `<button type="button" class="tab${i === 0 ? " active" : ""}" data-tab="${i}">${escapeHtml(n)}</button>`)
    .join("");
  const panes = blocks
    .map((b, i) => `<div class="tab-pane${i === 0 ? " active" : ""}" data-pane="${i}">${codeFigure(b.text, b.lang, true)}</div>`)
    .join("");
  return `<div class="tabs"><div class="tab-bar">${bar}</div>${panes}</div>`;
}

export function renderMarkdown(source: string, options: RenderOptions): string {
  const md: Marked = new Marked({
    gfm: true,
    extensions: [
      {
        name: "wikilink",
        level: "inline",
        start: (src: string) => src.indexOf("[["),
        tokenizer(src: string) {
          const m = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(src);
          if (!m) return undefined;
          return { type: "wikilink", raw: m[0], slug: m[1].trim(), label: (m[2] ?? m[1]).trim() };
        },
        renderer(token) {
          const slug = String(token.slug);
          const known = options.titles.has(slug);
          const label = escapeHtml(String(token.label === slug && known ? options.titles.get(slug) : token.label));
          return known
            ? `<a class="wikilink" href="${options.noteHref}${encodeURIComponent(slug)}">${label}</a>`
            : `<span class="wikilink broken" title="No note named ${escapeHtml(slug)}">${label}</span>`;
        },
      },
    ],
    renderer: {
      code({ text, lang }): string {
        const { lang: l } = splitLang(lang);
        if (l === "mermaid") return `<div class="diagram"><pre class="mermaid">${escapeHtml(text)}</pre></div>`;
        if (l === "steps") return renderSteps(text, md);
        if (l === "files") return renderFiles(text, options.repo);
        return codeFigure(text, lang);
      },
      blockquote(token) {
        const match = /^\[!(\w+)\][ \t]*\n?/.exec(token.text);
        const kind = match?.[1].toLowerCase();
        if (!match || !kind || !(kind in CALLOUTS)) return false;
        const inner = this.parser.parse(Lexer.lex(token.text.slice(match[0].length), this.parser.options));
        return `<aside class="callout callout-${kind}"><div class="callout-title">${CALLOUTS[kind]}</div>${inner}</aside>`;
      },
      table(token) {
        if (token.header[0]?.text.trim().toLowerCase() !== "vs") return false;
        const cards = token.header
          .slice(1)
          .map((col, j) => {
            const rows = token.rows
              .map((row) => `<div class="vs-row"><span>${this.parser.parseInline(row[0].tokens)}</span><p>${this.parser.parseInline(row[j + 1]?.tokens ?? [])}</p></div>`)
              .join("");
            return `<div class="vs-card"><h4>${this.parser.parseInline(col.tokens)}</h4>${rows}</div>`;
          })
          .join("");
        return `<div class="vs">${cards}</div>`;
      },
    },
  });

  // Split out <!-- tabs --> groups so their code blocks render as tabs.
  const parts = source.split(/<!--\s*tabs\s*-->([\s\S]*?)<!--\s*\/tabs\s*-->/);
  const html = parts
    .map((part, i) => (i % 2 === 1 ? renderTabs(part, md) : (md.parse(part) as string)))
    .join("");
  return DOMPurify.sanitize(html, { ADD_ATTR: ["target"] });
}
