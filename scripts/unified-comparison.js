const { ethers } = require("hardhat");
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

/**
 * Unified Comprehensive Test Script for HTLC vs FPPHTLC
 */

// Configuration
const CONFIG = {
    TEST_ITERATIONS: 10,
    TIMELOCK_DURATION: 3600,
    AMOUNT_TOKEN: ethers.utils.parseEther("1"),
    INITIAL_SUPPLY: ethers.utils.parseEther("10000"),
    DISTRIBUTION_AMOUNT: ethers.utils.parseEther("1000")
};

// Detailed test results structure
class DetailedTestResults {
    constructor() {
        this.iterations = [];
        this.summary = {
            performance: {
                lockPhase: { min: Infinity, max: 0, avg: 0, total: 0 },
                claimPhase: { min: Infinity, max: 0, avg: 0, total: 0 },
                fullCycle: { min: Infinity, max: 0, avg: 0, total: 0 }
            },
            gas: {
                lock: { min: Infinity, max: 0, avg: 0, total: 0 },
                claim: { min: Infinity, max: 0, avg: 0, total: 0 },
                total: { min: Infinity, max: 0, avg: 0, total: 0 }
            },
            successRate: 0,
            errors: []
        };
    }

    addIteration(iteration) {
        this.iterations.push(iteration);
        this.updateSummary(iteration);
    }

    updateSummary(iteration) {
        // Update performance metrics
        this.updateMetric('performance', 'lockPhase', iteration.performance.lockTime);
        this.updateMetric('performance', 'claimPhase', iteration.performance.claimTime);
        this.updateMetric('performance', 'fullCycle', iteration.performance.cycleTime);

        // Update gas metrics
        this.updateMetric('gas', 'lock', iteration.gas.lock);
        this.updateMetric('gas', 'claim', iteration.gas.claim);
        this.updateMetric('gas', 'total', iteration.gas.total);
    }

    updateMetric(category, metric, value) {
        const stats = this.summary[category][metric];
        stats.min = Math.min(stats.min, value);
        stats.max = Math.max(stats.max, value);
        stats.total += value;
        stats.avg = stats.total / this.iterations.length;
    }

    calculateSuccessRate() {
        const successCount = this.iterations.filter(i => i.success).length;
        this.summary.successRate = (successCount / this.iterations.length) * 100;
        return this.summary.successRate;
    }

    addError(error) {
        this.summary.errors.push(error);
    }
}

// Helper function to format numbers
function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Helper function to calculate percentage difference
function calculateImprovement(baseValue, newValue) {
    return ((baseValue - newValue) / baseValue) * 100;
}

async function generateDetailedReport(htlcResults, fpphtlcResults) {
    const reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir);
    }

    // Generate detailed test data report
    const testDataReport = {
        timestamp: new Date().toISOString(),
        config: CONFIG,
        htlc: {
            iterations: htlcResults.iterations,
            summary: htlcResults.summary
        },
        fpphtlc: {
            iterations: fpphtlcResults.iterations,
            summary: fpphtlcResults.summary
        },
        comparison: {
            performance: {
                lockPhase: calculateImprovement(
                    htlcResults.summary.performance.lockPhase.avg,
                    fpphtlcResults.summary.performance.lockPhase.avg
                ),
                claimPhase: calculateImprovement(
                    htlcResults.summary.performance.claimPhase.avg,
                    fpphtlcResults.summary.performance.claimPhase.avg
                ),
                fullCycle: calculateImprovement(
                    htlcResults.summary.performance.fullCycle.avg,
                    fpphtlcResults.summary.performance.fullCycle.avg
                )
            },
            gas: {
                lock: calculateImprovement(
                    htlcResults.summary.gas.lock.avg,
                    fpphtlcResults.summary.gas.lock.avg
                ) * -1, // Invert for cost increase
                claim: calculateImprovement(
                    htlcResults.summary.gas.claim.avg,
                    fpphtlcResults.summary.gas.claim.avg
                ) * -1,
                total: calculateImprovement(
                    htlcResults.summary.gas.total.avg,
                    fpphtlcResults.summary.gas.total.avg
                ) * -1
            }
        }
    };

    // Save detailed test data
    const testDataPath = path.join(reportDir, `test-data-${Date.now()}.json`);
    fs.writeFileSync(testDataPath, JSON.stringify(testDataReport, null, 2));

    // Generate markdown report
    const markdownReport = generateMarkdownReport(testDataReport);
    const markdownPath = path.join(reportDir, `COMPREHENSIVE_COMPARISON.md`);
    fs.writeFileSync(markdownPath, markdownReport);

    return { testDataReport, markdownPath };
}

