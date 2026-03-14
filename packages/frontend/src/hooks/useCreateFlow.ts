import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { REACTIVE_FLOW_ABI, REACTIVE_FLOW_ADDRESS } from "@/config/contracts";

/** Enum mirrors for the Solidity TriggerType / ConditionOp / ActionType */
export enum TriggerType {
  TOKEN_TRANSFER = 0,
  PRICE_THRESHOLD = 1,
  DEX_SWAP = 2,
  CUSTOM_EVENT = 3,
}

export enum ConditionOp {
  NONE = 0,
  GT = 1,
  LT = 2,
  GTE = 3,
  LTE = 4,
  EQ = 5,
  NEQ = 6,
}

export enum ActionType {
  TRANSFER_TOKEN = 0,
  SWAP_TOKENS = 1,
  CONTRACT_CALL = 2,
  EMIT_ALERT = 3,
}

export interface TriggerConfig {
  triggerType: TriggerType;
  emitterContract: `0x${string}`;
  eventSignature: `0x${string}`;
  topicFilters: readonly [`0x${string}`, `0x${string}`, `0x${string}`];
}

export interface ConditionConfig {
  operator: ConditionOp;
  conditionType: `0x${string}`;
  oracleOrDataSource: `0x${string}`;
  oracleKey: string;
  threshold: bigint;
  dataOffset: number;
}

export interface ActionConfig {
  actionType: ActionType;
  targetContract: `0x${string}`;
  functionSelector: `0x${string}`;
  encodedParams: `0x${string}`;
}

export interface CreateFlowParams {
  name: string;
  trigger: TriggerConfig;
  condition: ConditionConfig;
  action: ActionConfig;
  maxExecutions: bigint;
}

export function useCreateFlow() {
  const {
    writeContract,
    data: txHash,
    isPending,
    isSuccess,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  function createFlow(params: CreateFlowParams) {
    writeContract({
      address: REACTIVE_FLOW_ADDRESS,
      abi: REACTIVE_FLOW_ABI,
      functionName: "createFlow",
      args: [
        params.name,
        params.trigger,
        params.condition,
        params.action,
        params.maxExecutions,
      ],
    });
  }

  return {
    createFlow,
    writeContract,
    txHash,
    isPending,
    isSuccess,
    isConfirming,
    isConfirmed,
    error,
    reset,
  };
}
