import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { type Chain } from "viem";

// ─── Somnia Testnet Chain Definition ────────────────────────────────────────
export const somniaTestnet: Chain = {
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://dream-rpc.somnia.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: "https://shannon-explorer.somnia.network",
    },
  },
  testnet: true,
};

// ─── wagmi + RainbowKit Config ──────────────────────────────────────────────
export const config = getDefaultConfig({
  appName: "ReactiveFlow",
  projectId: 'b1daffdd6f590ce1fe948af2022b4ec1',
  chains: [somniaTestnet],
  ssr: false,
});
