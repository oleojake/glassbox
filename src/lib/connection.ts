const KEY = "glassbox-connection";

export interface Connection {
  /** "owner/name" of the notes repository. */
  repo: string;
  /** Fine-grained personal access token. Stored only in this browser. */
  token: string;
}

export function loadConnection(): Connection | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Connection> | null;
    return value && typeof value.repo === "string" && typeof value.token === "string" ? { repo: value.repo, token: value.token } : null;
  } catch {
    return null;
  }
}

/** Returns false when the browser refuses to store the token. */
export function saveConnection(connection: Connection): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(connection));
    return true;
  } catch {
    return false;
  }
}

export function clearConnection() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}
