const { ethers } = require("hardhat");
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Load deployed contract addresses
const ADDRESSES = require('../config/addresses.json');

// Load environment variables
require('dotenv').config();

// Default values for testing (same as in hardhat.config.js)
const DEFAULT_PRIVATE_KEY_ALICE = "";
const DEFAULT_PRIVATE_KEY_BOB = "";
const DEFAULT_SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/2aecf52b43c14068bf356ff538bfbe47`;
const DEFAULT_BSC_TESTNET_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";

// Add 0x prefix to private keys if needed
const addHexPrefix = (key) => {
    if (!key) return null;
    return key.startsWith('0x') ? key : `0x${key}`;
};

// Validate RPC URL
async function validateRpcUrl(url, network) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(url);
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ ${network} RPC URL validated (current block: ${blockNumber})`);
        return true;
    } catch (error) {
        console.error(`❌ ${network} RPC URL validation failed:`, error.message);
        return false;
    }
}

/**
 * Cross-network Test Script for HTLC vs FPPHTLC
 * Tests on Sepolia and BSC Testnet
 */

const CONFIG = {
    TEST_ITERATIONS: 5,  // Increase test iterations for better statistical accuracy
    TIMELOCK_DURATION: 3600,
    AMOUNT_TOKEN: ethers.utils.parseEther("0.001"), // Small amount for testing
    INITIAL_SUPPLY: ethers.utils.parseEther("1000"),
    DISTRIBUTION_AMOUNT: ethers.utils.parseEther("100")
};

class CrossNetworkTestResults {
    constructor() {
        this.iterations = [];
        this.summary = {
            sepolia: {
                deployTime: 0,
                avgLockTime: 0,
                avgClaimTime: 0,
                avgGasUsed: 0,
                totalGasUsed: 0,
                minLockTime: Infinity,
                maxLockTime: 0,
                minClaimTime: Infinity,
                maxClaimTime: 0,
                minGasUsed: Infinity,
                maxGasUsed: 0,
                successfulTests: 0
            },
            bscTestnet: {
                deployTime: 0,
                avgLockTime: 0,
                avgClaimTime: 0,
                avgGasUsed: 0,
                totalGasUsed: 0,
                minLockTime: Infinity,
                maxLockTime: 0,
                minClaimTime: Infinity,
                maxClaimTime: 0,
                minGasUsed: Infinity,
                maxGasUsed: 0,
                successfulTests: 0
            },
            errors: []
        };
    }

    addIteration(network, data) {
        this.iterations.push({
            network,
            timestamp: new Date().toISOString(),
            ...data
        });
        this.updateSummary(network, data);
    }

    updateSummary(network, data) {
        const stats = this.summary[network];
        stats.successfulTests++;
        
        // Update averages
        stats.avgLockTime = ((stats.avgLockTime * (stats.successfulTests - 1)) + data.lockTime) / stats.successfulTests;
        stats.avgClaimTime = ((stats.avgClaimTime * (stats.successfulTests - 1)) + data.claimTime) / stats.successfulTests;
        stats.avgGasUsed = ((stats.avgGasUsed * (stats.successfulTests - 1)) + data.gasUsed) / stats.successfulTests;
        stats.totalGasUsed += data.gasUsed;

        // Update min/max values
        stats.minLockTime = Math.min(stats.minLockTime, data.lockTime);
        stats.maxLockTime = Math.max(stats.maxLockTime, data.lockTime);
        stats.minClaimTime = Math.min(stats.minClaimTime, data.claimTime);
        stats.maxClaimTime = Math.max(stats.maxClaimTime, data.claimTime);
        stats.minGasUsed = Math.min(stats.minGasUsed, data.gasUsed);
        stats.maxGasUsed = Math.max(stats.maxGasUsed, data.gasUsed);
    }

    addError(network, error) {
        this.summary.errors.push({ 
            network, 
            error,
            timestamp: new Date().toISOString()
        });
    }
}

async function getContracts(network) {
    console.log(`\n📦 Getting contracts on ${network}...`);
    
    const addresses = ADDRESSES[network];
    
    const HTLC = await ethers.getContractFactory("HTLC");
    const FPPHTLC = await ethers.getContractFactory("FPPHTLC");
    const ERC20Mock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");

    const htlc = HTLC.attach(addresses.HTLC);
    const fpphtlc = FPPHTLC.attach(addresses.FPPHTLC);
    const tokenA = ERC20Mock.attach(addresses.TokenA);
    const tokenB = ERC20Mock.attach(addresses.TokenB);

    console.log(`Using contracts on ${network}:`);
    console.log(`HTLC: ${htlc.address}`);
    console.log(`FPPHTLC: ${fpphtlc.address}`);
    console.log(`Token A: ${tokenA.address}`);
    console.log(`Token B: ${tokenB.address}`);

    return { htlc, fpphtlc, tokenA, tokenB };
}

