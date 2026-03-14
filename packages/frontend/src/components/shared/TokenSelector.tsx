import { TOKENS, getTokenByAddress } from "@/config/contracts";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface TokenSelectorProps {
  value: string;
  onChange: (address: string) => void;
  label?: string;
}

export function TokenSelector({ value, onChange, label }: TokenSelectorProps) {
  const selectedToken = getTokenByAddress(value);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
        >
          <option value="" disabled>
            Select a token
          </option>
          {TOKENS.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol} — {token.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>

      {selectedToken && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {selectedToken.symbol.charAt(0)}
          </span>
          <span className="text-sm font-medium">
            {selectedToken.symbol}
          </span>
          <span className="text-xs text-muted-foreground">
            {selectedToken.address.slice(0, 6)}...
            {selectedToken.address.slice(-4)}
          </span>
        </div>
      )}
    </div>
  );
}
