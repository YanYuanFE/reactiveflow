import "dotenv/config";
import { SDK, type SoliditySubscriptionData } from "@somnia-chain/reactivity";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseGwei,
  keccak256,
  toHex,
  toFunctionSelector,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Creates Somnia Reactivity subscriptions using the official SDK.
 * Each subscription maps (emitter, eventSig) -> ReactiveFlow._onEvent()
 */

const REACTIVE_FLOW_ADDRESS = (process.env.REACTIVE_FLOW_ADDRESS ||
  "") as `0x${string}`;
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "") as `0x${string}`;

if (!REACTIVE_FLOW_ADDRESS) throw new Error("Set REACTIVE_FLOW_ADDRESS env var");
if (!PRIVATE_KEY) throw new Error("Set PRIVATE_KEY env var");

// Somnia testnet chain definition
const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
  },
});

// Known contract addresses
const MOCK_USDC = "0x99b143A677f49B13053Ec99C5fB16116bf0A49Ff" as const;
const USDC = "0x28bec7e30e6faee657a03e19bf1128aad7632a00" as const;
const WETH = "0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8" as const;
const DIA_ORACLE = "0xbA0E0750A56e995506CA458b2BdD752754CF39C4" as const;

const TRANSFER_SIG = keccak256(toHex("Transfer(address,address,uint256)"));
const ORACLE_UPDATE_SIG = keccak256(
  toHex("OracleUpdate(string,uint128,uint128)"),
);

// ReactiveFlow._onEvent(address,bytes32[],bytes) function selector
const ON_EVENT_SELECTOR = toFunctionSelector(
  "function _onEvent(address emitter, bytes32[] topics, bytes data)",
);

// Initialize SDK
const account = privateKeyToAccount(PRIVATE_KEY);
const sdk = new SDK({
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

interface SubscriptionDef {
  name: string;
  emitter: `0x${string}`;
  eventSig: `0x${string}`;
}

const SUBSCRIPTIONS: SubscriptionDef[] = [
  { name: "MockUSDC Transfers", emitter: MOCK_USDC, eventSig: TRANSFER_SIG },
  { name: "USDC Transfers", emitter: USDC, eventSig: TRANSFER_SIG },
  { name: "WETH Transfers", emitter: WETH, eventSig: TRANSFER_SIG },
  { name: "DIA Oracle Updates", emitter: DIA_ORACLE, eventSig: ORACLE_UPDATE_SIG },
];

console.log("Creating subscriptions with account:", account.address);
console.log("ReactiveFlow handler:", REACTIVE_FLOW_ADDRESS);
console.log("Handler selector:", ON_EVENT_SELECTOR);
console.log();

for (const sub of SUBSCRIPTIONS) {
  try {
    console.log(`Creating subscription: ${sub.name}`);
    console.log(`  Emitter: ${sub.emitter}`);
    console.log(`  Event Sig: ${sub.eventSig}`);

    const subData: SoliditySubscriptionData = {
      eventTopics: [sub.eventSig],
      emitter: sub.emitter,
      handlerContractAddress: REACTIVE_FLOW_ADDRESS,
      handlerFunctionSelector: ON_EVENT_SELECTOR,
      priorityFeePerGas: parseGwei("2"),
      maxFeePerGas: parseGwei("10"),
      gasLimit: 3_000_000n,
      isGuaranteed: true,
      isCoalesced: false,
    };

    const result = await sdk.createSoliditySubscription(subData);
    if (result instanceof Error) {
      console.error(`  Failed: ${result.message}`);
    } else {
      console.log(`  Success! TX: ${result}`);
    }
  } catch (error: any) {
    console.error(`  Failed: ${error.message}`);
  }
  console.log();
}

console.log("Done!");
