import { Hono } from "hono";
import {
  getSubscriptions,
  createSubscription,
  deleteSubscription,
} from "../services/subscription-manager.js";

const app = new Hono();

// GET /api/subscriptions
app.get("/", async (c) => {
  return c.json(await getSubscriptions());
});

// POST /api/subscriptions
app.post("/", async (c) => {
  const body = await c.req.json<{
    emitter: string;
    eventSig: string;
    name: string;
  }>();

  if (!body.emitter || !body.eventSig) {
    return c.json({ error: "emitter and eventSig required" }, 400);
  }

  const sub = await createSubscription(
    body.emitter,
    body.eventSig,
    body.name || "Unnamed",
  );

  return c.json(sub, 201);
});

// DELETE /api/subscriptions/:id
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteSubscription(id);
  if (!deleted) {
    return c.json({ error: "Subscription not found" }, 404);
  }
  return c.json({ ok: true });
});

export default app;
