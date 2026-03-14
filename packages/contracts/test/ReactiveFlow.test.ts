import { describe, it } from "node:test";
import assert from "node:assert/strict";
import hre from "hardhat";
import {
  keccak256,
  toHex,
  zeroHash,
  zeroAddress,
  parseUnits,
  pad,
  encodeAbiParameters,
  parseEventLogs,
  getAddress,
} from "viem";

const { viem, networkHelpers } = await hre.network.connect();
const publicClient = await viem.getPublicClient();

const TRANSFER_SIG = keccak256(toHex("Transfer(address,address,uint256)"));

async function deployFixture() {
  const mockToken = await viem.deployContract("MockERC20", [
    "Mock USDC",
    "USDC",
    6,
  ]);
  const reactiveFlow = await viem.deployContract("ReactiveFlow");
  const [owner, user, recipient] = await viem.getWalletClients();

  // Mint tokens to user
  await mockToken.write.mint([user.account.address, parseUnits("100000", 6)]);

  return { reactiveFlow, mockToken, owner, user, recipient };
}

async function createSimpleFlow(
  reactiveFlow: any,
  mockToken: any,
  account: any,
) {
  return reactiveFlow.write.createFlow(
    [
      "Test",
      {
        triggerType: 0,
        emitterContract: mockToken.address,
        eventSignature: TRANSFER_SIG,
        topicFilters: [zeroHash, zeroHash, zeroHash],
      },
      {
        operator: 0,
        conditionType: zeroHash,
        oracleOrDataSource: zeroAddress,
        oracleKey: "",
        threshold: 0n,
        dataOffset: 0,
      },
      {
        actionType: 3,
        targetContract: zeroAddress,
        functionSelector: "0x00000000",
        encodedParams: toHex("test"),
      },
      0n,
    ],
    { account },
  );
}