async function approveTokens(contracts, alice, bob) {
    const { htlc, fpphtlc, tokenA, tokenB } = contracts;
    const amount = CONFIG.AMOUNT_TOKEN.mul(10); // Approve more than needed

    console.log("Approving tokens...");
    
    // Alice approves both contracts to spend TokenA
    await tokenA.connect(alice).approve(htlc.address, amount);
    await tokenA.connect(alice).approve(fpphtlc.address, amount);
    
    // Bob approves both contracts to spend TokenB
    await tokenB.connect(bob).approve(htlc.address, amount);
    await tokenB.connect(bob).approve(fpphtlc.address, amount);
    
    console.log("Token approvals completed.");
}

async function runCrossNetworkTest() {
    console.log("🌐 Starting Cross-Network Test: Sepolia vs BSC Testnet");
    console.log("=" .repeat(60));

    // Validate RPC URLs
    const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL || DEFAULT_SEPOLIA_RPC_URL;
    const bscRpcUrl = process.env.BSC_TESTNET_RPC_URL || DEFAULT_BSC_TESTNET_RPC_URL;

    console.log("\n🔍 Validating RPC URLs");
    const sepoliaValid = await validateRpcUrl(sepoliaRpcUrl, "Sepolia");
    const bscValid = await validateRpcUrl(bscRpcUrl, "BSC Testnet");

    if (!sepoliaValid || !bscValid) {
        throw new Error("RPC URL validation failed. Please check your network configuration.");
    }

    const htlcResults = new CrossNetworkTestResults();
    const fpphtlcResults = new CrossNetworkTestResults();

    // Get signers for both networks
    const [alice, bob] = await ethers.getSigners();
    
    // Prepare private keys
    const alicePrivateKey = addHexPrefix(process.env.PRIVATE_KEY_ALICE || DEFAULT_PRIVATE_KEY_ALICE);
    const bobPrivateKey = addHexPrefix(process.env.PRIVATE_KEY_BOB || DEFAULT_PRIVATE_KEY_BOB);

    if (!alicePrivateKey || !bobPrivateKey) {
        throw new Error("Private keys not found. Please check your .env file or use the default test keys.");
    }
    
    console.log("\n🔑 Using accounts:");
    console.log(`Alice: ${new ethers.Wallet(alicePrivateKey).address}`);
    console.log(`Bob: ${new ethers.Wallet(bobPrivateKey).address}`);
    
    // Get contracts for Sepolia
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(sepoliaRpcUrl);
    const sepoliaAlice = new ethers.Wallet(alicePrivateKey, sepoliaProvider);
    const sepoliaBob = new ethers.Wallet(bobPrivateKey, sepoliaProvider);
    const sepoliaContracts = await getContracts("sepolia");

    // Get contracts for BSC Testnet
    const bscProvider = new ethers.providers.JsonRpcProvider(bscRpcUrl);
    const bscAlice = new ethers.Wallet(alicePrivateKey, bscProvider);
    const bscBob = new ethers.Wallet(bobPrivateKey, bscProvider);
    const bscContracts = await getContracts("bscTestnet");

    // Approve tokens on both networks
    console.log("\n🔓 Setting up token approvals");
    try {
        await approveTokens(sepoliaContracts, sepoliaAlice, sepoliaBob);
        console.log("✅ Sepolia token approvals completed");
    } catch (error) {
        console.error("❌ Sepolia token approvals failed:", error.message);
        htlcResults.addError("sepolia", error);
        fpphtlcResults.addError("sepolia", error);
    }

    try {
        await approveTokens(bscContracts, bscAlice, bscBob);
        console.log("✅ BSC Testnet token approvals completed");
    } catch (error) {
        console.error("❌ BSC Testnet token approvals failed:", error.message);
        htlcResults.addError("bscTestnet", error);
        fpphtlcResults.addError("bscTestnet", error);
    }

    // Run HTLC tests
    console.log("\n🧪 Running HTLC Cross-Network Tests");
    for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
        try {
            // Sepolia -> BSC test
            const sepoliaResult = await testHTLCOnNetwork(
                "sepolia",
                sepoliaContracts,
                sepoliaAlice,
                sepoliaBob,
                i
            );
            htlcResults.addIteration("sepolia", sepoliaResult);

            // BSC -> Sepolia test
            const bscResult = await testHTLCOnNetwork(
                "bscTestnet",
                bscContracts,
                bscAlice,
                bscBob,
                i
            );
            htlcResults.addIteration("bscTestnet", bscResult);

            console.log(`  ✅ HTLC Test ${i + 1}/${CONFIG.TEST_ITERATIONS} completed`);
        } catch (error) {
            console.log(`  ❌ HTLC Test ${i + 1} failed:`, error.message);
            htlcResults.addError("both", error);
        }
    }

    // Run FPPHTLC tests
    console.log("\n🧪 Running FPPHTLC Cross-Network Tests");
    for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
        try {
            // Parallel tests on both networks
            const [sepoliaResult, bscResult] = await Promise.all([
                testFPPHTLCOnNetwork(
                    "sepolia",
                    sepoliaContracts,
                    sepoliaAlice,
                    sepoliaBob,
                    i
                ),
                testFPPHTLCOnNetwork(
                    "bscTestnet",
                    bscContracts,
                    bscAlice,
                    bscBob,
                    i
                )
            ]);

            fpphtlcResults.addIteration("sepolia", sepoliaResult);
            fpphtlcResults.addIteration("bscTestnet", bscResult);

            console.log(`  ✅ FPPHTLC Test ${i + 1}/${CONFIG.TEST_ITERATIONS} completed`);
        } catch (error) {
            console.log(`  ❌ FPPHTLC Test ${i + 1} failed:`, error.message);
            fpphtlcResults.addError("both", error);
        }
    }

    // Generate and save report
    const report = generateCrossNetworkReport(htlcResults, fpphtlcResults);
    
    const reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir);
    }

    const reportPath = path.join(reportDir, `CROSS_NETWORK_COMPARISON.md`);
    fs.writeFileSync(reportPath, report);

    console.log("\n📊 Test Results Summary");
    console.log(`Detailed report saved to: ${reportPath}`);

    return { htlcResults, fpphtlcResults };
}

