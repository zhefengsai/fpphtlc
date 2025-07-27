# Cross-Chain HTLC Protocol Implementation

A Solidity-based Hash Time Lock Contract (HTLC) implementation supporting secure cross-chain asset exchange, with an Improved Faster and Privacy-Preserving Atomic Swap Protocol (FPPHTLC) variant.

Through the comparative experiments conducted in this study, it has been observed that the FPPHTLC protocol outperforms the standard HTLC protocol with respect to execution speed. Additionally, the FPPHTLC protocol provides an improved degree of privacy under certain conditions.


## Features

- ✅ Standard HTLC contract implementation
- ✅ Faster and Privacy-Preserving Atomic Swap Protocol (FPPHTLC) implementation
- ✅ Cross-chain transaction support
- ✅ Batch operation support
- ✅ Performance testing tools
- ✅ Complete event logging
- ✅ Security protections (reentrancy guard)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Contracts

```bash
npx hardhat compile
```

### 3. Start Local Test Network

```bash
npx hardhat node
```

### 4. Deploy Contracts

```bash
# Deploy to local network
npx hardhat run scripts/deploy.js

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to BSC testnet
npx hardhat run scripts/deploy.js --network bscTestnet
```

### 5. Run Cross-Network Tests

```bash
# Run cross-network comparison between HTLC and FPPHTLC
npx hardhat run scripts/cross-network-test.js
```

## Cross-Network Testing

The cross-network test script (`scripts/cross-network-test.js`) performs the following tests:

1. **HTLC Protocol Testing**
   - Locks funds on both Sepolia and BSC Testnet
   - Measures lock time, claim time, and gas usage
   - Tests multiple iterations for statistical significance

2. **FPPHTLC Protocol Testing**
   - Tests the optimized protocol with combined hash mechanism
   - Performs parallel operations on both networks
   - Compares performance metrics with HTLC

### Test Configuration

```javascript
const CONFIG = {
    TEST_ITERATIONS: 5,  // Number of test iterations
    TIMELOCK_DURATION: 3600, // 1 hour timelock
    AMOUNT_TOKEN: ethers.utils.parseEther("0.001"), // Test amount
    INITIAL_SUPPLY: ethers.utils.parseEther("1000"),
    DISTRIBUTION_AMOUNT: ethers.utils.parseEther("100")
};
```

### Test Metrics

The test collects and reports the following metrics:

- **Lock Time**: Time taken to lock funds on each network
- **Claim Time**: Time taken to claim funds on each network
- **Gas Usage**: Gas consumption for all operations
- **Success Rate**: Number of successful swaps
- **Error Analysis**: Detailed error reporting

### Test Report

The test generates a detailed report (`reports/CROSS_NETWORK_COMPARISON.md`) containing:

1. **Network Performance**
   - Average/Min/Max lock times
   - Average/Min/Max claim times
   - Gas usage statistics

2. **Protocol Comparison**
   - Performance improvements
   - Gas efficiency comparison
   - Network speed comparison

3. **Test Details**
   - Number of successful tests
   - Error analysis
   - Recommendations

## Contract Architecture

### HTLC.sol
Standard HTLC contract supporting ERC20 tokens:
- `lockFunds()` - Lock tokens with hash and timelock
- `claimFunds()` - Claim tokens with correct secret
- `refund()` - Refund after timeout

### FPPHTLC.sol
Faster and Privacy-Preserving Atomic Swap Protocol supporting atomic swaps:
- `generateCombinedHash()` - Generate combined hash for both parties
- `lockFunds()` - Lock tokens with combined hash
- `claimFunds()` - Claim with both secrets
- `refund()` - Refund after timeout

## Usage Examples

### HTLC (Standard Protocol)
```javascript
// Create hash from secret
const secret = "my_secret_key";
const hashLock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
const amount = ethers.utils.parseEther("0.001");

// Approve token usage
await token.approve(htlc.address, amount);

// Lock funds
const tx = await htlc.lockFunds(
    receiverAddress,
    tokenAddress,
    amount,
    hashLock,
    timelock,
    "network_name"
);
```

### FPPHTLC (Faster and Privacy-Preserving Atomic Swap Protocol)
```javascript
// Generate secrets and hashes
const secretA = ethers.utils.formatBytes32String("alice_secret");
const secretB = ethers.utils.formatBytes32String("bob_secret");
const hashA = ethers.utils.keccak256(ethers.utils.arrayify(secretA));
const hashB = ethers.utils.keccak256(ethers.utils.arrayify(secretB));

// Generate combined hashes
const combinedHashAlice = await fpphtlc.generateCombinedHash(
    hashA,
    hashB
);

// Lock funds
await fpphtlc.lockFunds(
    receiverAddress,
    tokenAddress,
    amount,
    combinedHashAlice,
    timelock,
    "network_name",
    swapId
);
```

## Security Considerations

1. **Timelock Mechanism** - Prevents permanent fund locking
2. **Hash Lock Verification** - Ensures only secret holders can claim
3. **Reentrancy Protection** - Uses OpenZeppelin's ReentrancyGuard
4. **Input Validation** - Strict parameter validation
5. **Event Logging** - Complete operation records

## Development and Testing

```bash
# Run unit tests
npx hardhat test

# Run cross-network tests
npx hardhat run scripts/cross-network-test.js

# Verify contract on Sepolia
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Environment Setup

Copy `.env.example` to `.env` and fill in the configuration:

```bash
cp .env.example .env
```

Edit `.env` file:

```
SEPOLIA_RPC_URL=your_sepolia_rpc_url
BSC_TESTNET_RPC_URL=your_bsc_testnet_rpc_url
PRIVATE_KEY_ALICE=your_alice_private_key
PRIVATE_KEY_BOB=your_bob_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

## Project Structure

```
├── contracts/
│   ├── HTLC.sol           # Standard HTLC contract
│   └── FPPHTLC.sol        # Faster and Privacy-Preserving Atomic Swap Protocol 
├── scripts/
│   ├── deploy.js          # Deployment script
│   ├── cross-network-test.js # Cross-network test script
│   ├── fund-accounts.js   # Account funding script
│   └── distribute-tokens.js # Token distribution script
├── test/
│   ├── HTLC.test.js      # HTLC unit tests
│   └── FPPHTLC.test.js   # FPPHTLC unit tests
├── reports/
│   └── CROSS_NETWORK_COMPARISON.md # Test results
├── package.json          # Project dependencies
├── hardhat.config.js    # Hardhat configuration
└── README.md            # Documentation
```

## License

MIT License 
