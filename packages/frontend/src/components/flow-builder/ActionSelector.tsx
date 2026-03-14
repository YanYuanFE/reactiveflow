import { TokenSelector } from "@/components/shared/TokenSelector";
import { AddressInput } from "@/components/shared/AddressInput";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TOKENS } from "@/config/contracts";

const ACTION_TYPES = [
  {
    value: 3,
    label: "Emit Alert",
    description: "Emit an on-chain alert event",
  },
  {
    value: 0,
    label: "Transfer Token",
    description: "Transfer tokens to an address",
  },
  {
    value: 1,
    label: "Swap Tokens",
    description: "Swap tokens via DEX router",
  },
  {
    value: 2,
    label: "Call Contract",
    description: "Call any contract function",
  },
];

interface ActionConfig {
  actionType: number;
  targetContract: string;
  functionSelector: string;
  alertMessage: string;
  recipient: string;
  amount: string;
  tokenIn: string;
  minAmountOut: string;
  callData: string;
}

interface Props {
  value: ActionConfig;
  onChange: (value: ActionConfig) => void;
}

export function ActionSelector({ value, onChange }: Props) {
  const updateField = <K extends keyof ActionConfig>(
    field: K,
    val: ActionConfig[K],
  ) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block">Action Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {ACTION_TYPES.map((action) => (
            <button
              key={action.value}
              onClick={() => {
                onChange({
                  ...value,
                  actionType: action.value,
                  // Auto-set targetContract to first token for Transfer/Swap
                  targetContract:
                    action.value === 0 || action.value === 1
                      ? value.targetContract === "0x0000000000000000000000000000000000000000"
                        ? TOKENS[0].address
                        : value.targetContract
                      : value.targetContract,
                });
              }}
              className={cn(
                "p-4 rounded-xl border text-left transition-colors",
                value.actionType === action.value
                  ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                  : "hover:bg-accent",
              )}
            >
              <p className="font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* EMIT_ALERT */}
      {value.actionType === 3 && (
        <div>
          <Label htmlFor="alert-msg" className="mb-2 block">
            Alert Message
          </Label>
          <Input
            id="alert-msg"
            type="text"
            value={value.alertMessage}
            onChange={(e) => updateField("alertMessage", e.target.value)}
            placeholder="e.g. Whale transfer detected!"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This message will be emitted as an on-chain AlertEmitted event
          </p>
        </div>
      )}

      {/* TRANSFER_TOKEN */}
      {value.actionType === 0 && (
        <>
          <div>
            <Label className="mb-2 block">Token to Transfer</Label>
            <TokenSelector
              value={value.targetContract}
              onChange={(addr) => updateField("targetContract", addr)}
            />
          </div>
          <AddressInput
            value={value.recipient}
            onChange={(addr) => updateField("recipient", addr)}
            label="Recipient Address"
            placeholder="0x..."
          />
          <div>
            <Label htmlFor="transfer-amount" className="mb-2 block">
              Amount
            </Label>
            <Input
              id="transfer-amount"
              type="text"
              value={value.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              placeholder="e.g. 100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Human-readable amount (e.g. 100 USDC). Requires prior deposit.
            </p>
          </div>
        </>
      )}

      {/* SWAP_TOKENS */}
      {value.actionType === 1 && (
        <>
          <div>
            <Label className="mb-2 block">Token to Swap (Input)</Label>
            <TokenSelector
              value={value.tokenIn}
              onChange={(addr) => updateField("tokenIn", addr)}
            />
          </div>
          <div>
            <Label htmlFor="swap-amount" className="mb-2 block">
              Swap Amount
            </Label>
            <Input
              id="swap-amount"
              type="text"
              value={value.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              placeholder="e.g. 100"
            />
          </div>
          <AddressInput
            value={value.targetContract}
            onChange={(addr) => updateField("targetContract", addr)}
            label="DEX Router Address"
            placeholder="0x..."
          />
          <div>
            <Label htmlFor="func-selector" className="mb-2 block">
              Function Selector (4 bytes)
            </Label>
            <Input
              id="func-selector"
              type="text"
              value={value.functionSelector}
              onChange={(e) =>
                updateField("functionSelector", e.target.value)
              }
              placeholder="0x..."
              className="font-mono"
            />
          </div>
        </>
      )}

      {/* CONTRACT_CALL */}
      {value.actionType === 2 && (
        <>
          <AddressInput
            value={value.targetContract}
            onChange={(addr) => updateField("targetContract", addr)}
            label="Target Contract"
            placeholder="0x..."
          />
          <div>
            <Label htmlFor="call-selector" className="mb-2 block">
              Function Selector (4 bytes hex)
            </Label>
            <Input
              id="call-selector"
              type="text"
              value={value.functionSelector}
              onChange={(e) =>
                updateField("functionSelector", e.target.value)
              }
              placeholder="0x12345678"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="call-data" className="mb-2 block">
              Encoded Parameters (hex)
            </Label>
            <Textarea
              id="call-data"
              value={value.callData}
              onChange={(e) => updateField("callData", e.target.value)}
              placeholder="ABI-encoded parameters in hex"
              rows={3}
              className="font-mono"
            />
          </div>
        </>
      )}
    </div>
  );
}