describe("ReactiveFlow", function () {
  describe("Flow CRUD", function () {
    it("should create a flow", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;

      const trigger = {
        triggerType: 0,
        emitterContract: tokenAddr,
        eventSignature: TRANSFER_SIG,
        topicFilters: [zeroHash, zeroHash, zeroHash],
      };

      const condition = {
        operator: 0,
        conditionType: zeroHash,
        oracleOrDataSource: zeroAddress,
        oracleKey: "",
        threshold: 0n,
        dataOffset: 0,
      };

      const action = {
        actionType: 3,
        targetContract: zeroAddress,
        functionSelector: "0x00000000" as `0x${string}`,
        encodedParams: toHex("Whale alert!"),
      };

      await viem.assertions.emitWithArgs(
        reactiveFlow.write.createFlow(
          ["Whale Alert", trigger, condition, action, 0n],
          { account: user.account },
        ),
        reactiveFlow,
        "FlowCreated",
        [0n, getAddress(user.account.address), "Whale Alert"],
      );

      const flow = await reactiveFlow.read.getFlow([0n]);
      assert.equal(
        flow.owner.toLowerCase(),
        user.account.address.toLowerCase(),
      );
      assert.equal(flow.name, "Whale Alert");
      assert.equal(flow.active, true);
    });

    it("should pause and resume a flow", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      await createSimpleFlow(reactiveFlow, mockToken, user.account);

      await reactiveFlow.write.pauseFlow([0n], { account: user.account });
      let flow = await reactiveFlow.read.getFlow([0n]);
      assert.equal(flow.active, false);

      await reactiveFlow.write.resumeFlow([0n], { account: user.account });
      flow = await reactiveFlow.read.getFlow([0n]);
      assert.equal(flow.active, true);
    });

    it("should delete a flow", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      await createSimpleFlow(reactiveFlow, mockToken, user.account);

      await viem.assertions.emitWithArgs(
        reactiveFlow.write.deleteFlow([0n], { account: user.account }),
        reactiveFlow,
        "FlowDeleted",
        [0n],
      );
    });

    it("should not allow non-owner to manage flow", async function () {
      const { reactiveFlow, mockToken, user, owner } =
        await networkHelpers.loadFixture(deployFixture);
      await createSimpleFlow(reactiveFlow, mockToken, user.account);

      await viem.assertions.revertWith(
        reactiveFlow.write.pauseFlow([0n], { account: owner.account }),
        "Not flow owner",
      );
    });
  });

  describe("Deposit / Withdraw", function () {
    it("should deposit tokens", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;
      const amount = parseUnits("1000", 6);

      await mockToken.write.approve([reactiveFlow.address, amount], {
        account: user.account,
      });
      await reactiveFlow.write.deposit([tokenAddr, amount], {
        account: user.account,
      });

      const deposit = await reactiveFlow.read.getDeposit([
        user.account.address,
        tokenAddr,
      ]);
      assert.equal(deposit, amount);
    });

    it("should withdraw tokens", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;
      const amount = parseUnits("1000", 6);

      await mockToken.write.approve([reactiveFlow.address, amount], {
        account: user.account,
      });
      await reactiveFlow.write.deposit([tokenAddr, amount], {
        account: user.account,
      });
      await reactiveFlow.write.withdraw([tokenAddr, amount], {
        account: user.account,
      });

      const deposit = await reactiveFlow.read.getDeposit([
        user.account.address,
        tokenAddr,
      ]);
      assert.equal(deposit, 0n);
    });

    it("should reject withdraw exceeding deposit", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;

      await viem.assertions.revertWith(
        reactiveFlow.write.withdraw([tokenAddr, 1n], {
          account: user.account,
        }),
        "Insufficient deposit",
      );
    });
  });

  describe("_onEvent", function () {
    it("should execute EMIT_ALERT flow on matching event", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;

      const trigger = {
        triggerType: 0,
        emitterContract: tokenAddr,
        eventSignature: TRANSFER_SIG,
        topicFilters: [zeroHash, zeroHash, zeroHash],
      };

      const condition = {
        operator: 0,
        conditionType: zeroHash,
        oracleOrDataSource: zeroAddress,
        oracleKey: "",
        threshold: 0n,
        dataOffset: 0,
      };

      const action = {
        actionType: 3,
        targetContract: zeroAddress,
        functionSelector: "0x00000000" as `0x${string}`,
        encodedParams: toHex("Whale detected!"),
      };

      await reactiveFlow.write.createFlow(
        ["Alert", trigger, condition, action, 0n],
        { account: user.account },
      );

      const topics = [
        TRANSFER_SIG,
        pad(user.account.address, { size: 32 }),
      ];
      const data = encodeAbiParameters(
        [{ type: "uint256" }],
        [parseUnits("50000", 6)],
      );

      const hash = await reactiveFlow.write._onEvent([
        tokenAddr,
        topics,
        data,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const events = parseEventLogs({
        abi: reactiveFlow.abi,
        logs: receipt.logs,
      });

      assert.ok(
        events.some((e) => e.eventName === "AlertEmitted"),
        "Expected AlertEmitted event",
      );
      assert.ok(
        events.some((e) => e.eventName === "FlowExecuted"),
        "Expected FlowExecuted event",
      );

      const flow = await reactiveFlow.read.getFlow([0n]);
      assert.equal(flow.executionCount, 1n);
    });

    it("should execute TRANSFER_TOKEN flow with deposit", async function () {
      const { reactiveFlow, mockToken, user, recipient } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;
      const transferAmount = parseUnits("100", 6);

      await mockToken.write.approve([reactiveFlow.address, transferAmount], {
        account: user.account,
      });
      await reactiveFlow.write.deposit([tokenAddr, transferAmount], {
        account: user.account,
      });

      const trigger = {
        triggerType: 0,
        emitterContract: tokenAddr,
        eventSignature: TRANSFER_SIG,
        topicFilters: [zeroHash, zeroHash, zeroHash],
      };

      const condition = {
        operator: 0,
        conditionType: zeroHash,
        oracleOrDataSource: zeroAddress,
        oracleKey: "",
        threshold: 0n,
        dataOffset: 0,
      };

      const encodedParams = encodeAbiParameters(
        [{ type: "address" }, { type: "uint256" }],
        [recipient.account.address, transferAmount],
      );

      const action = {
        actionType: 0,
        targetContract: tokenAddr,
        functionSelector: "0x00000000" as `0x${string}`,
        encodedParams,
      };

      await reactiveFlow.write.createFlow(
        ["Auto Transfer", trigger, condition, action, 1n],
        { account: user.account },
      );

      const topics = [TRANSFER_SIG];

      await viem.assertions.emit(
        reactiveFlow.write._onEvent([tokenAddr, topics, "0x"]),
        reactiveFlow,
        "FlowExecuted",
      );

      const balance = await mockToken.read.balanceOf([
        recipient.account.address,
      ]);
      assert.equal(balance, transferAmount);

      const deposit = await reactiveFlow.read.getDeposit([
        user.account.address,
        tokenAddr,
      ]);
      assert.equal(deposit, 0n);
    });

    it("should respect AMOUNT condition", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;

      const trigger = {
        triggerType: 0,
        emitterContract: tokenAddr,
        eventSignature: TRANSFER_SIG,
        topicFilters: [zeroHash, zeroHash, zeroHash],
      };

      const threshold = parseUnits("10000", 6);
      const condition = {
        operator: 3, // GTE
        conditionType: keccak256(toHex("AMOUNT")),
        oracleOrDataSource: zeroAddress,
        oracleKey: "",
        threshold,
        dataOffset: 0,
      };

      const action = {
        actionType: 3,
        targetContract: zeroAddress,
        functionSelector: "0x00000000" as `0x${string}`,
        encodedParams: toHex("Whale alert!"),
      };

      await reactiveFlow.write.createFlow(
        ["Whale Alert", trigger, condition, action, 0n],
        { account: user.account },
      );

      // Below threshold - should NOT trigger alert
      const smallAmount = encodeAbiParameters(
        [{ type: "uint256" }],
        [parseUnits("5000", 6)],
      );
      const topics = [TRANSFER_SIG];

      const hash1 = await reactiveFlow.write._onEvent([
        tokenAddr,
        topics,
        smallAmount,
      ]);
      const receipt1 = await publicClient.waitForTransactionReceipt({
        hash: hash1,
      });
      const alertEvents = parseEventLogs({
        abi: reactiveFlow.abi,
        logs: receipt1.logs,
        eventName: "AlertEmitted",
      });
      assert.equal(alertEvents.length, 0);

      // Above threshold - should trigger alert
      const largeAmount = encodeAbiParameters(
        [{ type: "uint256" }],
        [parseUnits("15000", 6)],
      );

      await viem.assertions.emit(
        reactiveFlow.write._onEvent([tokenAddr, topics, largeAmount]),
        reactiveFlow,
        "AlertEmitted",
      );
    });

    it("should respect maxExecutions", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      const tokenAddr = mockToken.address;

      const trigger = {
        triggerType: 0,
        emitterContract: tokenAddr,
        eventSignature: TRANSFER_SIG,
        topicFilters: [zeroHash, zeroHash, zeroHash],
      };

      const condition = {
        operator: 0,
        conditionType: zeroHash,
        oracleOrDataSource: zeroAddress,
        oracleKey: "",
        threshold: 0n,
        dataOffset: 0,
      };

      const action = {
        actionType: 3,
        targetContract: zeroAddress,
        functionSelector: "0x00000000" as `0x${string}`,
        encodedParams: toHex("Alert!"),
      };

      // maxExecutions = 1
      await reactiveFlow.write.createFlow(
        ["Once", trigger, condition, action, 1n],
        { account: user.account },
      );

      const topics = [TRANSFER_SIG];

      // First call should trigger
      await viem.assertions.emit(
        reactiveFlow.write._onEvent([tokenAddr, topics, "0x"]),
        reactiveFlow,
        "FlowExecuted",
      );

      // Second call should NOT trigger
      const hash2 = await reactiveFlow.write._onEvent([
        tokenAddr,
        topics,
        "0x",
      ]);
      const receipt2 = await publicClient.waitForTransactionReceipt({
        hash: hash2,
      });
      const execEvents = parseEventLogs({
        abi: reactiveFlow.abi,
        logs: receipt2.logs,
        eventName: "FlowExecuted",
      });
      assert.equal(execEvents.length, 0);
    });
  });

  describe("View Functions", function () {
    it("should return user flows", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      await createSimpleFlow(reactiveFlow, mockToken, user.account);
      await createSimpleFlow(reactiveFlow, mockToken, user.account);

      const userFlowIds = await reactiveFlow.read.getUserFlows([
        user.account.address,
      ]);
      assert.equal(userFlowIds.length, 2);
    });

    it("should return user flow count", async function () {
      const { reactiveFlow, mockToken, user } =
        await networkHelpers.loadFixture(deployFixture);
      await createSimpleFlow(reactiveFlow, mockToken, user.account);

      const count = await reactiveFlow.read.getUserFlowCount([
        user.account.address,
      ]);
      assert.equal(count, 1n);
    });
  });
});
