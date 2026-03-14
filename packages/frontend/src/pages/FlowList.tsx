import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { Plus, Zap, Pause, Play, Trash2, Loader2 } from "lucide-react";
import { useUserFlows } from "@/hooks/useUserFlows";
import { useWriteContract } from "wagmi";
import { REACTIVE_FLOW_ABI, REACTIVE_FLOW_ADDRESS } from "@/config/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TRIGGER_LABELS = [
  "Token Transfer",
  "Price Threshold",
  "DEX Swap",
  "Custom Event",
];
const ACTION_LABELS = [
  "Transfer Token",
  "Swap Tokens",
  "Contract Call",
  "Emit Alert",
];

export default function FlowList() {
  const { isConnected } = useAccount();
  const { flows, isLoading, refetch, markDeleted } = useUserFlows();
  const { writeContract, isPending } = useWriteContract();
  const [pendingAction, setPendingAction] = useState<{
    flowId: string;
    type: "pause" | "resume" | "delete";
  } | null>(null);

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Connect your wallet to view your flows
      </div>
    );
  }

  const isFlowPending = (flowId: bigint, type?: "pause" | "resume" | "delete") =>
    isPending &&
    pendingAction?.flowId === flowId.toString() &&
    (!type || pendingAction.type === type);

  const handlePause = (flowId: bigint) => {
    setPendingAction({ flowId: flowId.toString(), type: "pause" });
    writeContract(
      {
        address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
        abi: REACTIVE_FLOW_ABI,
        functionName: "pauseFlow",
        args: [flowId],
      },
      {
        onSuccess: () => setTimeout(() => refetch(), 2000),
        onSettled: () => setPendingAction(null),
      },
    );
  };

  const handleResume = (flowId: bigint) => {
    setPendingAction({ flowId: flowId.toString(), type: "resume" });
    writeContract(
      {
        address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
        abi: REACTIVE_FLOW_ABI,
        functionName: "resumeFlow",
        args: [flowId],
      },
      {
        onSuccess: () => setTimeout(() => refetch(), 2000),
        onSettled: () => setPendingAction(null),
      },
    );
  };

  const handleDelete = (flowId: bigint) => {
    setPendingAction({ flowId: flowId.toString(), type: "delete" });
    writeContract(
      {
        address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
        abi: REACTIVE_FLOW_ABI,
        functionName: "deleteFlow",
        args: [flowId],
      },
      {
        onSuccess: () => {
          markDeleted(flowId);
          setTimeout(() => refetch(), 2000);
        },
        onSettled: () => setPendingAction(null),
      },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-balance text-foreground">My Flows</h1>
          <p className="text-muted-foreground mt-1">
            {flows.length} flows created
          </p>
        </div>
        <Link to="/flows/create">
          <Button className="gap-2">
            <Plus className="size-4" />
            New Flow
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">
          Loading flows...
        </div>
      ) : flows.length === 0 ? (
        <div className="text-center py-20">
          <Zap className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No flows yet</p>
          <Link
            to="/flows/create"
            className="text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Create your first flow
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {flows.map((flow) => (
            <Card key={flow.flowId.toString()}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <Link
                    to={`/flows/${flow.flowId}`}
                    className="flex-1 hover:opacity-80"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`size-2.5 rounded-full ${
                          flow.active
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <h3 className="text-lg font-semibold">{flow.name}</h3>
                      <Badge variant={flow.active ? "success" : "secondary"}>
                        {flow.active ? "Active" : "Paused"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>
                        Trigger:{" "}
                        <span className="text-foreground">
                          {TRIGGER_LABELS[flow.trigger.triggerType] ||
                            "Unknown"}
                        </span>
                      </span>
                      <span>
                        Action:{" "}
                        <span className="text-foreground">
                          {ACTION_LABELS[flow.action.actionType] || "Unknown"}
                        </span>
                      </span>
                      <span>
                        Executions:{" "}
                        <span className="text-foreground tabular-nums">
                          {Number(flow.executionCount)}
                          {flow.maxExecutions > 0n
                            ? ` / ${Number(flow.maxExecutions)}`
                            : ""}
                        </span>
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isFlowPending(flow.flowId)}
                      onClick={() =>
                        flow.active
                          ? handlePause(flow.flowId)
                          : handleResume(flow.flowId)
                      }
                      aria-label={flow.active ? "Pause flow" : "Resume flow"}
                    >
                      {isFlowPending(flow.flowId, "pause") || isFlowPending(flow.flowId, "resume") ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : flow.active ? (
                        <Pause className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={isFlowPending(flow.flowId)}
                          aria-label="Delete flow"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {isFlowPending(flow.flowId, "delete") ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this flow?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{flow.name}" from the blockchain. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(flow.flowId)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
