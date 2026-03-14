import {
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toHex,
  toBytes,
  type Address,
} from "viem";

// ─── Solidity Enum Mirrors ──────────────────────────────────────────────────

/** TriggerType enum values matching the contract */
export enum TriggerType {
  TOKEN_TRANSFER = 0,
  PRICE_THRESHOLD = 1,
  DEX_SWAP = 2,
  CUSTOM_EVENT = 3,
}

/** ConditionOp enum values matching the contract */
export enum ConditionOp {
  NONE = 0,
  GT = 1,
  LT = 2,
  GTE = 3,
  LTE = 4,
  EQ = 5,
  NEQ = 6,
}

/** ActionType enum values matching the contract */
export enum ActionType {
  TRANSFER_TOKEN = 0,
  SWAP_TOKENS = 1,
  CONTRACT_CALL = 2,
  EMIT_ALERT = 3,
}

// ─── Trigger Config Encoder ─────────────────────────────────────────────────

export interface TriggerConfigParams {
  triggerType: TriggerType;
  emitterContract: Address;
  eventSignature: `0x${string}`;
  topicFilters: [`0x${string}`, `0x${string}`, `0x${string}`];
}

/**
 * Build a TriggerConfig struct suitable for passing to `createFlow`.
 *
 * @param triggerType     - The trigger category (TOKEN_TRANSFER, PRICE_THRESHOLD, etc.)
 * @param emitterContract - The address of the contract emitting the event
 * @param eventSignature  - The keccak256 hash of the event signature (topic0)
 * @param topicFilters    - Up to 3 topic filters; use bytes32(0) for wildcards
 */
export function encodeTriggerConfig(
  triggerType: TriggerType,
  emitterContract: Address,
  eventSignature: `0x${string}`,
  topicFilters: [`0x${string}`, `0x${string}`, `0x${string}`] = [
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  ],
): TriggerConfigParams {
  return {
    triggerType,
    emitterContract,
    eventSignature,
    topicFilters,
  };
}

// ─── Condition Config Encoder ───────────────────────────────────────────────

export interface ConditionConfigParams {
  operator: ConditionOp;
  conditionType: `0x${string}`;
  oracleOrDataSource: Address;
  oracleKey: string;
  threshold: bigint;
  dataOffset: number;
}

/**
 * Build a ConditionConfig struct suitable for passing to `createFlow`.
 *
 * @param operator          - Comparison operator (GT, LT, GTE, LTE, EQ, NEQ, or NONE)
 * @param conditionType     - Either "PRICE" or "AMOUNT" (will be keccak256-hashed)
 * @param oracleOrDataSource - Address of the oracle (DIA) or data source
 * @param oracleKey         - Oracle price pair key, e.g. "ETH/USD"
 * @param threshold         - Numeric threshold to compare against
 * @param dataOffset        - Byte offset within event data to extract the value
 */
export function encodeConditionConfig(
  operator: ConditionOp,
  conditionType: string,
  oracleOrDataSource: Address,
  oracleKey: string,
  threshold: bigint,
  dataOffset: number,
): ConditionConfigParams {
  const conditionTypeHash = keccak256(toBytes(conditionType));

  return {
    operator,
    conditionType: conditionTypeHash,
    oracleOrDataSource,
    oracleKey,
    threshold,
    dataOffset,
  };
}

// ─── Action Config Encoder ──────────────────────────────────────────────────

export interface ActionConfigParams {
  actionType: ActionType;
  targetContract: Address;
  functionSelector: `0x${string}`;
  encodedParams: `0x${string}`;
}

/**
 * Build an ActionConfig struct suitable for passing to `createFlow`.
 *
 * @param actionType       - The action category (TRANSFER_TOKEN, SWAP_TOKENS, etc.)
 * @param targetContract   - Address of the contract to interact with (or token address for TRANSFER_TOKEN)
 * @param functionSelector - 4-byte function selector for CONTRACT_CALL / SWAP_TOKENS
 * @param encodedParams    - ABI-encoded parameters for the action
 */
export function encodeActionConfig(
  actionType: ActionType,
  targetContract: Address,
  functionSelector: `0x${string}`,
  encodedParams: `0x${string}`,
): ActionConfigParams {
  return {
    actionType,
    targetContract,
    functionSelector,
    encodedParams,
  };
}

// ─── Param Encoders ─────────────────────────────────────────────────────────

/**
 * Encode an alert message as bytes for EMIT_ALERT actions.
 * The contract reads this directly as `string(action.encodedParams)`.
 */
export function encodeAlertParams(message: string): `0x${string}` {
  return toHex(toBytes(message));
}

/**
 * Encode transfer parameters (recipient, amount) for TRANSFER_TOKEN actions.
 * The contract decodes these with `abi.decode(encodedParams, (address, uint256))`.
 */
export function encodeTransferParams(
  recipient: Address,
  amount: bigint,
): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters("address recipient, uint256 amount"),
    [recipient, amount],
  );
}

// ─── Utility ────────────────────────────────────────────────────────────────

/** Zero bytes32 constant, used as a wildcard in topic filters */
export const BYTES32_ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

/** Zero bytes4 constant, used when a function selector is not needed */
export const BYTES4_ZERO = "0x00000000" as `0x${string}`;

/** Zero address */
export const ADDRESS_ZERO =
  "0x0000000000000000000000000000000000000000" as Address;

/**
 * Compute the keccak256 hash of an event signature string.
 * Example: `eventSigHash("Transfer(address,address,uint256)")`.
 */
export function eventSigHash(sig: string): `0x${string}` {
  return keccak256(toBytes(sig));
}
