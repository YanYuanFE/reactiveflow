import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { TriggerSelector } from "@/components/flow-builder/TriggerSelector";
import { ConditionBuilder } from "@/components/flow-builder/ConditionBuilder";
import { ActionSelector } from "@/components/flow-builder/ActionSelector";
import { useCreateFlow } from "@/hooks/useCreateFlow";
import { FLOW_TEMPLATES } from "@/config/templates";
import {
  TRANSFER_EVENT_SIG,
  TOKENS,
  getTokenByAddress,
} from "@/config/contracts";
import { encodeAlertParams, encodeTransferParams } from "@/lib/flow-encoder";
import {
  keccak256,
  toHex,
  encodeAbiParameters,
  parseAbiParameters,
  parseUnits,
} from "viem";
import { createSubscription } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  { label: "Trigger", description: "WHEN this happens..." },
  { label: "Condition", description: "ONLY IF..." },
  { label: "Action", description: "THEN do this..." },
  { label: "Review", description: "Review & Create" },
];

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export default function CreateFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useAccount();
  const { createFlow, isPending, isConfirming, isConfirmed } = useCreateFlow();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [maxExecutions, setMaxExecutions] = useState("0");

  const [trigger, setTrigger] = useState({
    triggerType: 0,
    emitterContract: TOKENS[0].address as string,
    eventSignature: TRANSFER_EVENT_SIG as string,
    topicFilters: [ZERO_BYTES32, ZERO_BYTES32, ZERO_BYTES32] as [
      string,
      string,
      string,
    ],
  });

  const [condition, setCondition] = useState({
    operator: 0,
    conditionType: "AMOUNT",
    oracleOrDataSource: "0x0000000000000000000000000000000000000000",
    oracleKey: "",
    threshold: "",
    dataOffset: 0,
  });

  const [action, setAction] = useState({
    actionType: 3,
    targetContract: TOKENS[0].address as string,
    functionSelector: "0x00000000",
    alertMessage: "Alert triggered!",
    recipient: "",
    amount: "",
    tokenIn: TOKENS[0].address as string,
    minAmountOut: "0",
    callData: "",
  });

  useEffect(() => {
    const templateId = location.state?.template;
    if (!templateId) return;

    const template = FLOW_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setName(template.name);

    setTrigger((prev) => ({
      ...prev,
      triggerType: template.trigger.triggerType,
      emitterContract:
        template.trigger.emitterContract || prev.emitterContract,
      eventSignature:
        template.trigger.eventSignature || TRANSFER_EVENT_SIG,
    }));

    setCondition((prev) => ({
      ...prev,
      operator: template.condition.operator,
      conditionType:
        template.condition.conditionType || prev.conditionType,
      oracleOrDataSource:
        template.condition.oracleOrDataSource || prev.oracleOrDataSource,
      oracleKey: template.condition.oracleKey || prev.oracleKey,
      threshold:
        template.condition.threshold?.toString() || prev.threshold,
      dataOffset: template.condition.dataOffset ?? prev.dataOffset,
    }));

    setAction((prev) => ({
      ...prev,
      actionType: template.action.actionType,
      targetContract:
        template.action.targetContract || prev.targetContract,
      functionSelector:
        template.action.functionSelector || prev.functionSelector,
    }));
  }, [location.state]);

  useEffect(() => {
    if (isConfirmed) {
      createSubscription(
        trigger.emitterContract,
        trigger.eventSignature,
        name || "Unnamed Flow",
      ).catch(() => {});
      setTimeout(() => navigate("/flows"), 1500);
    }
  }, [isConfirmed, navigate]);

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Connect your wallet to create a flow
      </div>
    );
  }

  const handleCreate = async () => {
    let encodedParams: `0x${string}` = "0x";

    // Resolve token decimals for amount conversion
    const getDecimals = (addr: string) =>
      getTokenByAddress(addr)?.decimals ?? 18;

    if (action.actionType === 3) {
      encodedParams = encodeAlertParams(action.alertMessage);
    } else if (action.actionType === 0) {
      const decimals = getDecimals(action.targetContract);
      encodedParams = encodeTransferParams(
        action.recipient as `0x${string}`,
        parseUnits(action.amount || "0", decimals),
      );
    } else if (action.actionType === 1) {
      const decimals = getDecimals(action.tokenIn);
      encodedParams = encodeAbiParameters(
        parseAbiParameters("address, uint256, uint256"),
        [
          action.tokenIn as `0x${string}`,
          parseUnits(action.amount || "0", decimals),
          parseUnits(action.minAmountOut || "0", decimals),
        ],
      );
    } else if (action.actionType === 2) {
      encodedParams = (action.callData || "0x") as `0x${string}`;
    }

    // Convert condition threshold: PRICE uses 8 decimals (DIA Oracle),
    // AMOUNT uses the emitter token's decimals
    let thresholdWei = 0n;
    if (condition.operator !== 0 && condition.threshold) {
      if (condition.conditionType === "PRICE") {
        thresholdWei = parseUnits(condition.threshold, 8);
      } else {
        const emitterDecimals = getDecimals(trigger.emitterContract);
        thresholdWei = parseUnits(condition.threshold, emitterDecimals);
      }
    }

    const conditionTypeHash =
      condition.operator === 0
        ? ZERO_BYTES32
        : keccak256(toHex(condition.conditionType));

    createFlow({
      name: name || "Unnamed Flow",
      trigger: {
        triggerType: trigger.triggerType,
        emitterContract: trigger.emitterContract as `0x${string}`,
        eventSignature: trigger.eventSignature as `0x${string}`,
        topicFilters: trigger.topicFilters as [
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
        ],
      },
      condition: {
        operator: condition.operator,
        conditionType: conditionTypeHash as `0x${string}`,
        oracleOrDataSource:
          condition.oracleOrDataSource as `0x${string}`,
        oracleKey: condition.oracleKey,
        threshold: thresholdWei,
        dataOffset: condition.dataOffset,
      },
      action: {
        actionType: action.actionType,
        targetContract: action.targetContract as `0x${string}`,
        functionSelector: action.functionSelector as `0x${string}`,
        encodedParams,
      },
      maxExecutions: BigInt(maxExecutions || "0"),
    });

  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-2",
                i <= step ? "text-foreground" : "text-muted-foreground/50",
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-medium",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </div>
              <span className="hidden sm:inline text-sm">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-12 sm:w-20 h-px mx-2",
                  i < step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{STEPS[step].description}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === 0 && "Choose what event triggers your flow"}
            {step === 1 &&
              "Set optional conditions for when the flow should execute"}
            {step === 2 && "Define what action to take when triggered"}
            {step === 3 && "Review your flow configuration before creating"}
          </p>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <TriggerSelector value={trigger} onChange={setTrigger} />
          )}
          {step === 1 && (
            <ConditionBuilder
              value={condition}
              onChange={setCondition}
              triggerType={trigger.triggerType}
            />
          )}
          {step === 2 && (
            <ActionSelector value={action} onChange={setAction} />
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="flow-name">Flow Name</Label>
                <Input
                  id="flow-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Whale Alert"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="max-exec">
                  Max Executions (0 = unlimited)
                </Label>
                <Input
                  id="max-exec"
                  type="number"
                  value={maxExecutions}
                  onChange={(e) => setMaxExecutions(e.target.value)}
                  className="mt-2"
                  min={0}
                />
              </div>

              {/* Review Summary */}
              <div className="space-y-3 pt-4 border-t">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">WHEN (Trigger)</p>
                  <p className="text-sm text-muted-foreground">
                    {
                      [
                        "Token Transfer",
                        "Price Threshold",
                        "DEX Swap",
                        "Custom Event",
                      ][trigger.triggerType]
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                    Contract: {trigger.emitterContract}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-600 mb-1">ONLY IF (Condition)</p>
                  <p className="text-sm text-muted-foreground">
                    {condition.operator === 0
                      ? "No condition (always execute)"
                      : `${condition.conditionType} ${["", ">", "<", ">=", "<=", "==", "!="][condition.operator]} ${condition.threshold}`}
                  </p>
                  {condition.oracleKey && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Oracle: {condition.oracleKey}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-600 mb-1">THEN (Action)</p>
                  <p className="text-sm text-muted-foreground">
                    {
                      [
                        "Transfer Token",
                        "Swap Tokens",
                        "Contract Call",
                        "Emit Alert",
                      ][action.actionType]
                    }
                  </p>
                  {action.actionType === 3 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Message: {action.alertMessage}
                    </p>
                  )}
                  {action.actionType === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      To: {action.recipient} | Amount: {action.amount}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-2"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} className="gap-2">
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={isPending || isConfirming || isConfirmed}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Confirm in Wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : isConfirmed ? (
              <>
                <Check className="size-4" />
                Created!
              </>
            ) : (
              "Create Flow"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
