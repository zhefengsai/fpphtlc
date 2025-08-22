# Cross-Chain HTLC Protocol Implementation

A Solidity-based FPPHTLC(An Improved Faster and Privacy-Preserving Atomic Swap Protocol), improved from HTLC(Hash Time Lock Contract ), is an implementation of a faster and privacy-preserving atomic swap protocol that supports cross-chain atomic asset exchange.

Through the comparative experiments conducted in this study, it has been observed that the FPPHTLC protocol outperforms the standard HTLC protocol with respect to execution speed. Additionally, the FPPHTLC protocol provides an improved degree of privacy under certain conditions.


## Features

- ✅ Standard HTLC contract implementation
- ✅ Fast Private Protect HTLC (FPPHTLC) implementation
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

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# See Environment Setup section for detailed instructions
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Fund Test Accounts

Before proceeding, ensure your test accounts have sufficient funds:

- **Sepolia**: Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- **BSC Testnet**: Get test BNB from [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)

### 5. Deploy Contracts

```bash
# Deploy to local network
npx hardhat run scripts/deploy.js

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to BSC testnet
npx hardhat run scripts/deploy.js --network bscTestnet
```

### 6. Verify Setup

```bash
# Check account balances
npx hardhat run scripts/check-balance.js --network sepolia

# Distribute tokens to test accounts (if needed)
npx hardhat run scripts/distribute-tokens.js --network sepolia
```

### 7. Run Cross-Network Tests

```bash
# Run cross-network comparison between HTLC and FPPHTLC
npx hardhat run scripts/cross-network-test.js --network sepolia
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
    TEST_ITERATIONS: 3,  // Number of test iterations
    TIMELOCK_DURATION: 3600, // 1 hour timelock
    AMOUNT_TOKEN: ethers.utils.parseEther("0.001"), // Test amount
    APPROVAL_AMOUNT: ethers.utils.parseEther("10.0") // Token approval amount
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

The test generates a detailed report (`reports/CROSS_NETWORK_HTLC_VS_FPPHTLC_COMPARISON.md`) containing:

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
: An Improved Faster and Privacy-Preserving HTLC supporting atomic swaps:
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

### FPPHTLC (An Improved Faster and Privacy-Preserving HTLC)
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

## Token Distribution and Testing

### Automatic Token Distribution

The project includes an automated token distribution system that ensures both Alice and Bob have sufficient tokens for testing:

```bash
# Deploy contracts and automatically distribute tokens
npx hardhat run scripts/deploy.js --network sepolia

# Manually distribute tokens
npx hardhat run scripts/distribute-tokens.js --network sepolia

# Check account balances
npx hardhat run scripts/check-balance.js --network sepolia
```

### Balance Management

- **Automatic Distribution**: Tokens are automatically distributed after deployment
- **Balance Checking**: Utility scripts to verify account balances
- **Cross-Network Support**: Works on Sepolia, BSC Testnet, and local networks
- **Configurable Amounts**: Customizable distribution amounts via environment variables

### Environment Variables for Token Distribution

```bash
# Token distribution amounts (default: 500 tokens each)
ALICE_TOKEN_A=500    # Alice's TokenA amount
ALICE_TOKEN_B=500    # Alice's TokenB amount
BOB_TOKEN_A=500      # Bob's TokenA amount
BOB_TOKEN_B=500      # Bob's TokenB amount

# Initial supply for token deployment (default: 1000 tokens)
INITIAL_SUPPLY=1000
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

# Check token balances
npx hardhat run scripts/check-balance.js --network sepolia

# Distribute tokens to test accounts
npx hardhat run scripts/distribute-tokens.js --network sepolia

# Verify contract on Sepolia
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Environment Setup

### 1. Copy Environment Template

First, copy the environment template file:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file and fill in your configuration:

