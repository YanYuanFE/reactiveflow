import { useState, useCallback } from "react";
import { isAddress } from "viem";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function AddressInput({
  value,
  onChange,
  label,
  placeholder = "0x...",
}: AddressInputProps) {
  const [touched, setTouched] = useState(false);

  const valid = value.length > 0 && isAddress(value);
  const invalid = touched && value.length > 0 && !isAddress(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value.trim());
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-10 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1",
            valid
              ? "border-emerald-500 focus-visible:ring-emerald-500"
              : invalid
                ? "border-destructive focus-visible:ring-destructive"
                : "border-input focus-visible:ring-ring",
          )}
        />

        {value.length > 0 && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {valid ? (
              <Check className="size-4 text-emerald-500" />
            ) : invalid ? (
              <X className="size-4 text-destructive" />
            ) : null}
          </div>
        )}
      </div>

      {invalid && (
        <p className="text-xs text-destructive">
          Please enter a valid Ethereum address.
        </p>
      )}
    </div>
  );
}
