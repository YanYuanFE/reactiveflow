import "dotenv/config";
import { defineConfig } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);

export default defineConfig({
  plugins: [hardhatToolboxViem],
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    somniaTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://dream-rpc.somnia.network",
      chainId: 50312,
      accounts: [PRIVATE_KEY],
    },
  },
});
