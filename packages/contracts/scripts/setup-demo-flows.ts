import "dotenv/config";
import { network } from "hardhat";
import {
  keccak256,
  toHex,
  zeroHash,
  zeroAddress,
  parseUnits,
} from "viem";

const REACTIVE_FLOW_ADDRESS = (process.env.REACTIVE_FLOW_ADDRESS ||
  "") as `0x${string}`;
const USDC = "0x28bec7e30e6faee657a03e19bf1128aad7632a00" as const;
const DIA_ORACLE = "0xbA0E0750A56e995506CA458b2BdD752754CF39C4" as const;

const TRANSFER_SIG = keccak256(
  toHex("Transfer(address,address,uint256)"),
);

const { viem } = await network.connect();

if (!REACTIVE_FLOW_ADDRESS) {
  throw new Error("Set REACTIVE_FLOW_ADDRESS env var");
}

const publicClient = await viem.getPublicClient();
const rf = await viem.getContractAt("ReactiveFlow", REACTIVE_FLOW_ADDRESS);

console.log("Setting up demo flows...");

// Demo 1: Whale Alert - USDC transfers >= 10,000
const hash1 = await rf.write.createFlow([
  "Whale Alert: USDC >= 10K",
  {
    triggerType: 0, // TOKEN_TRANSFER
    emitterContract: USDC,
    eventSignature: TRANSFER_SIG,
    topicFilters: [zeroHash, zeroHash, zeroHash],
  },
  {
    operator: 3, // GTE
    conditionType: keccak256(toHex("AMOUNT")),
    oracleOrDataSource: zeroAddress,
    oracleKey: "",
    threshold: parseUnits("10000", 6),
    dataOffset: 0,
  },
  {
    actionType: 3, // EMIT_ALERT
    targetContract: zeroAddress,
    functionSelector: "0x00000000",
    encodedParams: toHex("Whale USDC transfer detected!"),
  },
  0n, // unlimited
]);
await publicClient.waitForTransactionReceipt({ hash: hash1 });
console.log("  Created: Whale Alert flow");

// Demo 2: Price Guardian - ETH/USD price drops below threshold
const hash2 = await rf.write.createFlow([
  "Price Guardian: ETH < $2000",
  {
    triggerType: 1, // PRICE_THRESHOLD
    emitterContract: DIA_ORACLE,
    eventSignature: keccak256(
      toHex("OracleUpdate(string,uint128,uint128)"),
    ),
    topicFilters: [zeroHash, zeroHash, zeroHash],
  },
  {
    operator: 2, // LT
    conditionType: keccak256(toHex("PRICE")),
    oracleOrDataSource: DIA_ORACLE,
    oracleKey: "ETH/USD",
    threshold: parseUnits("2000", 8), // DIA uses 8 decimals
    dataOffset: 0,
  },
  {
    actionType: 3, // EMIT_ALERT
    targetContract: zeroAddress,
    functionSelector: "0x00000000",
    encodedParams: toHex("ETH price dropped below $2000!"),
  },
  0n,
]);
await publicClient.waitForTransactionReceipt({ hash: hash2 });
console.log("  Created: Price Guardian flow");

console.log("\nDemo flows created successfully!");
