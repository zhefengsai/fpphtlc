// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HTLC - Hash Time Lock Contract for Cross-Chain Atomic Swaps
 * @dev Based on classic HTLC design, supporting Alice-Bob cross-chain atomic exchange
 * 
 * Process Flow:
 * 1. Alice locks TokenA on chain X (lockFunds)
 * 2. Bob locks TokenB on chain Y (lockFunds)
 * 3. Bob reveals secret to claim TokenA (claimFunds)
 * 4. Alice sees secret to claim TokenB (claimFunds)
 * 5. Refund after timeout (refundFunds)
 */
contract HTLC is ReentrancyGuard {
    
    // Contract state enumeration
    enum SwapState {
        INVALID,    // 0: Setup state, invalid state
        LOCKED,     // 1: Locked
        CLAIMED,    // 2: Claimed
        REFUNDED    // 3: Refunded
    }
    
    // HTLC contract structure
    struct HTLCContract {
        address initiator;      // Initiator (fund locker)
        address recipient;      // Recipient (authorized claimer)
        IERC20 token;          // ERC20 token contract
        uint256 amount;        // Locked amount
        bytes32 hashlock;      // Hash of the secret
        uint256 timelock;      // Time lock (Unix timestamp)
        SwapState state;       // Contract state
        uint256 createdAt;     // Creation time
        string revealedSecret; // Revealed secret (recorded on claim)
    }
    
    // Store all HTLC contracts
    mapping(bytes32 => HTLCContract) public swaps;
    
    // User participation list
    mapping(address => bytes32[]) public userSwaps;
    
    // Global statistics
    uint256 public totalSwaps;
    uint256 public totalVolume;
    uint256 public successfulSwaps;
    
    // 🎯 Cross-chain atomic swap events
    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed initiator,
        address indexed recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        string chain // Added: blockchain identifier
    );
    
    event SwapClaimed(
        bytes32 indexed swapId,
        address indexed claimer,
        string secret
    );
    
    event SwapRefunded(
        bytes32 indexed swapId,
        address indexed refundee
    );
    
    // Cross-chain monitoring friendly event
    event SecretRevealed(
        bytes32 indexed swapId,
        string secret,
        uint256 timestamp
    );
    
    /**
     * @dev Lock funds (corresponds to Lock operation in flow diagram)
     * @param _recipient Recipient address
     * @param _token ERC20 token address
     * @param _amount Amount to lock
     * @param _hashlock Hash of secret H = hash(s)
     * @param _timelock Time lock (Unix timestamp)
     * @param _chain Chain identifier (for cross-chain monitoring)
     * @return swapId Exchange contract ID
     */
    function lockFunds(
        address _recipient,
        address _token,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock,
        string calldata _chain
    ) external nonReentrant returns (bytes32 swapId) {
        require(_recipient != address(0), "Invalid recipient");
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be positive");
        require(_timelock > block.timestamp, "Timelock must be in future");
        require(_hashlock != bytes32(0), "Invalid secret hash");
        
        // Generate unique swap ID
        swapId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient,
            _token,
            _amount,
            _hashlock,
            _timelock,
            block.timestamp,
            totalSwaps
        ));
        
        require(swaps[swapId].state == SwapState.INVALID, "Swap already exists");
        
        // Create HTLC contract
        swaps[swapId] = HTLCContract({
            initiator: msg.sender,
            recipient: _recipient,
            token: IERC20(_token),
            amount: _amount,
            hashlock: _hashlock,
            timelock: _timelock,
            state: SwapState.LOCKED,
            createdAt: block.timestamp,
            revealedSecret: ""
        });
        
        // Update user participation records
        userSwaps[msg.sender].push(swapId);
        userSwaps[_recipient].push(swapId);
        
        // Update statistics
        totalSwaps++;
        totalVolume += _amount;
        
        // Transfer tokens to contract
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        
        emit SwapInitiated(
            swapId,
            msg.sender,
            _recipient,
            _token,
            _amount,
            _hashlock,
            _timelock,
            _chain
        );
        
        return swapId;
    }
    
    /**
     * @dev Claim funds (corresponds to Claim operation in flow diagram)
     * @param _swapId Exchange contract ID
     * @param _secret Original secret
     */
    function claimFunds(bytes32 _swapId, string calldata _secret) external nonReentrant {
        HTLCContract storage swap = swaps[_swapId];
        
        require(swap.state == SwapState.LOCKED, "Swap not in locked state");
        require(msg.sender == swap.recipient, "Only recipient can claim");
        require(block.timestamp <= swap.timelock, "Timelock expired");
        require(
            keccak256(abi.encodePacked(_secret)) == swap.hashlock,
            "Invalid secret"
        );
        
        // Update state
        swap.state = SwapState.CLAIMED;
        swap.revealedSecret = _secret;
        
        // Update statistics
        successfulSwaps++;
        
        // Transfer tokens to recipient
        swap.token.transfer(swap.recipient, swap.amount);
        
        // Emit events
        emit SwapClaimed(_swapId, msg.sender, _secret);
        emit SecretRevealed(_swapId, _secret, block.timestamp);
    }
    
    /**
     * @dev Refund (corresponds to Refund operation in flow diagram)
     * @param _swapId Exchange contract ID
     */
    function refundFunds(bytes32 _swapId) external nonReentrant {
        HTLCContract storage swap = swaps[_swapId];
        
        require(swap.state == SwapState.LOCKED, "Swap not in locked state");
        require(msg.sender == swap.initiator, "Only initiator can refund");
        require(block.timestamp > swap.timelock, "Timelock not expired");
        
        // Update state
        swap.state = SwapState.REFUNDED;
        
        // Return tokens to initiator
        swap.token.transfer(swap.initiator, swap.amount);
        
        emit SwapRefunded(_swapId, msg.sender);
    }
    
    // 🔍 Query Functions - Support cross-chain monitoring
    
    /**
     * @dev Get swap details
     */
    function getSwap(bytes32 _swapId) external view returns (
        address initiator,
        address recipient,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        SwapState state,
        uint256 createdAt,
        string memory revealedSecret
    ) {
        HTLCContract storage swap = swaps[_swapId];
        return (
            swap.initiator,
            swap.recipient,
            address(swap.token),
            swap.amount,
            swap.hashlock,
            swap.timelock,
            swap.state,
            swap.createdAt,
            swap.revealedSecret
        );
    }
    
    /**
     * @dev Check if claim is possible
     */
    function canClaim(bytes32 _swapId, string calldata _secret) external view returns (bool) {
        HTLCContract storage swap = swaps[_swapId];
        
        return swap.state == SwapState.LOCKED &&
               block.timestamp <= swap.timelock &&
               keccak256(abi.encodePacked(_secret)) == swap.hashlock;
    }
    
    /**
     * @dev Check if refund is possible
     */
    function canRefund(bytes32 _swapId) external view returns (bool) {
        HTLCContract storage swap = swaps[_swapId];
        
        return swap.state == SwapState.LOCKED &&
               block.timestamp > swap.timelock;
    }
    
    /**
     * @dev Get all swaps participated by user
     */
    function getUserSwaps(address _user) external view returns (bytes32[] memory) {
        return userSwaps[_user];
    }
    
    /**
     * @dev Batch query swap states (cross-chain monitoring optimization)
     */
    function getSwapStates(bytes32[] calldata _swapIds) external view returns (SwapState[] memory) {
        SwapState[] memory states = new SwapState[](_swapIds.length);
        for (uint256 i = 0; i < _swapIds.length; i++) {
            states[i] = swaps[_swapIds[i]].state;
        }
        return states;
    }
    
    /**
     * @dev Check if secret has been revealed (cross-chain monitoring)
     */
    function getRevealedSecret(bytes32 _swapId) external view returns (bool revealed, string memory secret) {
        HTLCContract storage swap = swaps[_swapId];
        if (swap.state == SwapState.CLAIMED && bytes(swap.revealedSecret).length > 0) {
            return (true, swap.revealedSecret);
        }
        return (false, "");
    }
    
    /**
     * @dev Get protocol statistics
     */
    function getProtocolStats() external view returns (
        uint256 totalSwapsCount,
        uint256 totalVolumeAmount,
        uint256 successfulSwapsCount,
        uint256 successRate
    ) {
        uint256 rate = totalSwaps > 0 ? (successfulSwaps * 10000) / totalSwaps : 0; // Precision to 0.01%
        return (totalSwaps, totalVolume, successfulSwaps, rate);
    }
    
    /**
     * @dev Emergency stop function (contract owner only)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external {
        require(msg.sender == address(this), "Only contract itself");
        IERC20(_token).transfer(msg.sender, _amount);
    }
}
