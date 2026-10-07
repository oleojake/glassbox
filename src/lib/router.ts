import { useEffect, useState } from "react";

export type Route =
  | { name: "landing" }
  | { name: "connect" }
  | { name: "docs" }
  | { name: "demo"; scope: Scope; tag?: string; type?: string }
  | { name: "note"; scope: Scope; slug: string }
  | { name: "project"; scope: Scope; slug: string };

/** "demo" is the public sandbox; "mine" is the visitor's own connected notes repo. */
export type Scope = "demo" | "mine";
const PREFIX: Record<Scope, string> = { demo: "demo", mine: "app" };

export function parseHash(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "connect") return { name: "connect" };
  if (parts[0] === "demo" && parts[1] === "docs") return { name: "docs" };
  const scope: Scope | null = parts[0] === "demo" ? "demo" : parts[0] === "app" ? "mine" : null;
  if (!scope) return { name: "landing" };
  if (parts[1] === "notes" && parts[2]) return { name: "note", scope, slug: parts[2] };
  if (parts[1] === "projects" && parts[2]) return { name: "project", scope, slug: parts[2] };
  const params = new URLSearchParams(query);
  return { name: "demo", scope, tag: params.get("tag") ?? undefined, type: params.get("type") ?? undefined };
}

export const homeHref = (scope: Scope = "demo") => `#/${PREFIX[scope]}`;
export const noteHref = (slug: string, scope: Scope = "demo") => `#/${PREFIX[scope]}/notes/${encodeURIComponent(slug)}`;
export const projectHref = (slug: string, scope: Scope = "demo") => `#/${PREFIX[scope]}/projects/${encodeURIComponent(slug)}`;
export const tagHref = (tag: string, scope: Scope = "demo") => `#/${PREFIX[scope]}?tag=${encodeURIComponent(tag)}`;
export const typeHref = (type: string, scope: Scope = "demo") => `#/${PREFIX[scope]}?type=${encodeURIComponent(type)}`;

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
