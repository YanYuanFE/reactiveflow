import { createPublicClient, http, parseAbiItem } from "viem";
import { config } from "../config.js";
import { prisma, getLastIndexedBlock, setLastIndexedBlock } from "./db.js";

const somniaTestnet = {
  id: config.chainId,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: [config.rpcUrl] } },
} as const;

export interface IndexedEvent {
  id: string;
  type: "FlowExecuted" | "AlertEmitted";
  flowId: string;
  owner: string;
  success?: boolean | null;
  message?: string | null;
  blockNumber: string;
  transactionHash: string;
  timestamp: number;
}

// SSE listeners (still in-memory — real-time push doesn't need persistence)
type SSEListener = (event: IndexedEvent) => void;
const listeners = new Set<SSEListener>();

export async function getEvents(
  limit = 50,
  offset = 0,
): Promise<IndexedEvent[]> {
  const rows = await prisma.event.findMany({
    orderBy: { timestamp: "desc" },
    skip: offset,
    take: limit,
  });
  return rows.map(toIndexedEvent);
}

export async function getEventsByFlow(
  flowId: string,
  limit = 100,
): Promise<IndexedEvent[]> {
  const rows = await prisma.event.findMany({
    where: { flowId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
  return rows.map(toIndexedEvent);
}

export function addSSEListener(listener: SSEListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(event: IndexedEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // ignore broken listeners
    }
  }
}

function toIndexedEvent(row: {
  id: string;
  type: string;
  flowId: string;
  owner: string;
  success: boolean | null;
  message: string | null;
  blockNumber: string;
  transactionHash: string;
  timestamp: Date;
}): IndexedEvent {
  return {
    id: row.id,
    type: row.type as IndexedEvent["type"],
    flowId: row.flowId,
    owner: row.owner,
    success: row.success,
    message: row.message,
    blockNumber: row.blockNumber,
    transactionHash: row.transactionHash,
    timestamp: row.timestamp.getTime(),
  };
}

async function persistEvent(event: IndexedEvent) {
  try {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        type: event.type,
        flowId: event.flowId,
        owner: event.owner,
        success: event.success,
        message: event.message,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: new Date(event.timestamp),
      },
    });
    notifyListeners(event);
    return true;
  } catch {
    // duplicate — already persisted
    return false;
  }
}

// ─── ABI events ───────────────────────────────────────────────
const FLOW_EXECUTED_EVENT = parseAbiItem(
  "event FlowExecuted(uint256 indexed flowId, address indexed owner, bool success, bytes returnData)",
);

const ALERT_EMITTED_EVENT = parseAbiItem(
  "event AlertEmitted(uint256 indexed flowId, address indexed owner, string message, bytes data)",
);

// ─── Indexer ──────────────────────────────────────────────────
let isWatching = false;

export function startEventIndexer() {
  if (isWatching || !config.reactiveFlowAddress) {
    console.log(
      "Event indexer: skipping (no contract address or already running)",
    );
    return;
  }

  isWatching = true;
  const client = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });

  console.log(
    "Event indexer: watching for events on",
    config.reactiveFlowAddress,
  );

  let isPolling = false;
  const pollInterval = setInterval(async () => {
    if (isPolling) return; // prevent overlapping polls
    isPolling = true;
    try {
      const headBlock = await client.getBlockNumber();

      // Resume from last persisted block, or start from recent history
      const lastBlock = await getLastIndexedBlock();
      let fromBlock = lastBlock
        ? lastBlock + 1n
        : headBlock > 500n
          ? headBlock - 500n
          : 0n;

      if (fromBlock > headBlock) { isPolling = false; return; }

      // Somnia RPC limits getLogs to 1000 blocks per request
      const MAX_BLOCK_RANGE = 900n;
      // Catch up in batches — up to 50 batches per poll (45,000 blocks)
      const MAX_BATCHES = 50;
      let batchCount = 0;

      while (fromBlock <= headBlock && batchCount < MAX_BATCHES) {
      const toBlock =
        headBlock - fromBlock > MAX_BLOCK_RANGE
          ? fromBlock + MAX_BLOCK_RANGE
          : headBlock;

      const contractAddr = config.reactiveFlowAddress as `0x${string}`;

      const [executedLogs, alertLogs] = await Promise.all([
        client.getLogs({
          address: contractAddr,
          event: FLOW_EXECUTED_EVENT,
          fromBlock,
          toBlock,
        }),
        client.getLogs({
          address: contractAddr,
          event: ALERT_EMITTED_EVENT,
          fromBlock,
          toBlock,
        }),
      ]);

      for (const log of executedLogs) {
        await persistEvent({
          id: `${log.transactionHash}-${log.logIndex}`,
          type: "FlowExecuted",
          flowId: (log.args.flowId ?? 0n).toString(),
          owner: log.args.owner ?? "",
          success: log.args.success,
          blockNumber: log.blockNumber.toString(),
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
        });
      }

      for (const log of alertLogs) {
        await persistEvent({
          id: `${log.transactionHash}-${log.logIndex}`,
          type: "AlertEmitted",
          flowId: (log.args.flowId ?? 0n).toString(),
          owner: log.args.owner ?? "",
          message: log.args.message,
          blockNumber: log.blockNumber.toString(),
          transactionHash: log.transactionHash,
          timestamp: Date.now(),
        });
      }

      await setLastIndexedBlock(toBlock);
      fromBlock = toBlock + 1n;
      batchCount++;
      }

      if (batchCount > 0) {
        const gap = headBlock - fromBlock;
        if (gap > 0n) {
          console.log(`Event indexer: catching up, ${gap} blocks behind`);
        }
      }
    } catch (error: any) {
      console.error("Event indexer poll error:", error.message);
    } finally {
      isPolling = false;
    }
  }, 5_000);

  return () => {
    clearInterval(pollInterval);
    isWatching = false;
  };
}
