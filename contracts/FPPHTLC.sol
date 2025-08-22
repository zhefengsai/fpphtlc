// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FPPHTLC is ReentrancyGuard {
    // State variables
    mapping(bytes32 => CrossChainSwap) public swaps;
    
    // Structs
    struct CrossChainSwap {
        address initiator;
        address recipient;
        address token;
        uint256 amount;
        bytes32 combinedHash;
        uint256 timelock;
        string network;
        bool isActive;
        bool isClaimed;
        bool isRefunded;
    }
    
    // Events
    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed initiator,
        address indexed recipient,
        address token,
        uint256 amount,
        bytes32 combinedHash,
        uint256 timelock,
        string network
    );
    
    event SwapClaimed(bytes32 indexed swapId, address indexed recipient);
    event SwapRefunded(bytes32 indexed swapId, address indexed initiator);
    
    // Functions
    function generateCombinedHash(
        bytes32 initiatorHash,
        bytes32 recipientHash
    ) public pure returns (bytes32) {
        require(initiatorHash != bytes32(0), "Invalid initiator hash");
        require(recipientHash != bytes32(0), "Invalid recipient hash");
        
        // Hash all parameters together
        return keccak256(
            abi.encodePacked(
                initiatorHash,
                recipientHash
            )
        );
    }
    
    function lockFunds(
        address recipient,
        address token,
        uint256 amount,
        bytes32 combinedHash,
        uint256 timelock,
        string memory network,
        bytes32 swapId
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");
        require(timelock > block.timestamp, "Invalid timelock");
        require(!swaps[swapId].isActive, "Swap already exists");
        
        // Transfer tokens to contract
        IERC20 tokenContract = IERC20(token);
        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient allowance");
        
        uint256 balanceBefore = tokenContract.balanceOf(address(this));
        require(tokenContract.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        uint256 balanceAfter = tokenContract.balanceOf(address(this));
        require(balanceAfter - balanceBefore == amount, "Transfer amount mismatch");
        
        // Create swap
        swaps[swapId] = CrossChainSwap({
            initiator: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            combinedHash: combinedHash,
            timelock: timelock,
            network: network,
            isActive: true,
            isClaimed: false,
            isRefunded: false
        });
        
        emit SwapInitiated(
            swapId,
            msg.sender,
            recipient,
            token,
            amount,
            combinedHash,
            timelock,
            network
        );
    }
    
    function claimFunds(
        bytes32 swapId,
        bytes32 initiatorSecret,
        bytes32 recipientSecret
    ) external nonReentrant {
        CrossChainSwap storage swap = swaps[swapId];
        require(swap.isActive, "Swap not active");
        require(!swap.isClaimed, "Already claimed");
        require(!swap.isRefunded, "Already refunded");
        require(block.timestamp <= swap.timelock, "Timelock expired");
        require(msg.sender == swap.recipient, "Not recipient");
        
        // Verify combined hash
        bytes32 calculatedHash = generateCombinedHash(
            keccak256(abi.encodePacked(initiatorSecret)),
            keccak256(abi.encodePacked(recipientSecret))
        );
        require(calculatedHash == swap.combinedHash, "Invalid secrets");
        
        // Mark as claimed and transfer tokens
        swap.isClaimed = true;
        IERC20 tokenContract = IERC20(swap.token);
        uint256 balanceBefore = tokenContract.balanceOf(swap.recipient);
        require(tokenContract.transfer(swap.recipient, swap.amount), "Transfer failed");
        uint256 balanceAfter = tokenContract.balanceOf(swap.recipient);
        require(balanceAfter - balanceBefore == swap.amount, "Transfer amount mismatch");
        
        emit SwapClaimed(swapId, swap.recipient);
    }
    
    function refund(bytes32 swapId) external nonReentrant {
        CrossChainSwap storage swap = swaps[swapId];
        require(swap.isActive, "Swap not active");
        require(!swap.isClaimed, "Already claimed");
        require(!swap.isRefunded, "Already refunded");
        require(block.timestamp > swap.timelock, "Timelock not expired");
        require(msg.sender == swap.initiator, "Not initiator");
        
        // Mark as refunded and transfer tokens back
        swap.isRefunded = true;
        IERC20 tokenContract = IERC20(swap.token);
        uint256 balanceBefore = tokenContract.balanceOf(swap.initiator);
        require(tokenContract.transfer(swap.initiator, swap.amount), "Transfer failed");
        uint256 balanceAfter = tokenContract.balanceOf(swap.initiator);
        require(balanceAfter - balanceBefore == swap.amount, "Transfer amount mismatch");
        
        emit SwapRefunded(swapId, swap.initiator);
    }
    
    function getSwap(bytes32 swapId) external view returns (
        address initiator,
        address recipient,
        address token,
        uint256 amount,
        bytes32 combinedHash,
        uint256 timelock,
        string memory network,
        bool isActive,
        bool isClaimed,
        bool isRefunded
    ) {
        CrossChainSwap storage swap = swaps[swapId];
        return (
            swap.initiator,
            swap.recipient,
            swap.token,
            swap.amount,
            swap.combinedHash,
            swap.timelock,
            swap.network,
            swap.isActive,
            swap.isClaimed,
            swap.isRefunded
        );
    }
}

