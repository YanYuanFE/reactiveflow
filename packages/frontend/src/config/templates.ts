import { MOCK_USDC_ADDRESS, DIA_ORACLE, TRANSFER_EVENT_SIG } from "./contracts";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Enum mirrors for the Solidity TriggerType */
export enum TriggerType {
  TOKEN_TRANSFER = 0,
  PRICE_THRESHOLD = 1,
  DEX_SWAP = 2,
  CUSTOM_EVENT = 3,
}

/** Enum mirrors for the Solidity ConditionOp */
export enum ConditionOp {
  NONE = 0,
  GT = 1,
  LT = 2,
  GTE = 3,
  LTE = 4,
  EQ = 5,
  NEQ = 6,
}

/** Enum mirrors for the Solidity ActionType */
export enum ActionType {
  TRANSFER_TOKEN = 0,
  SWAP_TOKENS = 1,
  CONTRACT_CALL = 2,
  EMIT_ALERT = 3,
}

export type TemplateCategory =
  | "monitoring"
  | "trading"
  | "automation"
  | "defi";

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  trigger: {
    triggerType: TriggerType;
    emitterContract?: `0x${string}`;
    eventSignature?: `0x${string}`;
  };
  condition: {
    operator: ConditionOp;
    conditionType?: string;
    oracleOrDataSource?: `0x${string}`;
    oracleKey?: string;
    threshold?: bigint;
    dataOffset?: number;
  };
  action: {
    actionType: ActionType;
    targetContract?: `0x${string}`;
    functionSelector?: `0x${string}`;
    encodedParams?: `0x${string}`;
  };
}

// ─── Predefined Templates ───────────────────────────────────────────────────

export const FLOW_TEMPLATES: FlowTemplate[] = [
  // 1. Whale Alert
  {
    id: "whale-alert",
    name: "Whale Alert",
    description:
      "Monitor mUSDC transfers of 10,000 or more and emit an on-chain alert. " +
      "Useful for tracking large token movements on Somnia.",
    category: "monitoring",
    trigger: {
      triggerType: TriggerType.TOKEN_TRANSFER,
      emitterContract: MOCK_USDC_ADDRESS,
      eventSignature: TRANSFER_EVENT_SIG,
    },
    condition: {
      operator: ConditionOp.GTE,
      conditionType: "AMOUNT",
      threshold: BigInt(10_000), // 10,000 USDC (converted to wei at submit time)
      dataOffset: 0, // amount is the first (and only) non-indexed field in Transfer
    },
    action: {
      actionType: ActionType.EMIT_ALERT,
    },
  },

  // 2. Price Guardian
  {
    id: "price-guardian",
    name: "Price Guardian",
    description:
      "Watch the ETH/USD price via the DIA oracle and emit an alert when it " +
      "drops below a configurable threshold. Great for monitoring market crashes.",
    category: "monitoring",
    trigger: {
      triggerType: TriggerType.PRICE_THRESHOLD,
    },
    condition: {
      operator: ConditionOp.LT,
      conditionType: "PRICE",
      oracleOrDataSource: DIA_ORACLE,
      oracleKey: "ETH/USD",
      threshold: BigInt(2_000), // $2,000 USD (converted to 8 decimals at submit time)
    },
    action: {
      actionType: ActionType.EMIT_ALERT,
    },
  },

  // 3. Cross-Contract Orchestration
  {
    id: "cross-contract",
    name: "Cross-Contract Orchestration",
    description:
      "Listen for a custom event on any contract, then call a function on " +
      "another contract. Enables composable, event-driven cross-contract workflows.",
    category: "automation",
    trigger: {
      triggerType: TriggerType.CUSTOM_EVENT,
    },
    condition: {
      operator: ConditionOp.NONE,
    },
    action: {
      actionType: ActionType.CONTRACT_CALL,
    },
  },

  // 4. Smart DCA (Dollar Cost Averaging)
  {
    id: "smart-dca",
    name: "Smart DCA",
    description:
      "Perform a token swap every time a heartbeat event fires (e.g. periodic " +
      "keeper call). Automates dollar-cost-averaging into your chosen token pair.",
    category: "defi",
    trigger: {
      triggerType: TriggerType.CUSTOM_EVENT,
    },
    condition: {
      operator: ConditionOp.NONE,
    },
    action: {
      actionType: ActionType.SWAP_TOKENS,
    },
  },
];
