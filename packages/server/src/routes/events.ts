import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import {
  getEvents,
  getEventsByFlow,
  addSSEListener,
} from "../services/event-indexer.js";

const app = new Hono();

// GET /api/events
app.get("/", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const flowId = c.req.query("flowId");

  if (flowId) {
    return c.json(await getEventsByFlow(flowId));
  }

  return c.json(await getEvents(limit, offset));
});

// GET /api/events/stream - SSE for real-time events
app.get("/stream", (c) => {
  return streamSSE(c, async (stream) => {
    const remove = addSSEListener((event) => {
      stream.writeSSE({
        data: JSON.stringify(event),
        event: event.type,
        id: event.id,
      });
    });

    const keepAlive = setInterval(() => {
      stream.writeSSE({ data: "", event: "ping" });
    }, 30_000);

    stream.onAbort(() => {
      remove();
      clearInterval(keepAlive);
    });

    await new Promise(() => {}); // keep stream open
  });
});

export default app;
