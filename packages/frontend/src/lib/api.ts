// ─── API Client for the ReactiveFlow Hono backend ──────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  emitter: string;
  eventSignature: string;
  name: string;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  type: "FlowExecuted" | "AlertEmitted";
  flowId: string;
  owner: string;
  success?: boolean;
  message?: string;
  blockNumber: string;
  transactionHash: string;
  timestamp: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API ${init?.method ?? "GET"} ${path} failed (${res.status}): ${body}`,
    );
  }

  return res.json() as Promise<T>;
}

// ─── Subscription Endpoints ─────────────────────────────────────────────────

/**
 * Fetch all registered event subscriptions.
 */
export function getSubscriptions(): Promise<Subscription[]> {
  return request<Subscription[]>("/api/subscriptions");
}

/**
 * Register a new event subscription with the reactive backend.
 */
export function createSubscription(
  emitter: string,
  eventSig: string,
  name: string,
): Promise<Subscription> {
  return request<Subscription>("/api/subscriptions", {
    method: "POST",
    body: JSON.stringify({ emitter, eventSig, name }),
  });
}

/**
 * Remove an event subscription by id.
 */
export function deleteSubscription(id: string): Promise<void> {
  return request<void>(`/api/subscriptions/${id}`, {
    method: "DELETE",
  });
}

// ─── Event Endpoints ────────────────────────────────────────────────────────

export interface GetEventsParams {
  limit?: number;
  offset?: number;
  flowId?: string;
}

/**
 * Fetch historical events captured by the backend.
 */
export function getEvents(
  params: GetEventsParams = {},
): Promise<EventRecord[]> {
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  if (params.flowId !== undefined) search.set("flowId", params.flowId);

  const qs = search.toString();
  return request<EventRecord[]>(`/api/events${qs ? `?${qs}` : ""}`);
}

/**
 * Open a Server-Sent Events stream for real-time event updates.
 * Returns the raw EventSource — the caller is responsible for adding
 * event listeners and closing the connection.
 */
export function getEventStream(): EventSource {
  return new EventSource(`${API_BASE}/api/events/stream`);
}
