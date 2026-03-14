import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { Plus, Zap, Activity, Wallet } from "lucide-react";
import { useUserFlows } from "@/hooks/useUserFlows";
import { useExecutionHistory } from "@/hooks/useExecutionHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/shared/Logo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { flows, flowCount, isLoading } = useUserFlows();
  const { events } = useExecutionHistory();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-[#1e1b4b] mb-6">
          <LogoIcon size={44} />
        </div>
        <h1 className="text-4xl font-bold text-balance mb-4 text-foreground">
          ReactiveFlow
        </h1>
        <p className="text-pretty text-lg text-muted-foreground mb-8 max-w-md">
          On-chain IFTTT workflow orchestrator for Somnia. Create automated
          flows without writing Solidity.
        </p>
        <p className="text-muted-foreground">
          Connect your wallet to get started
        </p>
      </div>
    );
  }

  const activeFlows = flows.filter((f) => f.active).length;
  const totalExecutions = flows.reduce(
    (sum, f) => sum + Number(f.executionCount),
    0,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-balance text-foreground">
            Dashboard
          </h1>
          <p className="text-pretty text-muted-foreground mt-1">
            Overview of your reactive flows
          </p>
        </div>
        <Link to="/flows/create">
          <Button className="gap-2">
            <Plus className="size-4" />
            New Flow
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="size-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                Active Flows
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums">{activeFlows}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Activity className="size-5 text-emerald-600" />
              </div>
              <span className="text-sm text-muted-foreground">
                Total Executions
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {totalExecutions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Wallet className="size-5 text-amber-600" />
              </div>
              <span className="text-sm text-muted-foreground">
                Total Flows
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {Number(flowCount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Flows */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Flows</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading flows...</p>
          ) : flows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No flows yet</p>
              <Link
                to="/flows/create"
                className="text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Create your first flow
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {flows.slice(0, 5).map((flow) => (
                <Link
                  key={flow.flowId.toString()}
                  to={`/flows/${flow.flowId}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-2 rounded-full ${
                        flow.active
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{flow.name}</p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {Number(flow.executionCount)} executions
                      </p>
                    </div>
                  </div>
                  <Badge variant={flow.active ? "success" : "secondary"}>
                    {flow.active ? "Active" : "Paused"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No executions yet
            </p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-2 shrink-0 rounded-full ${
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
                          ? "Alert"
                          : "Execution"}{" "}
                        — Flow #{event.flowId}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {event.message ||
                          (event.success ? "Success" : "Failed")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span className="hidden tabular-nums sm:inline">
                      Block {event.blockNumber}
                    </span>
                    <span className="tabular-nums">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <a
                      href={`https://shannon-explorer.somnia.network/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline underline-offset-4"
                    >
                      TX
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
