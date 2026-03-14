import {
  useAccount,
  useReadContract,
  useWriteContract,
  useConfig,
} from "wagmi";
import { parseAbi } from "viem";
import { REACTIVE_FLOW_ABI, REACTIVE_FLOW_ADDRESS } from "@/config/contracts";
import { waitForTransactionReceipt } from "wagmi/actions";

const ERC20_APPROVE_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
]);

// ─── useDeposit ─────────────────────────────────────────────────────────────

export function useDeposit() {
  const { writeContractAsync, isPending } = useWriteContract();
  const config = useConfig();

  /** Approve + deposit in one sequential await flow */
  async function depositWithApproval(token: `0x${string}`, amount: bigint) {
    const approveHash = await writeContractAsync({
      address: token,
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [REACTIVE_FLOW_ADDRESS, amount],
    });
    await waitForTransactionReceipt(config, { hash: approveHash });

    const depositHash = await writeContractAsync({
      address: REACTIVE_FLOW_ADDRESS,
      abi: REACTIVE_FLOW_ABI,
      functionName: "deposit",
      args: [token, amount],
    });
    await waitForTransactionReceipt(config, { hash: depositHash });
  }

  return { depositWithApproval, isPending };
}

// ─── useWithdraw ────────────────────────────────────────────────────────────

export function useWithdraw() {
  const { writeContractAsync, isPending } = useWriteContract();
  const config = useConfig();

  async function withdraw(token: `0x${string}`, amount: bigint) {
    const hash = await writeContractAsync({
      address: REACTIVE_FLOW_ADDRESS,
      abi: REACTIVE_FLOW_ABI,
      functionName: "withdraw",
      args: [token, amount],
    });
    await waitForTransactionReceipt(config, { hash });
  }

  return { withdraw, isPending };
}

// ─── useDepositBalance ──────────────────────────────────────────────────────

export function useDepositBalance(token: `0x${string}` | undefined) {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: REACTIVE_FLOW_ADDRESS,
    abi: REACTIVE_FLOW_ABI,
    functionName: "getDeposit",
    args: address && token ? [address, token] : undefined,
    query: { enabled: !!address && !!token },
  });

  return {
    balance: (data as bigint | undefined) ?? BigInt(0),
    isLoading,
    refetch,
  };
}
