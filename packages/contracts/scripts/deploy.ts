import "dotenv/config";
import { network } from "hardhat";

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();
console.log("Deploying with account:", deployer.account.address);

const reactiveFlow = await viem.deployContract("ReactiveFlow");
console.log("ReactiveFlow deployed to:", reactiveFlow.address);

console.log("\nKnown testnet addresses:");
console.log("  MockUSDC:", "0x99b143A677f49B13053Ec99C5fB16116bf0A49Ff");
console.log("  DIA Oracle:", "0xbA0E0750A56e995506CA458b2BdD752754CF39C4");
console.log(
  "  Reactivity Precompile:",
  "0x0000000000000000000000000000000000000100",
);
