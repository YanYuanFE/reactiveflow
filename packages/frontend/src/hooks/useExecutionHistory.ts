import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents, getEventStream, type EventRecord } from "@/lib/api";

export type { EventRecord };

/**
 * Fetches historical execution events from the backend API.
 * Optionally filters by a specific flowId.
 */
export function useExecutionHistory(flowId?: string) {
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["executionHistory", flowId],
    queryFn: () => getEvents({ flowId, limit: 50 }),
    refetchInterval: 15_000,
  });

  return { events, isLoading, error, refetch };
}

/**
 * Opens an SSE connection for real-time execution events.
 */
export function useEventStream() {
  const [latestEvent, setLatestEvent] = useState<EventRecord | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = getEventStream();
    esRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.addEventListener("FlowExecuted", (event: MessageEvent) => {
      try {
        setLatestEvent(JSON.parse(event.data));
      } catch {
        // ignore
      }
    });

    es.addEventListener("AlertEmitted", (event: MessageEvent) => {
      try {
        setLatestEvent(JSON.parse(event.data));
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setIsConnected(false);
  }, []);

  return { latestEvent, isConnected, disconnect };
}
