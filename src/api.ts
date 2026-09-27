// Nimos control-plane client — talks to the LIVE nimos-stack API.
//
// Auth is the server's own scheme: X-Nimos-Token. There is no separate backend;
// the spine already has CEO agents, sessions, chat (SSE) and the media catalog
// with keep/kill verdicts. This client is a thin, typed surface over it.

import AsyncStorage from "@react-native-async-storage/async-storage";

const URL_KEY = "nimos.url";
const TOKEN_KEY = "nimos.token";

export type Conn = { url: string; token: string };
let cache: Conn | null = null;

export async function getConn(): Promise<Conn> {
  if (cache) return cache;
  const [url, token] = await Promise.all([
    AsyncStorage.getItem(URL_KEY),
    AsyncStorage.getItem(TOKEN_KEY),
  ]);
  cache = { url: (url ?? "").replace(/\/$/, ""), token: token ?? "" };
  syncCache = cache;
  return cache;
}

export async function setConn(c: Conn): Promise<void> {
  cache = { url: c.url.replace(/\/$/, ""), token: c.token.trim() };
  syncCache = cache;
  await AsyncStorage.multiSet([[URL_KEY, cache.url], [TOKEN_KEY, cache.token]]);
}

let syncCache: Conn = { url: "", token: "" };
/** Synchronous view of the cached connection, for chrome that must not suspend. */
export function getConnSync(): Conn {
  return syncCache ?? { url: "", token: "" };
}

export function isLinked(c: Conn): boolean {
  return !!c.url && !!c.token;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function headers(): Promise<Record<string, string>> {
  const { token } = await getConn();
  return { "X-Nimos-Token": token, "Content-Type": "application/json" };
}

/** Human copy for every failure. The spine's raw messages never reach the UI. */
async function fail(res: Response): Promise<never> {
  if (res.status === 401 || res.status === 403)
    throw new ApiError(res.status, "That token was refused. Paste the nimos token on the Link tab.");
  if (res.status === 502 || res.status === 503)
    throw new ApiError(res.status, "The spine is busy or a service is down. Retry in a moment.");
  if (res.status === 404) throw new ApiError(res.status, "That record no longer exists.");
  throw new ApiError(res.status, `The spine answered ${res.status}.`);
}

export async function get<T>(path: string): Promise<T> {
  const { url } = await getConn();
  if (!url) throw new ApiError(0, "NOT_CONNECTED");
  const res = await fetch(`${url}${path}`, { headers: await headers() });
  if (!res.ok) return fail(res);
  return (await res.json()) as T;
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const { url } = await getConn();
  if (!url) throw new ApiError(0, "NOT_CONNECTED");
  const res = await fetch(`${url}${path}`, {
    method: "POST",
    headers: await headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) return fail(res);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// ── agents ──────────────────────────────────────────────────────────────────
export type Agent = {
  id: string;
  business_id?: string | null;
  name: string;
  role: string;
  tier?: string | null;
  is_active?: number;
  sole_goal?: string | null;
  icon?: string | null;
  color?: string | null;
};
export type Business = { id: string; name: string; state?: string | null; site_url?: string | null };

export const getAgents = () => get<Agent[]>("/api/agents");
export const getBusinesses = () => get<Business[]>("/api/businesses");

// ── sessions + messages ─────────────────────────────────────────────────────
export type Session = { id: string; agent_id: string; title?: string; created?: string };
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created?: string;
};

export const createSession = (agentId: string) =>
  post<Session>(`/api/agents/${agentId}/sessions`, {});
export const listSessions = (agentId: string) =>
  get<Session[]>(`/api/agents/${agentId}/sessions`);
export const getMessages = (sessionId: string) =>
  get<Message[]>(`/api/sessions/${sessionId}/messages`);

/** The live line to an agent. Returns a cancel function; emits tokens as they land. */
export async function chat(
  agentId: string,
  sessionId: string,
  message: string,
  onToken: (chunk: string) => void,
): Promise<() => void> {
  const { url } = await getConn();
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${url}/api/chat`, {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({ agent_id: agentId, session_id: sessionId, message }),
        signal: controller.signal,
      });
      if (!res.ok) return fail(res);
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // SSE frames are separated by a blank line
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const frame of frames) {
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload) as { token?: string; content?: string; text?: string };
              const chunk = parsed.token ?? parsed.content ?? parsed.text;
              if (chunk) onToken(chunk);
            } catch {
              onToken(payload); // some frames are plain text
            }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      onToken("");
    }
  })();

  return () => controller.abort();
}

// ── media ───────────────────────────────────────────────────────────────────
export type MediaItem = {
  id: number;
  kind: "image" | "video";
  file: string;
  world: string;
  concept?: string | null;
  channel?: string | null;
  job?: string | null;
  hook?: string | null;
  prompt?: string | null;
  width?: number | null;
  height?: number | null;
  status: "fresh" | "kept" | "killed";
  created_at: string;
  url: string;
  thumb_url: string;
};

export const getMedia = (opts: { status?: string; limit?: number } = {}) => {
  const q = new URLSearchParams();
  if (opts.status) q.set("status", opts.status);
  q.set("limit", String(opts.limit ?? 120));
  return get<{ media: MediaItem[] }>(`/api/media/library?${q.toString()}`);
};

export const setVerdict = (id: number, verdict: "kept" | "killed") =>
  post<{ ok?: boolean }>(`/api/media/${id}/verdict`, { verdict });

export function mediaUrl(path: string): string {
  const { url } = cache ?? { url: "" };
  return `${url}${path}`;
}