async function testHTLCOnNetwork(network, contracts, alice, bob, iteration) {
    const { htlc, tokenA, tokenB } = contracts;
    const result = {
        lockTime: 0,
        claimTime: 0,
        gasUsed: 0
    };

    // Setup
    const secretA = `alice_secret_${network}_${iteration}_${Date.now()}`;
    const secretB = `bob_secret_${network}_${iteration}_${Date.now()}`;
    const hashA = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretA));
    const hashB = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretB));
    const timelock = Math.floor(Date.now() / 1000) + CONFIG.TIMELOCK_DURATION;

    // Lock phase
    const lockStartTime = performance.now();
    
    const aliceLockTx = await htlc.connect(alice).lockFunds(
        bob.address, tokenA.address, CONFIG.AMOUNT_TOKEN, hashB, timelock, network
    );
    const aliceLockReceipt = await aliceLockTx.wait();

    const bobLockTx = await htlc.connect(bob).lockFunds(
        alice.address, tokenB.address, CONFIG.AMOUNT_TOKEN, hashA, timelock, network
    );
    const bobLockReceipt = await bobLockTx.wait();

    const lockEndTime = performance.now();
    result.lockTime = lockEndTime - lockStartTime;

    // Claim phase
    const claimStartTime = performance.now();

    const aliceSwapId = aliceLockReceipt.events.find(e => e.event === 'SwapInitiated').args.swapId;
    const bobSwapId = bobLockReceipt.events.find(e => e.event === 'SwapInitiated').args.swapId;

    const bobClaimTx = await htlc.connect(bob).claimFunds(aliceSwapId, secretB);
    const bobClaimReceipt = await bobClaimTx.wait();

    const aliceClaimTx = await htlc.connect(alice).claimFunds(bobSwapId, secretA);
    const aliceClaimReceipt = await aliceClaimTx.wait();

    const claimEndTime = performance.now();
    result.claimTime = claimEndTime - claimStartTime;

    // Calculate gas
    result.gasUsed = aliceLockReceipt.gasUsed
        .add(bobLockReceipt.gasUsed)
        .add(bobClaimReceipt.gasUsed)
        .add(aliceClaimReceipt.gasUsed)
        .toNumber();

    return result;
}

