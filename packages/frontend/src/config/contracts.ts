// ─── Deployed Contract Addresses ────────────────────────────────────────────

/** ReactiveFlow core contract -- fill in after deployment */
export const REACTIVE_FLOW_ADDRESS = "0x3d0504bbf7a41138da1a48e84accb1ab393d2b3f" as `0x${string}`;

/** ERC-20 tokens available on Somnia testnet */
export const MOCK_USDC_ADDRESS =
  "0x99b143A677f49B13053Ec99C5fB16116bf0A49Ff" as `0x${string}`;

/** DIA oracle v2 deployment on Somnia testnet */
export const DIA_ORACLE =
  "0xbA0E0750A56e995506CA458b2BdD752754CF39C4" as `0x${string}`;

/** Somnia reactivity precompile -- system address for event subscriptions */
export const REACTIVITY_PRECOMPILE =
  "0x0000000000000000000000000000000000000100" as `0x${string}`;

// ─── Token Registry ─────────────────────────────────────────────────────────

export interface TokenInfo {
  label: string;
  address: `0x${string}`;
  decimals: number;
  symbol: string;
}

export const TOKENS: TokenInfo[] = [
  {
    label: "Mock USDC (Testnet)",
    address: MOCK_USDC_ADDRESS,
    decimals: 18,
    symbol: "mUSDC",
  },
];

/** Look up a token by its address (case-insensitive) */
export const getTokenByAddress = (address: string): TokenInfo | undefined =>
  TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());

/** Look up a token by its symbol */
export const getTokenBySymbol = (symbol: string): TokenInfo | undefined =>
  TOKENS.find((t) => t.symbol === symbol);

// ─── Well-known Event Signatures ────────────────────────────────────────────

/** keccak256("Transfer(address,address,uint256)") */
export const TRANSFER_EVENT_SIG =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as `0x${string}`;

// ─── ReactiveFlow ABI ───────────────────────────────────────────────────────

export const REACTIVE_FLOW_ABI = [
  // ── Flow CRUD ───────────────────────────────────────────────────────────
  {
    name: "createFlow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      {
        name: "trigger",
        type: "tuple",
        components: [
          { name: "triggerType", type: "uint8" },
          { name: "emitterContract", type: "address" },
          { name: "eventSignature", type: "bytes32" },
          { name: "topicFilters", type: "bytes32[3]" },
        ],
      },
      {
        name: "condition",
        type: "tuple",
        components: [
          { name: "operator", type: "uint8" },
          { name: "conditionType", type: "bytes32" },
          { name: "oracleOrDataSource", type: "address" },
          { name: "oracleKey", type: "string" },
          { name: "threshold", type: "uint256" },
          { name: "dataOffset", type: "uint8" },
        ],
      },
      {
        name: "action",
        type: "tuple",
        components: [
          { name: "actionType", type: "uint8" },
          { name: "targetContract", type: "address" },
          { name: "functionSelector", type: "bytes4" },
          { name: "encodedParams", type: "bytes" },
        ],
      },
      { name: "maxExecutions", type: "uint256" },
    ],
    outputs: [{ name: "flowId", type: "uint256" }],
  },
  {
    name: "pauseFlow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "flowId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "resumeFlow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "flowId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "deleteFlow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "flowId", type: "uint256" }],
    outputs: [],
  },

  // ── Deposit / Withdraw ──────────────────────────────────────────────────
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },

  // ── View Functions ──────────────────────────────────────────────────────
  {
    name: "getFlow",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "flowId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "flowId", type: "uint256" },
          { name: "owner", type: "address" },
          { name: "name", type: "string" },
          {
            name: "trigger",
            type: "tuple",
            components: [
              { name: "triggerType", type: "uint8" },
              { name: "emitterContract", type: "address" },
              { name: "eventSignature", type: "bytes32" },
              { name: "topicFilters", type: "bytes32[3]" },
            ],
          },
          {
            name: "condition",
            type: "tuple",
            components: [
              { name: "operator", type: "uint8" },
              { name: "conditionType", type: "bytes32" },
              { name: "oracleOrDataSource", type: "address" },
              { name: "oracleKey", type: "string" },
              { name: "threshold", type: "uint256" },
              { name: "dataOffset", type: "uint8" },
            ],
          },
          {
            name: "action",
            type: "tuple",
            components: [
              { name: "actionType", type: "uint8" },
              { name: "targetContract", type: "address" },
              { name: "functionSelector", type: "bytes4" },
              { name: "encodedParams", type: "bytes" },
            ],
          },
          { name: "active", type: "bool" },
          { name: "deleted", type: "bool" },
          { name: "executionCount", type: "uint256" },
          { name: "maxExecutions", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getUserFlows",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getUserFlowCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getDeposit",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ── Events ──────────────────────────────────────────────────────────────
  {
    name: "FlowCreated",
    type: "event",
    inputs: [
      { name: "flowId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
  {
    name: "FlowPaused",
    type: "event",
    inputs: [{ name: "flowId", type: "uint256", indexed: true }],
  },
  {
    name: "FlowResumed",
    type: "event",
    inputs: [{ name: "flowId", type: "uint256", indexed: true }],
  },
  {
    name: "FlowDeleted",
    type: "event",
    inputs: [{ name: "flowId", type: "uint256", indexed: true }],
  },
  {
    name: "FlowExecuted",
    type: "event",
    inputs: [
      { name: "flowId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "success", type: "bool", indexed: false },
      { name: "returnData", type: "bytes", indexed: false },
    ],
  },
  {
    name: "AlertEmitted",
    type: "event",
    inputs: [
      { name: "flowId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "message", type: "string", indexed: false },
      { name: "data", type: "bytes", indexed: false },
    ],
  },
  {
    name: "Deposited",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Withdrawn",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