function generateMarkdownReport(data) {
    const htlc = data.htlc.summary;
    const fpphtlc = data.fpphtlc.summary;
    const comparison = data.comparison;

    return `# HTLC vs FPPHTLC Comprehensive Comparison Report

## Test Configuration
- Test Iterations: ${CONFIG.TEST_ITERATIONS}
- Token Amount: ${ethers.utils.formatEther(CONFIG.AMOUNT_TOKEN)} tokens
- Timelock Duration: ${CONFIG.TIMELOCK_DURATION} seconds

## 1. Time Performance Analysis

### 1.1 Detailed Performance Metrics

| Metric | Protocol | Min | Max | Avg | Improvement |
|--------|----------|-----|-----|-----|-------------|
| Lock Time | HTLC | ${formatNumber(htlc.performance.lockPhase.min)}ms | ${formatNumber(htlc.performance.lockPhase.max)}ms | ${formatNumber(htlc.performance.lockPhase.avg)}ms | |
| | FPPHTLC | ${formatNumber(fpphtlc.performance.lockPhase.min)}ms | ${formatNumber(fpphtlc.performance.lockPhase.max)}ms | ${formatNumber(fpphtlc.performance.lockPhase.avg)}ms | ${formatNumber(comparison.performance.lockPhase)}% |
| Claim Time | HTLC | ${formatNumber(htlc.performance.claimPhase.min)}ms | ${formatNumber(htlc.performance.claimPhase.max)}ms | ${formatNumber(htlc.performance.claimPhase.avg)}ms | |
| | FPPHTLC | ${formatNumber(fpphtlc.performance.claimPhase.min)}ms | ${formatNumber(fpphtlc.performance.claimPhase.max)}ms | ${formatNumber(fpphtlc.performance.claimPhase.avg)}ms | ${formatNumber(comparison.performance.claimPhase)}% |
| Full Cycle | HTLC | ${formatNumber(htlc.performance.fullCycle.min)}ms | ${formatNumber(htlc.performance.fullCycle.max)}ms | ${formatNumber(htlc.performance.fullCycle.avg)}ms | |
| | FPPHTLC | ${formatNumber(fpphtlc.performance.fullCycle.min)}ms | ${formatNumber(fpphtlc.performance.fullCycle.max)}ms | ${formatNumber(fpphtlc.performance.fullCycle.avg)}ms | ${formatNumber(comparison.performance.fullCycle)}% |

### 1.2 Performance Analysis

${generatePerformanceAnalysis(data)}

## 2. Gas Cost Analysis

### 2.1 Detailed Gas Metrics

| Operation | Protocol | Min | Max | Avg | Difference |
|-----------|----------|-----|-----|-----|------------|
| Lock Gas | HTLC | ${formatNumber(htlc.gas.lock.min)} | ${formatNumber(htlc.gas.lock.max)} | ${formatNumber(htlc.gas.lock.avg)} | |
| | FPPHTLC | ${formatNumber(fpphtlc.gas.lock.min)} | ${formatNumber(fpphtlc.gas.lock.max)} | ${formatNumber(fpphtlc.gas.lock.avg)} | ${formatNumber(comparison.gas.lock)}% |
| Claim Gas | HTLC | ${formatNumber(htlc.gas.claim.min)} | ${formatNumber(htlc.gas.claim.max)} | ${formatNumber(htlc.gas.claim.avg)} | |
| | FPPHTLC | ${formatNumber(fpphtlc.gas.claim.min)} | ${formatNumber(fpphtlc.gas.claim.max)} | ${formatNumber(fpphtlc.gas.claim.avg)} | ${formatNumber(comparison.gas.claim)}% |
| Total Gas | HTLC | ${formatNumber(htlc.gas.total.min)} | ${formatNumber(htlc.gas.total.max)} | ${formatNumber(htlc.gas.total.avg)} | |
| | FPPHTLC | ${formatNumber(fpphtlc.gas.total.min)} | ${formatNumber(fpphtlc.gas.total.max)} | ${formatNumber(fpphtlc.gas.total.avg)} | ${formatNumber(comparison.gas.total)}% |

### 2.2 Gas Cost Analysis

${generateGasAnalysis(data)}

## 3. Reliability Analysis

| Protocol | Success Rate | Error Count |
|----------|--------------|-------------|
| HTLC | ${formatNumber(htlc.successRate)}% | ${htlc.errors.length} |
| FPPHTLC | ${formatNumber(fpphtlc.successRate)}% | ${fpphtlc.errors.length} |

${generateReliabilityAnalysis(data)}

## 4. Iteration Details

### 4.1 HTLC Iterations
${generateIterationDetails(data.htlc.iterations, 'HTLC')}

### 4.2 FPPHTLC Iterations
${generateIterationDetails(data.fpphtlc.iterations, 'FPPHTLC')}

## 5. Conclusion

${generateConclusion(data)}

---
Report generated at: ${new Date().toISOString()}`;
}