async function testFPPHTLCOnNetwork(network, contracts, alice, bob, iteration) {
    const { fpphtlc, tokenA, tokenB } = contracts;
    const result = {
        lockTime: 0,
        claimTime: 0,
        gasUsed: 0
    };

    // Setup
    const secretA = ethers.utils.formatBytes32String(`secret_${iteration}_A`);
    const secretB = ethers.utils.formatBytes32String(`secret_${iteration}_B`);
    const hashA = ethers.utils.keccak256(ethers.utils.arrayify(secretA));
    const hashB = ethers.utils.keccak256(ethers.utils.arrayify(secretB));
    const timelock = Math.floor(Date.now() / 1000) + CONFIG.TIMELOCK_DURATION;

    console.log("\nDebug Info:");
    console.log("secretA:", secretA);
    console.log("secretB:", secretB);
    console.log("hashA:", hashA);
    console.log("hashB:", hashB);
    console.log("alice:", alice.address);
    console.log("bob:", bob.address);

    // Generate combined hashes
    console.log("\nGenerating combined hashes...");
    const combinedHashAlice = await fpphtlc.connect(alice).generateCombinedHash(
        hashA,
        hashB
    );
    console.log("combinedHashAlice:", combinedHashAlice);

    const combinedHashBob = await fpphtlc.connect(bob).generateCombinedHash(
        hashB,
        hashA
    );
    console.log("combinedHashBob:", combinedHashBob);

    // Generate swap IDs
    const swapId = ethers.utils.keccak256(ethers.utils.solidityPack(
        ["string", "uint256"], [`${network}_test`, iteration]
    ));
    const bobSwapId = ethers.utils.keccak256(ethers.utils.solidityPack(
        ["bytes32", "string"], [swapId, "_bob"]
    ));

    // Lock phase
    const lockStartTime = performance.now();

    console.log("\nLocking funds...");
    console.log("Parameters for Alice's lockFunds:");
    console.log("- recipient:", bob.address);
    console.log("- token:", tokenA.address);
    console.log("- amount:", CONFIG.AMOUNT_TOKEN.toString());
    console.log("- combinedHash:", combinedHashAlice);
    console.log("- timelock:", timelock);
    console.log("- network:", network);
    console.log("- swapId:", swapId);

    const [aliceLockTx, bobLockTx] = await Promise.all([
        fpphtlc.connect(alice).lockFunds(
            bob.address,
            tokenA.address,
            CONFIG.AMOUNT_TOKEN,
            combinedHashAlice,
            timelock,
            network,
            swapId
        ),
        fpphtlc.connect(bob).lockFunds(
            alice.address,
            tokenB.address,
            CONFIG.AMOUNT_TOKEN,
            combinedHashBob,
            timelock,
            network,
            bobSwapId
        )
    ]);

    const [aliceLockReceipt, bobLockReceipt] = await Promise.all([
        aliceLockTx.wait(),
        bobLockTx.wait()
    ]);

    const lockEndTime = performance.now();
    result.lockTime = lockEndTime - lockStartTime;

    // Claim phase
    const claimStartTime = performance.now();

    const bobClaimTx = await fpphtlc.connect(bob).claimFunds(
        swapId, secretA, secretB
    );
    const bobClaimReceipt = await bobClaimTx.wait();

    const aliceClaimTx = await fpphtlc.connect(alice).claimFunds(
        bobSwapId, secretB, secretA
    );
    const aliceClaimReceipt = await aliceClaimTx.wait();

    const claimEndTime = performance.now();
    result.claimTime = claimEndTime - claimStartTime;

    // Calculate gas
    result.gasUsed = aliceLockReceipt.gasUsed
        .add(bobLockReceipt.gasUsed)
        .add(bobClaimReceipt.gasUsed)
        .add(aliceClaimReceipt.gasUsed)
        .toNumber();

    return result;
}

