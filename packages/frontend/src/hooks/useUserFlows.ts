import { useState, useCallback } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { REACTIVE_FLOW_ABI, REACTIVE_FLOW_ADDRESS } from "@/config/contracts";
import type {
  TriggerType,
  ConditionOp,
  ActionType,
} from "./useCreateFlow";

// ─── Types matching the Solidity Flow struct ────────────────────────────────

export interface FlowTriggerConfig {
  triggerType: TriggerType;
  emitterContract: `0x${string}`;
  eventSignature: `0x${string}`;
  topicFilters: readonly [`0x${string}`, `0x${string}`, `0x${string}`];
}

export interface FlowConditionConfig {
  operator: ConditionOp;
  conditionType: `0x${string}`;
  oracleOrDataSource: `0x${string}`;
  oracleKey: string;
  threshold: bigint;
  dataOffset: number;
}

export interface FlowActionConfig {
  actionType: ActionType;
  targetContract: `0x${string}`;
  functionSelector: `0x${string}`;
  encodedParams: `0x${string}`;
}

export interface Flow {
  flowId: bigint;
  owner: `0x${string}`;
  name: string;
  trigger: FlowTriggerConfig;
  condition: FlowConditionConfig;
  action: FlowActionConfig;
  active: boolean;
  deleted: boolean;
  executionCount: bigint;
  maxExecutions: bigint;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useUserFlows() {
  const { address } = useAccount();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const markDeleted = useCallback((flowId: bigint) => {
    setDeletedIds((prev) => new Set(prev).add(flowId.toString()));
  }, []);

  // 1. Read the user's flow count
  const {
    data: flowCount,
    isLoading: isLoadingCount,
    refetch: refetchCount,
  } = useReadContract({
    address: REACTIVE_FLOW_ADDRESS,
    abi: REACTIVE_FLOW_ABI,
    functionName: "getUserFlowCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 2. Read the user's flowId array
  const {
    data: flowIds,
    isLoading: isLoadingIds,
    refetch: refetchIds,
  } = useReadContract({
    address: REACTIVE_FLOW_ADDRESS,
    abi: REACTIVE_FLOW_ABI,
    functionName: "getUserFlows",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 3. For each flowId, batch-read the full Flow struct via getFlow(flowId)
  const flowCalls = (flowIds ?? []).map((id) => ({
    address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
    abi: REACTIVE_FLOW_ABI,
    functionName: "getFlow" as const,
    args: [id] as const,
  }));

  const {
    data: flowResults,
    isLoading: isLoadingFlows,
    refetch: refetchFlows,
  } = useReadContracts({
    contracts: flowCalls,
    query: {
      enabled: flowCalls.length > 0,
    },
  });

  // 4. Map raw results into typed Flow objects, filtering out deleted flows
  const flows: Flow[] = (flowResults ?? [])
    .filter((result) => result.status === "success" && result.result != null)
    .map((result) => result.result as unknown as Flow)
    .filter((flow) => !flow.deleted && !deletedIds.has(flow.flowId.toString()));

  const isLoading = isLoadingCount || isLoadingIds || isLoadingFlows;

  async function refetch() {
    await Promise.all([refetchCount(), refetchIds(), refetchFlows()]);
  }

  return {
    flows,
    flowIds: flowIds ?? [],
    flowCount: flowCount ?? BigInt(0),
    isLoading,
    refetch,
    markDeleted,
  };
}
