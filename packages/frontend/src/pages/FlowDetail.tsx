import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ArrowLeft, Pause, Play, Trash2, Loader2 } from "lucide-react";
import { formatUnits, decodeAbiParameters, parseAbiParameters } from "viem";
import { REACTIVE_FLOW_ABI, REACTIVE_FLOW_ADDRESS, getTokenByAddress } from "@/config/contracts";
import { useExecutionHistory } from "@/hooks/useExecutionHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
const CONDITION_LABELS = ["None", ">", "<", ">=", "<=", "==", "!="];
const ACTION_LABELS = [
  "Transfer Token",
  "Swap Tokens",
  "Contract Call",
  "Emit Alert",
];

export default function FlowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [pendingType, setPendingType] = useState<"pause" | "resume" | "delete" | null>(null);
  const flowId = BigInt(id || "0");

  const { data: flow, refetch } = useReadContract({
    address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
    abi: REACTIVE_FLOW_ABI,
    functionName: "getFlow",
    args: [flowId],
  }) as any;

  const { events } = useExecutionHistory(id);

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Connect your wallet to view flow details
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Loading flow...
      </div>
    );
  }

  const handlePause = () => {
    setPendingType("pause");
    writeContract(
      {
        address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
        abi: REACTIVE_FLOW_ABI,
        functionName: "pauseFlow",
        args: [flowId],
      },
      {
        onSuccess: () => setTimeout(() => refetch(), 2000),
        onSettled: () => setPendingType(null),
      },
    );
  };

  const handleResume = () => {
    setPendingType("resume");
    writeContract(
      {
        address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
        abi: REACTIVE_FLOW_ABI,
        functionName: "resumeFlow",
        args: [flowId],
      },
      {
        onSuccess: () => setTimeout(() => refetch(), 2000),
        onSettled: () => setPendingType(null),
      },
    );
  };

  const handleDelete = () => {
    setPendingType("delete");
    writeContract(
      {
        address: REACTIVE_FLOW_ADDRESS as `0x${string}`,
        abi: REACTIVE_FLOW_ABI,
        functionName: "deleteFlow",
        args: [flowId],
      },
      {
        onSuccess: () => navigate("/flows"),
        onSettled: () => setPendingType(null),
      },
    );
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6 gap-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className={`size-3 rounded-full ${
              flow.active ? "bg-emerald-500" : "bg-muted-foreground/30"
            }`}
          />
          <h1 className="text-2xl font-bold text-balance text-foreground">
            {flow.name}
          </h1>
          <Badge variant={flow.active ? "success" : "secondary"}>
            {flow.active ? "Active" : "Paused"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={flow.active ? handlePause : handleResume}
            disabled={isPending && pendingType !== null}
            className="gap-2"
          >
            {isPending && (pendingType === "pause" || pendingType === "resume") ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {pendingType === "pause" ? "Pausing…" : "Resuming…"}
              </>
            ) : flow.active ? (
              <>
                <Pause className="size-4" /> Pause
              </>
            ) : (
              <>
                <Play className="size-4" /> Resume
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isPending && pendingType !== null}
                className="gap-2"
              >
                {isPending && pendingType === "delete" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" /> Delete
                  </>
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
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Flow Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-primary">
              WHEN (Trigger)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">
              {TRIGGER_LABELS[flow.trigger.triggerType]}
            </p>
            <p className="text-sm text-muted-foreground break-all">
              Contract: {flow.trigger.emitterContract}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-amber-600">
              ONLY IF (Condition)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flow.condition.operator === 0 ? (
              <p className="font-semibold">No condition (always execute)</p>
            ) : (
              <>
                <p className="font-semibold mb-2">
                  Value {CONDITION_LABELS[flow.condition.operator]}{" "}
                  {flow.condition.oracleKey
                    ? `$${formatUnits(flow.condition.threshold, 8)}`
                    : (() => {
                        const token = getTokenByAddress(flow.trigger.emitterContract);
                        return token
                          ? `${formatUnits(flow.condition.threshold, token.decimals)} ${token.symbol}`
                          : flow.condition.threshold.toString();
                      })()}
                </p>
                {flow.condition.oracleKey && (
                  <p className="text-sm text-muted-foreground">
                    Oracle: {flow.condition.oracleKey}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-emerald-600">
              THEN (Action)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">
              {ACTION_LABELS[flow.action.actionType]}
            </p>
            {flow.action.actionType === 0 && flow.action.encodedParams && flow.action.encodedParams !== "0x" && (() => {
              try {
                const [recipient, amount] = decodeAbiParameters(
                  parseAbiParameters("address, uint256"),
                  flow.action.encodedParams,
                );
                const token = getTokenByAddress(flow.action.targetContract);
                return (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Token: {token ? token.symbol : flow.action.targetContract}</p>
                    <p>Recipient: <span className="break-all">{recipient}</span></p>
                    <p>Amount: {token ? `${formatUnits(amount, token.decimals)} ${token.symbol}` : amount.toString()}</p>
                  </div>
                );
              } catch {
                return null;
              }
            })()}
            {flow.action.actionType === 3 && flow.action.encodedParams && flow.action.encodedParams !== "0x" && (
              <p className="text-sm text-muted-foreground">
                Message: {(() => { try { return new TextDecoder().decode(Buffer.from(flow.action.encodedParams.slice(2), "hex")); } catch { return flow.action.encodedParams; } })()}
              </p>
            )}
            {flow.action.actionType !== 0 && flow.action.actionType !== 3 &&
              flow.action.targetContract !== "0x0000000000000000000000000000000000000000" && (
              <p className="text-sm text-muted-foreground break-all">
                Target: {flow.action.targetContract}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Flow ID</p>
              <p className="text-lg font-bold tabular-nums">
                #{flow.flowId.toString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Executions</p>
              <p className="text-lg font-bold tabular-nums">
                {Number(flow.executionCount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Executions</p>
              <p className="text-lg font-bold tabular-nums">
                {Number(flow.maxExecutions) === 0
                  ? "Unlimited"
                  : Number(flow.maxExecutions)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="text-lg font-bold font-mono">
                {flow.owner.slice(0, 6)}...{flow.owner.slice(-4)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No executions yet
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 size-2.5 shrink-0 rounded-full ${
                          event.type === "AlertEmitted"
                            ? "bg-amber-500"
                            : event.success
                              ? "bg-emerald-500"
                              : "bg-destructive"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {event.type === "AlertEmitted"
                            ? "Alert Emitted"
                            : event.success
                              ? "Executed Successfully"
                              : "Execution Failed"}
                        </p>
                        {event.message && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {event.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        event.type === "AlertEmitted"
                          ? "warning"
                          : event.success
                            ? "success"
                            : "destructive"
                      }
                    >
                      {event.type === "AlertEmitted"
                        ? "Alert"
                        : event.success
                          ? "Success"
                          : "Failed"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      Block {event.blockNumber}
                    </span>
                    <span className="tabular-nums">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                    <a
                      href={`https://shannon-explorer.somnia.network/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline underline-offset-4"
                    >
                      {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-6)}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