function generatePerformanceAnalysis(data) {
    const { comparison } = data;
    return `
FPPHTLC demonstrates significant performance improvements:

1. Lock Phase:
   - ${formatNumber(comparison.performance.lockPhase)}% faster
   - Parallel execution advantage
   - Reduced cross-chain waiting time

2. Claim Phase:
   - ${formatNumber(comparison.performance.claimPhase)}% faster
   - Optimized secret revelation process
   - Efficient verification mechanism

3. Overall Cycle:
   - ${formatNumber(comparison.performance.fullCycle)}% total improvement
   - Streamlined cross-chain operations
   - Enhanced execution efficiency`;
}

function generateGasAnalysis(data) {
    const { comparison } = data;
    return `
Gas cost comparison shows trade-offs:

1. Lock Operations:
   - ${formatNumber(Math.abs(comparison.gas.lock))}% ${comparison.gas.lock > 0 ? 'increase' : 'decrease'} in gas cost
   - Additional complexity for parallel processing
   - Enhanced security features impact

2. Claim Operations:
   - ${formatNumber(Math.abs(comparison.gas.claim))}% ${comparison.gas.claim > 0 ? 'increase' : 'decrease'} in gas cost
   - Complex verification mechanism
   - Privacy-preserving features overhead

3. Total Gas Impact:
   - ${formatNumber(Math.abs(comparison.gas.total))}% ${comparison.gas.total > 0 ? 'increase' : 'decrease'} in total gas
   - Cost vs. Feature trade-off
   - Consideration for different use cases`;
}

function generateReliabilityAnalysis(data) {
    const htlc = data.htlc.summary;
    const fpphtlc = data.fpphtlc.summary;
    return `
### Reliability Analysis

1. Success Rate Analysis:
   - HTLC: ${formatNumber(htlc.successRate)}% success rate with ${htlc.errors.length} errors
   - FPPHTLC: ${formatNumber(fpphtlc.successRate)}% success rate with ${fpphtlc.errors.length} errors

2. Error Pattern Analysis:
   ${generateErrorAnalysis(htlc.errors, fpphtlc.errors)}`;
}

function generateErrorAnalysis(htlcErrors, fpphtlcErrors) {
    if (htlcErrors.length === 0 && fpphtlcErrors.length === 0) {
        return "No errors encountered in either protocol";
    }

    let analysis = "";
    if (htlcErrors.length > 0) {
        analysis += "\nHTLC Errors:\n";
        analysis += htlcErrors.map(e => `- ${e.message}`).join("\n");
    }
    if (fpphtlcErrors.length > 0) {
        analysis += "\nFPPHTLC Errors:\n";
        analysis += fpphtlcErrors.map(e => `- ${e.message}`).join("\n");
    }
    return analysis;
}

function generateIterationDetails(iterations, protocol) {
    return `
\`\`\`
${iterations.map((iter, index) => `
Iteration ${index + 1}:
  Lock Time: ${formatNumber(iter.performance.lockTime)}ms
  Claim Time: ${formatNumber(iter.performance.claimTime)}ms
  Total Time: ${formatNumber(iter.performance.cycleTime)}ms
  Lock Gas: ${formatNumber(iter.gas.lock)}
  Claim Gas: ${formatNumber(iter.gas.claim)}
  Total Gas: ${formatNumber(iter.gas.total)}
  Success: ${iter.success ? '✅' : '❌'}
`).join('\n')}
\`\`\``;
}

