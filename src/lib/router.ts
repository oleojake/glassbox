import { useEffect, useState } from "react";

export type Route =
  | { name: "landing" }
  | { name: "demo" }
  | { name: "note"; slug: string }
  | { name: "project"; slug: string };

export function parseHash(hash: string): Route {
  const parts = hash.split("?")[0].replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] !== "demo") return { name: "landing" };
  if (parts[1] === "notes" && parts[2]) return { name: "note", slug: parts[2] };
  if (parts[1] === "projects" && parts[2]) return { name: "project", slug: parts[2] };
  return { name: "demo" };
}

export const noteHref = (slug: string) => `#/demo/notes/${encodeURIComponent(slug)}`;
export const projectHref = (slug: string) => `#/demo/projects/${encodeURIComponent(slug)}`;

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
