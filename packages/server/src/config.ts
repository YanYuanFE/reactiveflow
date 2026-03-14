import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001"),
  rpcUrl: process.env.RPC_URL || "https://dream-rpc.somnia.network",
  databaseUrl: process.env.DB_URL || "",
  chainId: 50312,
  reactiveFlowAddress:
    process.env.REACTIVE_FLOW_ADDRESS ||
    "0x3d0504bbf7a41138da1a48e84accb1ab393d2b3f",
  privateKey: process.env.PRIVATE_KEY || "",

  // Known testnet addresses
  contracts: {
    MOCK_USDC: "0x99b143A677f49B13053Ec99C5fB16116bf0A49Ff",
    DIA_ORACLE: "0xbA0E0750A56e995506CA458b2BdD752754CF39C4",
    REACTIVITY_PRECOMPILE: "0x0000000000000000000000000000000000000100",
  },
} as const;
