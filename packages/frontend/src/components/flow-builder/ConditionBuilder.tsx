import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONDITION_OPS = [
  { value: 0, label: "No Condition", description: "Always execute" },
  {
    value: 1,
    label: "Greater Than (>)",
    description: "Value must be greater than threshold",
  },
  {
    value: 2,
    label: "Less Than (<)",
    description: "Value must be less than threshold",
  },
  {
    value: 3,
    label: "Greater or Equal (>=)",
    description: "Value must be >= threshold",
  },
  {
    value: 4,
    label: "Less or Equal (<=)",
    description: "Value must be <= threshold",
  },
  {
    value: 5,
    label: "Equal (==)",
    description: "Value must equal threshold",
  },
  {
    value: 6,
    label: "Not Equal (!=)",
    description: "Value must not equal threshold",
  },
];

const CONDITION_TYPES = [
  {
    value: "AMOUNT",
    label: "Event Amount",
    description: "Extract value from event data",
  },
  {
    value: "PRICE",
    label: "Oracle Price",
    description: "Read from DIA Oracle",
  },
];

interface ConditionConfig {
  operator: number;
  conditionType: string;
  oracleOrDataSource: string;
  oracleKey: string;
  threshold: string;
  dataOffset: number;
}

interface Props {
  value: ConditionConfig;
  onChange: (value: ConditionConfig) => void;
  triggerType: number;
}

export function ConditionBuilder({ value, onChange, triggerType }: Props) {
  const updateField = <K extends keyof ConditionConfig>(
    field: K,
    val: ConditionConfig[K],
  ) => {
    onChange({ ...value, [field]: val });
  };

  const handleCondTypeChange = (type: string) => {
    const update: Partial<ConditionConfig> = {
      conditionType: type,
    };

    if (type === "PRICE") {
      update.oracleOrDataSource =
        "0xbA0E0750A56e995506CA458b2BdD752754CF39C4";
      update.oracleKey = "ETH/USD";
    } else {
      update.oracleOrDataSource =
        "0x0000000000000000000000000000000000000000";
      update.oracleKey = "";
      update.dataOffset = 0;
    }

    onChange({ ...value, ...update });
  };

  return (
    <div className="space-y-6">
      {/* Operator Selection */}
      <div>
        <Label className="mb-3 block">Condition</Label>
        <div className="grid grid-cols-2 gap-2">
          {CONDITION_OPS.map((op) => (
            <button
              key={op.value}
              onClick={() => updateField("operator", op.value)}
              className={cn(
                "p-3 rounded-lg border text-left transition-colors text-sm",
                value.operator === op.value
                  ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                  : "hover:bg-accent",
              )}
            >
              <p className="font-medium text-foreground">{op.label}</p>
              <p className="text-xs text-muted-foreground">{op.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Condition details */}
      {value.operator !== 0 && (
        <>
          <div>
            <Label className="mb-3 block">Data Source</Label>
            <div className="grid grid-cols-2 gap-3">
              {CONDITION_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => handleCondTypeChange(ct.value)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-colors",
                    value.conditionType === ct.value
                      ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                      : "hover:bg-accent",
                  )}
                >
                  <p className="font-medium text-foreground">{ct.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {ct.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {value.conditionType === "PRICE" && (
            <div>
              <Label htmlFor="oracle-key" className="mb-2 block">
                Oracle Key
              </Label>
              <select
                id="oracle-key"
                value={value.oracleKey}
                onChange={(e) => updateField("oracleKey", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ETH/USD">ETH/USD</option>
                <option value="BTC/USD">BTC/USD</option>
                <option value="SOL/USD">SOL/USD</option>
                <option value="AVAX/USD">AVAX/USD</option>
              </select>
            </div>
          )}

          {value.conditionType === "AMOUNT" && (
            <div>
              <Label htmlFor="data-offset" className="mb-2 block">
                Data Offset (bytes)
              </Label>
              <Input
                id="data-offset"
                type="number"
                value={value.dataOffset}
                onChange={(e) =>
                  updateField("dataOffset", parseInt(e.target.value) || 0)
                }
                min={0}
                step={32}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Byte offset to extract uint256 value from event data (usually 0
                for Transfer amount)
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="threshold" className="mb-2 block">
              Threshold
            </Label>
            <Input
              id="threshold"
              type="text"
              value={value.threshold}
              onChange={(e) => updateField("threshold", e.target.value)}
              placeholder={
                value.conditionType === "PRICE"
                  ? "e.g. 2000"
                  : "e.g. 10000"
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              {value.conditionType === "PRICE"
                ? "Price in USD (e.g. 2000 for $2,000)"
                : "Human-readable amount (e.g. 10000 for 10,000 USDC)"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
