// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IDIAOracleV2.sol";

/**
 * @title ReactiveFlow
 * @notice On-chain IFTTT workflow orchestrator for Somnia.
 *         Single-contract design (Engine + Registry) to save cross-contract call gas.
 *         Validators call _onEvent() which routes to matching flows, evaluates conditions,
 *         and executes actions automatically.
 */
contract ReactiveFlow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Enums ───────────────────────────────────────────────────────────
    enum TriggerType { TOKEN_TRANSFER, PRICE_THRESHOLD, DEX_SWAP, CUSTOM_EVENT }
    enum ConditionOp { NONE, GT, LT, GTE, LTE, EQ, NEQ }
    enum ActionType  { TRANSFER_TOKEN, SWAP_TOKENS, CONTRACT_CALL, EMIT_ALERT }

    // ─── Structs ─────────────────────────────────────────────────────────
    struct TriggerConfig {
        TriggerType triggerType;
        address emitterContract;
        bytes32 eventSignature;
        bytes32[3] topicFilters;     // bytes32(0) = wildcard
    }

    struct ConditionConfig {
        ConditionOp operator;
        bytes32 conditionType;       // keccak256("PRICE") or keccak256("AMOUNT")
        address oracleOrDataSource;
        string oracleKey;            // e.g. "ETH/USD"
        uint256 threshold;
        uint8 dataOffset;            // byte offset to extract value from event data
    }

    struct ActionConfig {
        ActionType actionType;
        address targetContract;
        bytes4 functionSelector;
        bytes encodedParams;
    }

    struct Flow {
        uint256 flowId;
        address owner;
        string name;
        TriggerConfig trigger;
        ConditionConfig condition;
        ActionConfig action;
        bool active;
        bool deleted;
        uint256 executionCount;
        uint256 maxExecutions;       // 0 = unlimited
    }

    // ─── State ───────────────────────────────────────────────────────────
    address public owner;
    uint256 public nextFlowId;
    uint256 public constant MAX_FLOWS_PER_TRIGGER = 10;
    uint256 public constant MAX_GAS_PER_ACTION = 3_000_000;
    uint256 public constant ORACLE_STALENESS = 1 hours;

    // flowId => Flow
    mapping(uint256 => Flow) public flows;

    // owner => flowId[]
    mapping(address => uint256[]) public userFlows;

    // keccak256(eventSig, emitter) => flowId[]
    mapping(bytes32 => uint256[]) public triggerIndex;

    // user => token => balance
    mapping(address => mapping(address => uint256)) public deposits;

    // ─── Events ──────────────────────────────────────────────────────────
    event FlowCreated(uint256 indexed flowId, address indexed owner, string name);
    event FlowPaused(uint256 indexed flowId);
    event FlowResumed(uint256 indexed flowId);
    event FlowDeleted(uint256 indexed flowId);
    event FlowExecuted(uint256 indexed flowId, address indexed owner, bool success, bytes returnData);
    event AlertEmitted(uint256 indexed flowId, address indexed owner, string message, bytes data);
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyFlowOwner(uint256 flowId) {
        require(flows[flowId].owner == msg.sender, "Not flow owner");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Flow CRUD ───────────────────────────────────────────────────────

    function createFlow(
        string calldata name,
        TriggerConfig calldata trigger,
        ConditionConfig calldata condition,
        ActionConfig calldata action,
        uint256 maxExecutions
    ) external returns (uint256 flowId) {
        flowId = nextFlowId++;

        bytes32 triggerKey = _triggerKey(trigger.eventSignature, trigger.emitterContract);
        require(triggerIndex[triggerKey].length < MAX_FLOWS_PER_TRIGGER, "Too many flows for this trigger");

        flows[flowId] = Flow({
            flowId: flowId,
            owner: msg.sender,
            name: name,
            trigger: trigger,
            condition: condition,
            action: action,
            active: true,
            deleted: false,
            executionCount: 0,
            maxExecutions: maxExecutions
        });

        userFlows[msg.sender].push(flowId);
        triggerIndex[triggerKey].push(flowId);

        emit FlowCreated(flowId, msg.sender, name);
    }

    function pauseFlow(uint256 flowId) external onlyFlowOwner(flowId) {
        flows[flowId].active = false;
        emit FlowPaused(flowId);
    }

    function resumeFlow(uint256 flowId) external onlyFlowOwner(flowId) {
        require(!flows[flowId].deleted, "Flow is deleted");
        flows[flowId].active = true;
        emit FlowResumed(flowId);
    }

    function deleteFlow(uint256 flowId) external onlyFlowOwner(flowId) {
        Flow storage flow = flows[flowId];
        flow.active = false;
        flow.deleted = true;

        // Remove from triggerIndex
        bytes32 triggerKey = _triggerKey(flow.trigger.eventSignature, flow.trigger.emitterContract);
        uint256[] storage ids = triggerIndex[triggerKey];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == flowId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }

        // Remove from userFlows
        uint256[] storage uFlows = userFlows[msg.sender];
        for (uint256 i = 0; i < uFlows.length; i++) {
            if (uFlows[i] == flowId) {
                uFlows[i] = uFlows[uFlows.length - 1];
                uFlows.pop();
                break;
            }
        }

        emit FlowDeleted(flowId);
    }

    // ─── Deposit / Withdraw ──────────────────────────────────────────────

    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender][token] += amount;
        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        require(deposits[msg.sender][token] >= amount, "Insufficient deposit");
        deposits[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, token, amount);
    }

    // ─── Core: _onEvent (called by validators via Reactivity precompile) ─

    /**
     * @notice Called by Somnia validators when a subscribed event fires.
     * @param emitter The contract that emitted the event
     * @param topics  Event topics (topic[0] = event signature)
     * @param data    Event data payload
     */
    function _onEvent(
        address emitter,
        bytes32[] calldata topics,
        bytes calldata data
    ) external {
        // Only the reactivity precompile (0x0100) should call this in production.
        // For testnet flexibility, we allow any caller.

        if (topics.length == 0) return;

        bytes32 eventSig = topics[0];
        bytes32 triggerKey = _triggerKey(eventSig, emitter);
        uint256[] storage matchedFlows = triggerIndex[triggerKey];

        for (uint256 i = 0; i < matchedFlows.length; i++) {
            Flow storage flow = flows[matchedFlows[i]];

            // Skip inactive flows
            if (!flow.active) continue;

            // Check max executions
            if (flow.maxExecutions > 0 && flow.executionCount >= flow.maxExecutions) continue;

            // Check topic filters
            if (!_matchTopics(flow.trigger.topicFilters, topics)) continue;

            // Evaluate condition
            if (!_evaluateCondition(flow.condition, data)) continue;

            // Execute action
            (bool success, bytes memory returnData) = _executeAction(flow);

            flow.executionCount++;
            emit FlowExecuted(flow.flowId, flow.owner, success, returnData);
        }
    }

    // ─── Internal: Topic Matching ────────────────────────────────────────

    function _matchTopics(
        bytes32[3] storage filters,
        bytes32[] calldata topics
    ) internal view returns (bool) {
        for (uint256 i = 0; i < 3; i++) {
            if (filters[i] == bytes32(0)) continue; // wildcard
            if (i + 1 >= topics.length) return false;
            if (filters[i] != topics[i + 1]) return false;
        }
        return true;
    }

    // ─── Internal: Condition Evaluation ──────────────────────────────────

    function _evaluateCondition(
        ConditionConfig storage cond,
        bytes calldata data
    ) internal view returns (bool) {
        if (cond.operator == ConditionOp.NONE) return true;

        uint256 value;

        if (cond.conditionType == keccak256("PRICE")) {
            // Read from DIA oracle
            (uint128 price, uint128 timestamp) = IDIAOracleV2(cond.oracleOrDataSource)
                .getValue(cond.oracleKey);
            // Staleness check
            if (block.timestamp - timestamp > ORACLE_STALENESS) return false;
            value = uint256(price);
        } else if (cond.conditionType == keccak256("AMOUNT")) {
            // Extract value from event data at specified offset
            if (data.length < uint256(cond.dataOffset) + 32) return false;
            value = abi.decode(data[cond.dataOffset:cond.dataOffset + 32], (uint256));
        } else {
            return false;
        }

        return _compare(cond.operator, value, cond.threshold);
    }

    function _compare(ConditionOp op, uint256 a, uint256 b) internal pure returns (bool) {
        if (op == ConditionOp.GT)  return a > b;
        if (op == ConditionOp.LT)  return a < b;
        if (op == ConditionOp.GTE) return a >= b;
        if (op == ConditionOp.LTE) return a <= b;
        if (op == ConditionOp.EQ)  return a == b;
        if (op == ConditionOp.NEQ) return a != b;
        return false;
    }

    // ─── Internal: Action Execution ──────────────────────────────────────

    function _executeAction(Flow storage flow) internal returns (bool success, bytes memory returnData) {
        ActionConfig storage action = flow.action;

        if (action.actionType == ActionType.EMIT_ALERT) {
            string memory message = string(action.encodedParams);
            emit AlertEmitted(flow.flowId, flow.owner, message, "");
            return (true, "");
        }

        if (action.actionType == ActionType.TRANSFER_TOKEN) {
            // encodedParams = abi.encode(recipient, amount)
            (address recipient, uint256 amount) = abi.decode(action.encodedParams, (address, uint256));
            address token = action.targetContract;

            // Deduct from user deposits
            if (deposits[flow.owner][token] < amount) {
                return (false, "Insufficient deposit");
            }

            deposits[flow.owner][token] -= amount;
            IERC20(token).safeTransfer(recipient, amount);
            return (true, "");
        }

        if (action.actionType == ActionType.CONTRACT_CALL) {
            bytes memory callData = abi.encodePacked(action.functionSelector, action.encodedParams);
            (success, returnData) = action.targetContract.call{gas: MAX_GAS_PER_ACTION}(callData);
            return (success, returnData);
        }

        if (action.actionType == ActionType.SWAP_TOKENS) {
            // For swap, encodedParams = abi.encode(tokenIn, amountIn, minAmountOut)
            (address tokenIn, uint256 amountIn, uint256 minAmountOut) = abi.decode(
                action.encodedParams, (address, uint256, uint256)
            );

            if (deposits[flow.owner][tokenIn] < amountIn) {
                return (false, "Insufficient deposit for swap");
            }

            deposits[flow.owner][tokenIn] -= amountIn;

            // Approve router
            IERC20(tokenIn).approve(action.targetContract, amountIn);

            // Call swap via router (generic call)
            bytes memory swapCall = abi.encodePacked(action.functionSelector, action.encodedParams);
            (success, returnData) = action.targetContract.call{gas: MAX_GAS_PER_ACTION}(swapCall);
            return (success, returnData);
        }

        return (false, "Unknown action type");
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function getFlow(uint256 flowId) external view returns (Flow memory) {
        return flows[flowId];
    }

    function getUserFlows(address user) external view returns (uint256[] memory) {
        return userFlows[user];
    }

    function getUserFlowCount(address user) external view returns (uint256) {
        return userFlows[user].length;
    }

    function getDeposit(address user, address token) external view returns (uint256) {
        return deposits[user][token];
    }

    function getTriggerFlows(bytes32 eventSig, address emitter) external view returns (uint256[] memory) {
        return triggerIndex[_triggerKey(eventSig, emitter)];
    }

    // ─── Internal Helpers ────────────────────────────────────────────────

    function _triggerKey(bytes32 eventSig, address emitter) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(eventSig, emitter));
    }
}
