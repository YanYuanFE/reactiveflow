import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Prisma 7 + pnpm monorepo: import generated client directly
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../../node_modules/.prisma/client");

// Prisma uses ?schema=X for PG schema. Strip it for pg driver
// and pass search_path via connection options instead.
const dbUrl = process.env.DB_URL!;
const schemaMatch = dbUrl.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? schemaMatch[1] : "public";
const cleanUrl = dbUrl.replace(/[?&]schema=[^&]+/, (m) =>
  m.startsWith("?") ? "" : "",
);

const pool = new pg.Pool({
  connectionString: cleanUrl || dbUrl,
  options: `-c search_path=${schema}`,
});

const adapter = new PrismaPg(pool, { schema });
export const prisma = new PrismaClient({ adapter });

export async function getLastIndexedBlock(): Promise<bigint | null> {
  const row = await prisma.indexerState.findUnique({
    where: { key: "last_block" },
  });
  return row ? BigInt(row.value) : null;
}

export async function setLastIndexedBlock(block: bigint): Promise<void> {
  await prisma.indexerState.upsert({
    where: { key: "last_block" },
    update: { value: block.toString() },
    create: { key: "last_block", value: block.toString() },
  });
}
