import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import subscriptions from "./routes/subscriptions.js";
import events from "./routes/events.js";
import { startEventIndexer } from "./services/event-indexer.js";
import { seedKnownSubscriptions } from "./services/subscription-manager.js";
import { prisma } from "./services/db.js";
import { config } from "./config.js";

const app = new Hono();

// CORS for frontend
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

// Routes
app.route("/api/subscriptions", subscriptions);
app.route("/api/events", events);

// Seed known subscriptions then start event indexer
seedKnownSubscriptions()
  .catch((e) => console.error("Seed subscriptions failed:", e.message))
  .then(() => startEventIndexer());

// Start server
const port = config.port;
console.log(`ReactiveFlow API server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
