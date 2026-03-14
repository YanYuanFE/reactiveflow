import { useNavigate } from "react-router-dom";
import { Zap, Shield, Link2, TrendingDown } from "lucide-react";
import {
  FLOW_TEMPLATES,
  TriggerType,
  ConditionOp,
  ActionType,
} from "@/config/templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ICONS: Record<string, any> = {
  "whale-alert": Zap,
  "price-guardian": Shield,
  "cross-contract": Link2,
  "smart-dca": TrendingDown,
};

const TRIGGER_LABELS: Record<number, string> = {
  [TriggerType.TOKEN_TRANSFER]: "Token Transfer event",
  [TriggerType.PRICE_THRESHOLD]: "Price oracle update",
  [TriggerType.DEX_SWAP]: "DEX swap event",
  [TriggerType.CUSTOM_EVENT]: "Custom contract event",
};

const CONDITION_LABELS: Record<number, string> = {
  [ConditionOp.NONE]: "No condition",
  [ConditionOp.GT]: "Value > threshold",
  [ConditionOp.LT]: "Value < threshold",
  [ConditionOp.GTE]: "Value >= threshold",
  [ConditionOp.LTE]: "Value <= threshold",
  [ConditionOp.EQ]: "Value == threshold",
  [ConditionOp.NEQ]: "Value != threshold",
};

const ACTION_LABELS: Record<number, string> = {
  [ActionType.TRANSFER_TOKEN]: "Transfer tokens",
  [ActionType.SWAP_TOKENS]: "Swap tokens via DEX",
  [ActionType.CONTRACT_CALL]: "Call contract function",
  [ActionType.EMIT_ALERT]: "Emit on-chain alert",
};

export default function Templates() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-balance text-foreground">Flow Templates</h1>
        <p className="text-pretty text-muted-foreground mt-1">
          Start with a pre-built template and customize to your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FLOW_TEMPLATES.map((template) => {
          const Icon = ICONS[template.id] || Zap;

          return (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-balance">
                      {template.name}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      {template.category}
                    </Badge>
                  </div>
                </div>

                <p className="text-pretty text-sm text-muted-foreground mb-6">
                  {template.description}
                </p>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-medium w-16">WHEN</span>
                    <span className="text-muted-foreground">
                      {TRIGGER_LABELS[template.trigger.triggerType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 font-medium w-16">IF</span>
                    <span className="text-muted-foreground">
                      {CONDITION_LABELS[template.condition.operator]}
                      {template.condition.oracleKey
                        ? ` (${template.condition.oracleKey})`
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-medium w-16">THEN</span>
                    <span className="text-muted-foreground">
                      {ACTION_LABELS[template.action.actionType]}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    navigate("/flows/create", {
                      state: { template: template.id },
                    })
                  }
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
