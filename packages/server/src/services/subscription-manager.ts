import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseGwei,
  toFunctionSelector,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { SDK, type SoliditySubscriptionData } from "@somnia-chain/reactivity";
import { config } from "../config.js";
import { prisma } from "./db.js";

const somniaTestnet = defineChain({
  id: config.chainId,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: [config.rpcUrl] } },
});

// ReactiveFlow._onEvent(address,bytes32[],bytes) selector
const ON_EVENT_SELECTOR = toFunctionSelector(
  "function _onEvent(address emitter, bytes32[] topics, bytes data)",
);

export interface Subscription {
  id: string;
  emitter: string;
  eventSig: string;
  name: string;
  createdAt: Date;
  txHash?: string | null;
}

// Lazily initialized SDK instance
let sdk: SDK | null = null;

function getSDK(): SDK | null {
  if (sdk) return sdk;
  if (!config.privateKey) {
    console.warn("No PRIVATE_KEY set — on-chain subscriptions disabled");
    return null;
  }

  const account = privateKeyToAccount(config.privateKey as `0x${string}`);
  sdk = new SDK({
    public: createPublicClient({
      chain: somniaTestnet,
      transport: http(),
    }),
    wallet: createWalletClient({
      account,
      chain: somniaTestnet,
      transport: http(),
    }),
  });
  return sdk;
}

function triggerKey(emitter: string, eventSig: string): string {
  return `${emitter.toLowerCase()}-${eventSig.toLowerCase()}`;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const rows = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r: any) => ({
    id: r.id,
    emitter: r.emitter,
    eventSig: r.eventSig,
    name: r.name,
    createdAt: r.createdAt,
    txHash: r.txHash,
  }));
}

export async function getSubscription(
  key: string,
): Promise<Subscription | null> {
  const row = await prisma.subscription.findUnique({ where: { id: key } });
  if (!row) return null;
  return {
    id: row.id,
    emitter: row.emitter,
    eventSig: row.eventSig,
    name: row.name,
    createdAt: row.createdAt,
    txHash: row.txHash,
  };
}

export async function createSubscription(
  emitter: string,
  eventSig: string,
  name: string,
): Promise<Subscription> {
  const key = triggerKey(emitter, eventSig);

  // Check if subscription already exists
  const existing = await prisma.subscription.findUnique({
    where: { id: key },
  });
  if (existing) {
    return {
      id: existing.id,
      emitter: existing.emitter,
      eventSig: existing.eventSig,
      name: existing.name,
      createdAt: existing.createdAt,
      txHash: existing.txHash,
    };
  }

  let txHash: string | undefined;

  // Create on-chain subscription via Reactivity SDK
  const sdkInstance = getSDK();
  if (sdkInstance && config.reactiveFlowAddress) {
    try {
      const subData: SoliditySubscriptionData = {
        eventTopics: [eventSig as `0x${string}`],
        emitter: emitter as `0x${string}`,
        handlerContractAddress: config.reactiveFlowAddress as `0x${string}`,
        handlerFunctionSelector: ON_EVENT_SELECTOR,
        priorityFeePerGas: parseGwei("2"),
        maxFeePerGas: parseGwei("10"),
        gasLimit: 3_000_000n,
        isGuaranteed: true,
        isCoalesced: false,
      };

      const result = await sdkInstance.createSoliditySubscription(subData);
      if (result instanceof Error) {
        console.error(`Subscription failed: ${result.message}`);
      } else {
        txHash = result;
        console.log(`Subscription created for ${name}: ${txHash}`);
      }
    } catch (error: any) {
      console.error(
        `Failed to create on-chain subscription: ${error.message}`,
      );
    }
  }

  const row = await prisma.subscription.create({
    data: {
      id: key,
      emitter,
      eventSig,
      name,
      txHash,
    },
  });

  return {
    id: row.id,
    emitter: row.emitter,
    eventSig: row.eventSig,
    name: row.name,
    createdAt: row.createdAt,
    txHash: row.txHash,
  };
}

export async function deleteSubscription(key: string): Promise<boolean> {
  try {
    await prisma.subscription.delete({ where: { id: key } });
    return true;
  } catch {
    return false;
  }
}

// No-op — subscriptions are now created on-demand when users create flows.
// The Reactivity precompile subscription is registered on-chain the first time
// a new (emitter, eventSig) pair is seen via createSubscription().
export async function seedKnownSubscriptions(): Promise<void> {
  // intentionally empty
}
