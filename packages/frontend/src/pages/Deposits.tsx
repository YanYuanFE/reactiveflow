import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ArrowDownToLine, ArrowUpFromLine, Info, Plus } from "lucide-react";
import { TOKENS, type TokenInfo } from "@/config/contracts";
import { useDeposit, useWithdraw, useDepositBalance } from "@/hooks/useDeposit";
import { parseUnits, formatUnits, erc20Abi, isAddress } from "viem";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function TokenDeposit({ token }: { token: (typeof TOKENS)[number] }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [loading, setLoading] = useState(false);

  const { data: onChainDecimals } = useReadContract({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
  });
  const decimals = onChainDecimals ?? token.decimals;

  const { balance, isLoading: balanceLoading, refetch } = useDepositBalance(
    token.address as `0x${string}`,
  );
  const { depositWithApproval } = useDeposit();
  const { withdraw } = useWithdraw();

  const handleSubmit = async () => {
    if (!amount) return;
    const parsedAmount = parseUnits(amount, decimals);
    setLoading(true);

    try {
      if (mode === "deposit") {
        await depositWithApproval(token.address as `0x${string}`, parsedAmount);
        toast.success(`Successfully deposited ${amount} ${token.symbol}`);
      } else {
        await withdraw(token.address as `0x${string}`, parsedAmount);
        toast.success(`Successfully withdrew ${amount} ${token.symbol}`);
      }
      setAmount("");
      refetch();
    } catch (e: any) {
      if (e?.message?.includes("User rejected")) {
        toast.error("Transaction cancelled");
      } else {
        toast.error(`${mode === "deposit" ? "Deposit" : "Withdraw"} failed`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted font-bold text-sm">
              {token.symbol.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold">{token.symbol}</h3>
              <p className="text-xs text-muted-foreground">{token.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Deposited Balance</p>
            <p className="text-lg font-bold tabular-nums">
              {balanceLoading
                ? "..."
                : formatUnits(balance || 0n, decimals)}{" "}
              {token.symbol}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "deposit" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setMode("deposit")}
          >
            <ArrowDownToLine className="size-4" />
            Deposit
          </Button>
          <Button
            variant={mode === "withdraw" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setMode("withdraw")}
          >
            <ArrowUpFromLine className="size-4" />
            Withdraw
          </Button>
        </div>

        {/* Amount Input */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount in ${token.symbol}`}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={!amount || loading}
          >
            {loading
              ? "Pending..."
              : mode === "deposit"
                ? "Deposit"
                : "Withdraw"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {mode === "deposit"
            ? "Deposit tokens to fund automated flow actions (requires token approval)"
            : "Withdraw your deposited tokens back to your wallet"}
        </p>
      </CardContent>
    </Card>
  );
}

function CustomTokenLookup({ onAdd }: { onAdd: (token: TokenInfo) => void }) {
  const [address, setAddress] = useState("");
  const valid = isAddress(address);
  const addr = valid ? (address as `0x${string}`) : undefined;

  const { data: symbol } = useReadContract({
    address: addr,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: !!addr },
  });
  const { data: decimals } = useReadContract({
    address: addr,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!addr },
  });

  const knownAddresses = TOKENS.map((t) => t.address.toLowerCase());
  const isDuplicate = valid && knownAddresses.includes(address.toLowerCase());
  const ready = valid && symbol && decimals !== undefined && !isDuplicate;

  const handleAdd = () => {
    if (!ready || !addr) return;
    onAdd({
      address: addr,
      symbol: symbol!,
      label: symbol!,
      decimals: decimals!,
    });
    setAddress("");
  };

  return (
    <div className="space-y-2">
      <Label className="block">Add Custom Token</Label>
      <div className="flex gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Token contract address (0x...)"
          className="flex-1 font-mono text-sm"
        />
        <Button onClick={handleAdd} disabled={!ready} className="gap-2">
          <Plus className="size-4" /> Add
        </Button>
      </div>
      {valid && !isDuplicate && symbol && (
        <p className="text-xs text-muted-foreground">
          Found: {symbol} ({decimals} decimals)
        </p>
      )}
      {isDuplicate && (
        <p className="text-xs text-destructive">Token already in list</p>
      )}
      {address && !valid && (
        <p className="text-xs text-destructive">Invalid address</p>
      )}
    </div>
  );
}

export default function Deposits() {
  const { isConnected } = useAccount();
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("rf_custom_tokens") || "[]");
    } catch {
      return [];
    }
  });

  const saveCustomTokens = (tokens: TokenInfo[]) => {
    setCustomTokens(tokens);
    localStorage.setItem("rf_custom_tokens", JSON.stringify(tokens));
  };

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Connect your wallet to manage deposits
      </div>
    );
  }

  const allTokens = [...TOKENS, ...customTokens];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-balance text-foreground">Token Deposits</h1>
        <p className="text-pretty text-muted-foreground mt-1">
          Deposit tokens to fund your automated flow actions. When a flow
          executes a transfer or swap, it draws from your deposited balance.
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-8 bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Why deposit?</p>
              <p className="text-pretty text-muted-foreground">
                When flows are triggered by on-chain events, the transaction
                sender is the Reactivity precompile (0x0100), not your wallet.
                By pre-depositing tokens, the contract can execute actions on
                your behalf.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {allTokens.map((token) => (
          <TokenDeposit key={token.address} token={token} />
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <CustomTokenLookup
            onAdd={(token) => {
              if (!customTokens.some((t) => t.address.toLowerCase() === token.address.toLowerCase())) {
                saveCustomTokens([...customTokens, token]);
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
