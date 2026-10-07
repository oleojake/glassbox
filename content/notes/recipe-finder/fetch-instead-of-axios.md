---
title: Why Recipe finder uses fetch instead of a library
summary: The decision to call the API with the built-in fetch, and what we gave up.
type: decision
tags: [javascript, fetch, architecture]
projects: []
created: 2026-10-07
updated: 2026-10-07
---

# Why Recipe finder uses fetch instead of a library

> [!REMEMBER]
> We use the built-in **fetch** because the app makes three simple GET requests. A library would add weight for features we do not use.

## Context

Recipe finder only searches recipes and loads one recipe by id. There are no uploads, no retries and no interceptors. The bundle should stay small because the app is a static page.

## Options we compared

| vs | fetch | HTTP library |
|---|---|---|
| Size | 0 kB, built into the browser | extra dependency to download |
| Cancelling | `AbortController`, see [[cancel-requests-with-abortcontroller]] | built-in helper |
| Errors | you must check `response.ok` yourself | rejects on 4xx and 5xx |
| Fits when | a few simple requests | many requests with shared rules |

## Decision

Use `fetch` behind one small helper, so the rest of the code never calls it directly.

```ts title="api.ts"
// Every request goes through here, so error handling lives in one place.
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
```

> [!CAUTION]
> `fetch` does not fail on a 404 or a 500. If you forget the `response.ok` check, errors look like empty data.

> [!WHEN]
> Revisit this decision if the app needs retries, upload progress or shared headers on many endpoints.