function generateCrossNetworkReport(htlcResults, fpphtlcResults) {
    const formatTime = (ms) => (ms / 1000).toFixed(2);
    const formatGas = (gas) => gas.toLocaleString();
    
    return `# Cross-Network Comparison Report: HTLC vs FPPHTLC

## Test Configuration
- Test Iterations: ${CONFIG.TEST_ITERATIONS}
- Token Amount: ${ethers.utils.formatEther(CONFIG.AMOUNT_TOKEN)} tokens
- Timelock Duration: ${CONFIG.TIMELOCK_DURATION} seconds

## 1. Detailed Network Performance

### Sepolia Network

#### HTLC Protocol
- Lock Time:
  - Average: ${formatTime(htlcResults.summary.sepolia.avgLockTime)}s
  - Min: ${formatTime(htlcResults.summary.sepolia.minLockTime)}s
  - Max: ${formatTime(htlcResults.summary.sepolia.maxLockTime)}s
- Claim Time:
  - Average: ${formatTime(htlcResults.summary.sepolia.avgClaimTime)}s
  - Min: ${formatTime(htlcResults.summary.sepolia.minClaimTime)}s
  - Max: ${formatTime(htlcResults.summary.sepolia.maxClaimTime)}s
- Gas Usage:
  - Average: ${formatGas(htlcResults.summary.sepolia.avgGasUsed)}
  - Min: ${formatGas(htlcResults.summary.sepolia.minGasUsed)}
  - Max: ${formatGas(htlcResults.summary.sepolia.maxGasUsed)}
  - Total: ${formatGas(htlcResults.summary.sepolia.totalGasUsed)}

#### FPPHTLC Protocol
- Lock Time:
  - Average: ${formatTime(fpphtlcResults.summary.sepolia.avgLockTime)}s
  - Min: ${formatTime(fpphtlcResults.summary.sepolia.minLockTime)}s
  - Max: ${formatTime(fpphtlcResults.summary.sepolia.maxLockTime)}s
- Claim Time:
  - Average: ${formatTime(fpphtlcResults.summary.sepolia.avgClaimTime)}s
  - Min: ${formatTime(fpphtlcResults.summary.sepolia.minClaimTime)}s
  - Max: ${formatTime(fpphtlcResults.summary.sepolia.maxClaimTime)}s
- Gas Usage:
  - Average: ${formatGas(fpphtlcResults.summary.sepolia.avgGasUsed)}
  - Min: ${formatGas(fpphtlcResults.summary.sepolia.minGasUsed)}
  - Max: ${formatGas(fpphtlcResults.summary.sepolia.maxGasUsed)}
  - Total: ${formatGas(fpphtlcResults.summary.sepolia.totalGasUsed)}

### BSC Testnet Network

#### HTLC Protocol
- Lock Time:
  - Average: ${formatTime(htlcResults.summary.bscTestnet.avgLockTime)}s
  - Min: ${formatTime(htlcResults.summary.bscTestnet.minLockTime)}s
  - Max: ${formatTime(htlcResults.summary.bscTestnet.maxLockTime)}s
- Claim Time:
  - Average: ${formatTime(htlcResults.summary.bscTestnet.avgClaimTime)}s
  - Min: ${formatTime(htlcResults.summary.bscTestnet.minClaimTime)}s
  - Max: ${formatTime(htlcResults.summary.bscTestnet.maxClaimTime)}s
- Gas Usage:
  - Average: ${formatGas(htlcResults.summary.bscTestnet.avgGasUsed)}
  - Min: ${formatGas(htlcResults.summary.bscTestnet.minGasUsed)}
  - Max: ${formatGas(htlcResults.summary.bscTestnet.maxGasUsed)}
  - Total: ${formatGas(htlcResults.summary.bscTestnet.totalGasUsed)}

#### FPPHTLC Protocol
- Lock Time:
  - Average: ${formatTime(fpphtlcResults.summary.bscTestnet.avgLockTime)}s
  - Min: ${formatTime(fpphtlcResults.summary.bscTestnet.minLockTime)}s
  - Max: ${formatTime(fpphtlcResults.summary.bscTestnet.maxLockTime)}s
- Claim Time:
  - Average: ${formatTime(fpphtlcResults.summary.bscTestnet.avgClaimTime)}s
  - Min: ${formatTime(fpphtlcResults.summary.bscTestnet.minClaimTime)}s
  - Max: ${formatTime(fpphtlcResults.summary.bscTestnet.maxClaimTime)}s
- Gas Usage:
  - Average: ${formatGas(fpphtlcResults.summary.bscTestnet.avgGasUsed)}
  - Min: ${formatGas(fpphtlcResults.summary.bscTestnet.minGasUsed)}
  - Max: ${formatGas(fpphtlcResults.summary.bscTestnet.maxGasUsed)}
  - Total: ${formatGas(fpphtlcResults.summary.bscTestnet.totalGasUsed)}

## 2. Protocol Comparison

### Performance Improvement
- Lock Time: ${((htlcResults.summary.sepolia.avgLockTime + htlcResults.summary.bscTestnet.avgLockTime) - (fpphtlcResults.summary.sepolia.avgLockTime + fpphtlcResults.summary.bscTestnet.avgLockTime)) / (htlcResults.summary.sepolia.avgLockTime + htlcResults.summary.bscTestnet.avgLockTime) * 100}%
- Claim Time: ${((htlcResults.summary.sepolia.avgClaimTime + htlcResults.summary.bscTestnet.avgClaimTime) - (fpphtlcResults.summary.sepolia.avgClaimTime + fpphtlcResults.summary.bscTestnet.avgClaimTime)) / (htlcResults.summary.sepolia.avgClaimTime + htlcResults.summary.bscTestnet.avgClaimTime) * 100}%
- Gas Usage: ${((fpphtlcResults.summary.sepolia.avgGasUsed + fpphtlcResults.summary.bscTestnet.avgGasUsed) - (htlcResults.summary.sepolia.avgGasUsed + htlcResults.summary.bscTestnet.avgGasUsed)) / (htlcResults.summary.sepolia.avgGasUsed + htlcResults.summary.bscTestnet.avgGasUsed) * 100}%

### Network Comparison
- Transaction Speed: ${((htlcResults.summary.sepolia.avgLockTime + htlcResults.summary.sepolia.avgClaimTime) < (htlcResults.summary.bscTestnet.avgLockTime + htlcResults.summary.bscTestnet.avgClaimTime) ? 'Sepolia faster' : 'BSC Testnet faster')}
- Gas Cost: ${(htlcResults.summary.sepolia.avgGasUsed < htlcResults.summary.bscTestnet.avgGasUsed ? 'Sepolia cheaper' : 'BSC Testnet cheaper')}

## 3. Test Details

### Successful Tests
- HTLC: ${htlcResults.summary.sepolia.successfulTests + htlcResults.summary.bscTestnet.successfulTests} tests
- FPPHTLC: ${fpphtlcResults.summary.sepolia.successfulTests + fpphtlcResults.summary.bscTestnet.successfulTests} tests

### Error Analysis

#### HTLC Errors
${htlcResults.summary.errors.map(e => `- ${e.network} (${new Date(e.timestamp).toLocaleString()}): ${e.error}`).join('\n') || 'No errors'}

#### FPPHTLC Errors
${fpphtlcResults.summary.errors.map(e => `- ${e.network} (${new Date(e.timestamp).toLocaleString()}): ${e.error}`).join('\n') || 'No errors'}

## 4. Conclusion

### Overall Performance
- Lock Phase: ${((htlcResults.summary.sepolia.avgLockTime + htlcResults.summary.bscTestnet.avgLockTime) > (fpphtlcResults.summary.sepolia.avgLockTime + fpphtlcResults.summary.bscTestnet.avgLockTime) ? 'FPPHTLC significantly faster' : 'HTLC slightly faster')}
- Claim Phase: ${((htlcResults.summary.sepolia.avgClaimTime + htlcResults.summary.bscTestnet.avgClaimTime) > (fpphtlcResults.summary.sepolia.avgClaimTime + fpphtlcResults.summary.bscTestnet.avgClaimTime) ? 'FPPHTLC significantly faster' : 'HTLC slightly faster')}
- Gas Efficiency: ${((fpphtlcResults.summary.sepolia.avgGasUsed + fpphtlcResults.summary.bscTestnet.avgGasUsed) < (htlcResults.summary.sepolia.avgGasUsed + htlcResults.summary.bscTestnet.avgGasUsed) ? 'FPPHTLC more efficient' : 'HTLC more efficient')}

### Recommendations
1. ${((htlcResults.summary.sepolia.avgLockTime + htlcResults.summary.bscTestnet.avgLockTime) > (fpphtlcResults.summary.sepolia.avgLockTime + fpphtlcResults.summary.bscTestnet.avgLockTime) ? 'Consider using FPPHTLC for faster transaction completion' : 'Both protocols show similar performance')}
2. ${((fpphtlcResults.summary.sepolia.avgGasUsed + fpphtlcResults.summary.bscTestnet.avgGasUsed) < (htlcResults.summary.sepolia.avgGasUsed + htlcResults.summary.bscTestnet.avgGasUsed) ? 'FPPHTLC shows better gas efficiency' : 'HTLC shows better gas efficiency')}
3. Network choice depends on priority (speed vs cost)

---
Report generated at: ${new Date().toISOString()}`;
}

// Execute if running directly
if (require.main === module) {
    runCrossNetworkTest()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Test failed:", error);
            process.exit(1);
        });
}

module.exports = { runCrossNetworkTest, CrossNetworkTestResults, CONFIG }; 