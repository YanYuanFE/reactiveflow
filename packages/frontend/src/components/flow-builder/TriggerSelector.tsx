import { useState } from "react";
import { TokenSelector } from "@/components/shared/TokenSelector";
import { AddressInput } from "@/components/shared/AddressInput";
import { TOKENS, TRANSFER_EVENT_SIG } from "@/config/contracts";
import { keccak256, toHex } from "viem";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TRIGGER_TYPES = [
  {
    value: 0,
    label: "Token Transfer",
    description: "Triggered when a token transfer occurs",
  },
  {
    value: 1,
    label: "Price Threshold",
    description: "Triggered by oracle price updates",
  },
  {
    value: 2,
    label: "DEX Swap",
    description: "Triggered by DEX swap events",
  },
  {
    value: 3,
    label: "Custom Event",
    description: "Triggered by any custom contract event",
  },
];

interface TriggerConfig {
  triggerType: number;
  emitterContract: string;
  eventSignature: string;
  topicFilters: [string, string, string];
}

interface Props {
  value: TriggerConfig;
  onChange: (value: TriggerConfig) => void;
}

export function TriggerSelector({ value, onChange }: Props) {
  const [eventSigInput, setEventSigInput] = useState("");

  const updateField = <K extends keyof TriggerConfig>(
    field: K,
    val: TriggerConfig[K],
  ) => {
    onChange({ ...value, [field]: val });
  };

  const handleTriggerTypeChange = (type: number) => {
    const update: Partial<TriggerConfig> = { triggerType: type };

    if (type === 0) {
      update.eventSignature = TRANSFER_EVENT_SIG;
    } else if (type === 1) {
      update.emitterContract = "0xbA0E0750A56e995506CA458b2BdD752754CF39C4";
      update.eventSignature = keccak256(
        toHex("OracleUpdate(string,uint128,uint128)"),
      );
    }

    onChange({ ...value, ...update });
  };

  const handleTokenSelect = (address: string) => {
    onChange({
      ...value,
      emitterContract: address,
      eventSignature: TRANSFER_EVENT_SIG,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block">Trigger Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {TRIGGER_TYPES.map((trigger) => (
            <button
              key={trigger.value}
              onClick={() => handleTriggerTypeChange(trigger.value)}
              className={cn(
                "p-4 rounded-xl border text-left transition-colors",
                value.triggerType === trigger.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-accent",
              )}
            >
              <p className="font-medium text-foreground">{trigger.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {trigger.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {value.triggerType === 0 && (
        <div>
          <Label className="mb-2 block">Token to Monitor</Label>
          <div className="flex gap-3">
            <div className="flex-1">
              <TokenSelector
                value={value.emitterContract}
                onChange={handleTokenSelect}
              />
            </div>
            <div className="text-center text-muted-foreground text-sm self-center px-2">
              or
            </div>
            <div className="flex-1">
              <AddressInput
                value={
                  TOKENS.some((t) => t.address === value.emitterContract)
                    ? ""
                    : value.emitterContract
                }
                onChange={(addr) => updateField("emitterContract", addr)}
                placeholder="Custom contract address"
              />
            </div>
          </div>
        </div>
      )}

      {(value.triggerType === 2 || value.triggerType === 3) && (
        <>
          <AddressInput
            value={value.emitterContract}
            onChange={(addr) => updateField("emitterContract", addr)}
            label="Contract Address"
            placeholder="0x..."
          />
          {value.triggerType === 3 && (
            <div>
              <Label htmlFor="event-sig" className="mb-2 block">
                Event Signature
              </Label>
              <Input
                id="event-sig"
                type="text"
                value={eventSigInput}
                onChange={(e) => {
                  const input = e.target.value;
                  setEventSigInput(input);
                  if (input.startsWith("0x") && input.length === 66) {
                    updateField("eventSignature", input);
                  } else if (input.includes("(") && input.includes(")")) {
                    updateField("eventSignature", keccak256(toHex(input)));
                  }
                }}
                placeholder="Transfer(address,address,uint256)"
                className="font-mono"
              />
              {value.eventSignature.startsWith("0x") && value.eventSignature.length === 66 && (
                <p className="text-xs text-emerald-600 mt-1 font-mono text-xs truncate">
                  {value.eventSignature}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Enter event signature like Transfer(address,address,uint256), keccak256 hash is computed automatically
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
