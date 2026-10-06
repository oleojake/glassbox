import { useCallback, useMemo, useState } from "react";
import { demoNotes, parseNote, type Note } from "./content";

const KEY = "glassbox-demo-notes";

type Overrides = Record<string, string>;

function readOverrides(): Overrides {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return value && typeof value === "object" ? (value as Overrides) : {};
  } catch {
    return {};
  }
}

function writeOverrides(value: Overrides) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, quota); the demo still works in memory.
  }
}

export const NEW_NOTE_TEMPLATE = `---
title: Untitled note
summary: One sentence that says what this note is about.
type: concept
tags: []
projects: []
---

# Untitled note

> [!REMEMBER]
> The one idea you want to remember.
`;

/**
 * Demo notes plus whatever the visitor edited or created.
 * Changes live in this browser only (localStorage); nothing is sent anywhere.
 */
export function useNotes() {
  const [overrides, setOverrides] = useState<Overrides>(readOverrides);

  const notes = useMemo<Note[]>(() => {
    const bySlug = new Map(demoNotes.map((n) => [n.slug, n]));
    for (const [slug, raw] of Object.entries(overrides)) bySlug.set(slug, parseNote(slug, raw));
    return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [overrides]);

  const save = useCallback((slug: string, raw: string) => {
    setOverrides((prev) => {
      const next = { ...prev, [slug]: raw };
      writeOverrides(next);
      return next;
    });
  }, []);

  const create = useCallback((): string => {
    let slug = "untitled-note";
    for (let i = 2; notes.some((n) => n.slug === slug); i++) slug = `untitled-note-${i}`;
    save(slug, NEW_NOTE_TEMPLATE);
    return slug;
  }, [notes, save]);

  const reset = useCallback(() => {
    writeOverrides({});
    setOverrides({});
  }, []);

  return { notes, save, create, reset, hasChanges: Object.keys(overrides).length > 0 };
}
