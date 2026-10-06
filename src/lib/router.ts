import { useEffect, useState } from "react";

export type Route =
  | { name: "landing" }
  | { name: "connect" }
  | { name: "demo"; tag?: string; type?: string }
  | { name: "note"; slug: string }
  | { name: "project"; slug: string };

export function parseHash(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "connect") return { name: "connect" };
  if (parts[0] !== "demo") return { name: "landing" };
  if (parts[1] === "notes" && parts[2]) return { name: "note", slug: parts[2] };
  if (parts[1] === "projects" && parts[2]) return { name: "project", slug: parts[2] };
  const params = new URLSearchParams(query);
  return { name: "demo", tag: params.get("tag") ?? undefined, type: params.get("type") ?? undefined };
}

export const noteHref = (slug: string) => `#/demo/notes/${encodeURIComponent(slug)}`;
export const projectHref = (slug: string) => `#/demo/projects/${encodeURIComponent(slug)}`;
export const tagHref = (tag: string) => `#/demo?tag=${encodeURIComponent(tag)}`;
export const typeHref = (type: string) => `#/demo?type=${encodeURIComponent(type)}`;

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