#### **Required Network Configuration**
```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

**How to get RPC URLs:**
- **Sepolia**: Sign up at [Infura](https://infura.io/) or [Alchemy](https://alchemy.com/)
- **BSC Testnet**: Use the provided URL or get from [BSC Documentation](https://docs.bnbchain.org/docs/rpc)

#### **Required Account Configuration**
```bash
# Account Private Keys (Replace with your actual private keys)
PRIVATE_KEY_ALICE=your_alice_private_key_here_without_0x_prefix
PRIVATE_KEY_BOB=your_bob_private_key_here_without_0x_prefix
```

**⚠️ Security Notes:**
- Never commit your `.env` file to version control
- Use test accounts with minimal funds
- Private keys should be 64 characters long (without 0x prefix)

#### **Required API Keys**
```bash
# API Keys for Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here
```

**How to get API Keys:**
- **Etherscan**: Sign up at [Etherscan](https://etherscan.io/apis)
- **BSCScan**: Sign up at [BSCScan](https://bscscan.com/apis)

#### **Optional Gas Settings**
```bash
# Gas Settings (defaults are provided)
GAS_PRICE_SEPOLIA=3000000000
GAS_PRICE_BSC=10000000000
GAS_LIMIT=500000
MAX_FEE_PER_GAS=10000000000
MAX_PRIORITY_FEE_PER_GAS=1000000000
NETWORK_TIMEOUT=60000
```

#### **Token Distribution Settings**
```bash
# Token distribution amounts (default: 500 tokens each)
ALICE_TOKEN_A=500
ALICE_TOKEN_B=500
BOB_TOKEN_A=500
BOB_TOKEN_B=500

# Initial supply for token deployment (default: 1000 tokens)
INITIAL_SUPPLY=1000
```

#### **Test Configuration**
```bash
# Test Configuration
TEST_ITERATIONS=3
TIMELOCK_DURATION=3600
AMOUNT_TOKEN=0.001
APPROVAL_AMOUNT=10.0
```

### 3. Fund Test Accounts

Before running tests, ensure your test accounts have sufficient funds:

#### **Sepolia Testnet**
- Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Minimum recommended: 0.1 ETH per account

#### **BSC Testnet**
- Get test BNB from [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- Minimum recommended: 0.1 BNB per account

### 4. Verify Configuration

Test your configuration:

```bash
# Check if environment variables are loaded
npx hardhat run scripts/check-balance.js --network sepolia
```

## Troubleshooting

### Common Issues

#### **1. Environment Variables Not Found**
```bash
Error: SEPOLIA_RPC_URL not set
```
**Solution**: Ensure you've copied `.env.example` to `.env` and filled in all required values.

#### **2. Insufficient Funds**
```bash
Error: insufficient funds for gas
```
**Solution**: Fund your test accounts using the provided faucets.

#### **3. Network Connection Issues**
```bash
Error: network timeout
```
**Solution**: Check your RPC URLs and network connectivity.

#### **4. Private Key Format**
```bash
Error: invalid private key
```
**Solution**: Ensure private keys are 64 characters long without 0x prefix.

#### **5. Contract Deployment Failures**
```bash
Error: contract deployment failed
```
**Solution**: Check gas settings and ensure sufficient funds for deployment.

### Getting Help

If you encounter issues:

1. **Check the logs** for detailed error messages
2. **Verify environment variables** are correctly set
3. **Ensure test accounts** have sufficient funds
4. **Check network connectivity** and RPC URLs
5. **Review gas settings** for your target network

## Project Structure

```
├── contracts/                    # Smart contract implementations
│   ├── HTLC.sol                 # Standard HTLC contract
│   ├── FPPHTLC.sol              # An Improved Faster and Privacy-Preserving HTLC
│   └── mocks/
│       └── ERC20Mock.sol        # Mock ERC20 token for testing
├── scripts/                     # Deployment and utility scripts
│   ├── deploy.js                # Contract deployment script
│   ├── cross-network-test.js    # Cross-network performance test
│   ├── distribute-tokens.js     # Token distribution script
│   ├── check-balance.js         # Balance checking utility
│   └── give-bob-tokenb.js       # Token transfer utility
├── test/                        # Unit tests
│   └── FPPHTLC.test.js          # FPPHTLC contract tests
├── reports/                     # Test results and analysis
│   └── CROSS_NETWORK_HTLC_VS_FPPHTLC_COMPARISON.md
├── docs/                        # Documentation
│   └── token-distribution.md    # Token distribution guide
├── config/                      # Configuration files
│   └── addresses.json           # Deployed contract addresses
├── artifacts/                   # Compiled contract artifacts
├── cache/                       # Hardhat cache
├── node_modules/                # Dependencies
├── package.json                 # Project dependencies
├── package-lock.json            # Dependency lock file
├── hardhat.config.js            # Hardhat configuration
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
└── README.md                    # Project documentation
```

## License

MIT License 