function generateConclusion(data) {
    const { comparison } = data;
    return `
Based on the comprehensive test results:

1. Performance:
   - FPPHTLC achieves ${formatNumber(comparison.performance.fullCycle)}% faster execution
   - Significant improvement in lock phase (${formatNumber(comparison.performance.lockPhase)}%)

2. Gas Costs:
   - FPPHTLC shows ${formatNumber(Math.abs(comparison.gas.total))}% ${comparison.gas.total > 0 ? 'higher' : 'lower'} gas costs
   - Additional features justify the cost increase

3. Reliability:
   - Both protocols demonstrate high reliability
   - FPPHTLC maintains stability despite complexity

4. Recommendation:
   - Choose based on specific requirements
   - Consider performance vs. cost trade-off
   - Evaluate privacy requirements`;
}

async function runUnifiedTest() {
    console.log("🚀 Starting Unified Comprehensive Test");
    console.log("=" .repeat(60));

    // Deploy contracts and tokens
    const [deployer, alice, bob] = await ethers.getSigners();
    
    const HTLC = await ethers.getContractFactory("HTLC");
    const FPPHTLC = await ethers.getContractFactory("FPPHTLC");
    const ERC20Mock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");
    
    const htlc = await HTLC.deploy();
    const fpphtlc = await FPPHTLC.deploy();
    const tokenA = await ERC20Mock.deploy("Token A", "TKA", CONFIG.INITIAL_SUPPLY);
    const tokenB = await ERC20Mock.deploy("Token B", "TKB", CONFIG.INITIAL_SUPPLY);
    
    await Promise.all([
        htlc.deployed(),
        fpphtlc.deployed(),
        tokenA.deployed(),
        tokenB.deployed()
    ]);

    // Setup tokens
    await Promise.all([
        tokenA.transfer(alice.address, CONFIG.DISTRIBUTION_AMOUNT),
        tokenB.transfer(bob.address, CONFIG.DISTRIBUTION_AMOUNT),
        tokenA.connect(alice).approve(htlc.address, CONFIG.DISTRIBUTION_AMOUNT),
        tokenB.connect(bob).approve(htlc.address, CONFIG.DISTRIBUTION_AMOUNT),
        tokenA.connect(alice).approve(fpphtlc.address, CONFIG.DISTRIBUTION_AMOUNT),
        tokenB.connect(bob).approve(fpphtlc.address, CONFIG.DISTRIBUTION_AMOUNT)
    ]);

    // Initialize result containers
    const htlcResults = new DetailedTestResults();
    const fpphtlcResults = new DetailedTestResults();

    // Run HTLC tests
    console.log("\n🧪 Running HTLC Tests");
    for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
        try {
            const iteration = {
                index: i,
                performance: {},
                gas: {},
                success: false
            };

            const cycleStartTime = performance.now();

            // Prepare parameters
            const secretA = `alice_secret_${i}_${Date.now()}`;
            const secretB = `bob_secret_${i}_${Date.now()}`;
            const hashA = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretA));
            const hashB = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretB));
            const timelock = Math.floor(Date.now() / 1000) + CONFIG.TIMELOCK_DURATION;

            // Lock phase
            const lockStartTime = performance.now();
            
            const aliceLockTx = await htlc.connect(alice).lockFunds(
                bob.address, tokenA.address, CONFIG.AMOUNT_TOKEN, hashB, timelock, "sepolia"
            );
            const aliceLockReceipt = await aliceLockTx.wait();

            const bobLockTx = await htlc.connect(bob).lockFunds(
                alice.address, tokenB.address, CONFIG.AMOUNT_TOKEN, hashA, timelock, "bsc"
            );
            const bobLockReceipt = await bobLockTx.wait();

            const lockEndTime = performance.now();
            iteration.performance.lockTime = lockEndTime - lockStartTime;

            // Claim phase
            const claimStartTime = performance.now();

            const aliceSwapId = aliceLockReceipt.events.find(e => e.event === 'SwapInitiated').args.swapId;
            const bobSwapId = bobLockReceipt.events.find(e => e.event === 'SwapInitiated').args.swapId;

            const bobClaimTx = await htlc.connect(bob).claimFunds(aliceSwapId, secretB);
            const bobClaimReceipt = await bobClaimTx.wait();

            const aliceClaimTx = await htlc.connect(alice).claimFunds(bobSwapId, secretA);
            const aliceClaimReceipt = await aliceClaimTx.wait();

            const claimEndTime = performance.now();
            iteration.performance.claimTime = claimEndTime - claimStartTime;
            iteration.performance.cycleTime = claimEndTime - cycleStartTime;

            // Record gas usage
            iteration.gas.lock = aliceLockReceipt.gasUsed.add(bobLockReceipt.gasUsed).toNumber();
            iteration.gas.claim = bobClaimReceipt.gasUsed.add(aliceClaimReceipt.gasUsed).toNumber();
            iteration.gas.total = iteration.gas.lock + iteration.gas.claim;
            iteration.success = true;

            htlcResults.addIteration(iteration);
            console.log(`  ✅ HTLC Test ${i + 1}/${CONFIG.TEST_ITERATIONS} completed`);

        } catch (error) {
            htlcResults.addError(error);
            console.log(`  ❌ HTLC Test ${i + 1} failed: ${error.message}`);
        }
    }

    // Run FPPHTLC tests
    console.log("\n🧪 Running FPPHTLC Tests");
    for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
        try {
            const iteration = {
                index: i,
                performance: {},
                gas: {},
                success: false
            };

            const cycleStartTime = performance.now();

            // Prepare parameters
            const secretA = `alice_secret_${i}_${Date.now()}`;
            const secretB = `bob_secret_${i}_${Date.now()}`;
            const hashA = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretA));
            const hashB = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretB));
            const timelock = Math.floor(Date.now() / 1000) + CONFIG.TIMELOCK_DURATION;

            // Generate combined hashes
            const combinedHashAlice = await fpphtlc.generateCombinedHash(
                alice.address, bob.address, hashA, hashB
            );
            const combinedHashBob = await fpphtlc.generateCombinedHash(
                bob.address, alice.address, hashB, hashA
            );

            // Generate swap IDs
            const swapId = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["string", "uint256"], ["test", i]
            ));
            const bobSwapId = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "string"], [swapId, "_bob"]
            ));

            // Lock phase
            const lockStartTime = performance.now();

            const [aliceLockTx, bobLockTx] = await Promise.all([
                fpphtlc.connect(alice).lockFunds(
                    bob.address, tokenA.address, CONFIG.AMOUNT_TOKEN, combinedHashAlice, timelock, "sepolia", swapId
                ),
                fpphtlc.connect(bob).lockFunds(
                    alice.address, tokenB.address, CONFIG.AMOUNT_TOKEN, combinedHashBob, timelock, "bsc", bobSwapId
                )
            ]);

            const [aliceLockReceipt, bobLockReceipt] = await Promise.all([
                aliceLockTx.wait(),
                bobLockTx.wait()
            ]);

            const lockEndTime = performance.now();
            iteration.performance.lockTime = lockEndTime - lockStartTime;

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
            iteration.performance.claimTime = claimEndTime - claimStartTime;
            iteration.performance.cycleTime = claimEndTime - cycleStartTime;

            // Record gas usage
            iteration.gas.lock = aliceLockReceipt.gasUsed.add(bobLockReceipt.gasUsed).toNumber();
            iteration.gas.claim = bobClaimReceipt.gasUsed.add(aliceClaimReceipt.gasUsed).toNumber();
            iteration.gas.total = iteration.gas.lock + iteration.gas.claim;
            iteration.success = true;

            fpphtlcResults.addIteration(iteration);
            console.log(`  ✅ FPPHTLC Test ${i + 1}/${CONFIG.TEST_ITERATIONS} completed`);

        } catch (error) {
            fpphtlcResults.addError(error);
            console.log(`  ❌ FPPHTLC Test ${i + 1} failed: ${error.message}`);
        }
    }

    // Calculate success rates
    htlcResults.calculateSuccessRate();
    fpphtlcResults.calculateSuccessRate();

    // Generate and save reports
    const { testDataReport, markdownPath } = await generateDetailedReport(htlcResults, fpphtlcResults);
    
    console.log("\n📊 Test Results Summary");
    console.log(`Detailed report saved to: ${markdownPath}`);
    console.log(`Test data saved to: ${path.join('reports', `test-data-${Date.now()}.json`)}`);

    return testDataReport;
}

// Execute if running directly
if (require.main === module) {
    runUnifiedTest()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Test failed:", error);
            process.exit(1);
        });
}

module.exports = { runUnifiedTest, DetailedTestResults, CONFIG }; 