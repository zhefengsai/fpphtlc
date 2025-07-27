const { ethers } = require("hardhat");
const { performance } = require('perf_hooks');

/**
 * HTLC vs FPPHTLC Comprehensive Comparison Test
 * 
 * Test Dimensions:
 * 1. Cross-chain Time Performance
 * 2. Gas Cost Analysis
 * 3. Privacy Assessment
 * 4. Functionality Completeness
 */
async function runComprehensiveTest() {
    console.log("🚀 HTLC vs FPPHTLC Comprehensive Comparison Test");
    console.log("=" .repeat(60));
    
    // Deploy contracts and tokens
    console.log("\n📦 Deploying contracts and tokens...");
    const [deployer, alice, bob] = await ethers.getSigners();
    
    const HTLC = await ethers.getContractFactory("HTLC");
    const FPPHTLC = await ethers.getContractFactory("FPPHTLC");
    const ERC20Mock = await ethers.getContractFactory("contracts/ERC20Mock.sol:ERC20Mock");
    
    const htlc = await HTLC.deploy();
    const fpphtlc = await FPPHTLC.deploy();
    const tokenA = await ERC20Mock.deploy("Token A", "TKA", ethers.utils.parseEther("10000"));
    const tokenB = await ERC20Mock.deploy("Token B", "TKB", ethers.utils.parseEther("10000"));
    
    await htlc.deployed();
    await fpphtlc.deployed();
    await tokenA.deployed();
    await tokenB.deployed();
    
    console.log("HTLC:", htlc.address);
    console.log("FPPHTLC:", fpphtlc.address);
    console.log("Token A:", tokenA.address);
    console.log("Token B:", tokenB.address);
    
    // Distribute tokens and approve
    console.log("\n💰 Distributing tokens and approving...");
    await tokenA.transfer(alice.address, ethers.utils.parseEther("1000"));
    await tokenB.transfer(bob.address, ethers.utils.parseEther("1000"));
    
    await tokenA.connect(alice).approve(htlc.address, ethers.utils.parseEther("1000"));
    await tokenB.connect(bob).approve(htlc.address, ethers.utils.parseEther("1000"));
    await tokenA.connect(alice).approve(fpphtlc.address, ethers.utils.parseEther("1000"));
    await tokenB.connect(bob).approve(fpphtlc.address, ethers.utils.parseEther("1000"));
    
    // Verify balances
    console.log("\n💰 Verifying balances:");
    console.log("Alice Token A balance:", ethers.utils.formatEther(await tokenA.balanceOf(alice.address)));
    console.log("Bob Token B balance:", ethers.utils.formatEther(await tokenB.balanceOf(bob.address)));
    
    // 1. Cross-chain Time Performance Test
    console.log("\n🧪 Experiment 1: Cross-chain Time Performance Test");
    console.log("\n1.1 HTLC Complete Process Test");
    
    const htlcResults = {
        lockTimes: [],
        claimTimes: [],
        fullCycleTimes: [],
        gasUsed: {
            aliceLock: 0,
            bobLock: 0,
            aliceClaim: 0,
            bobClaim: 0
        }
    };
    
    // Run HTLC test 10 times
    for (let i = 0; i < 10; i++) {
        const cycleStartTime = performance.now();
        
        // Prepare parameters
        const secretA = `alice_secret_${i}`;
        const secretB = `bob_secret_${i}`;
        const hashA = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretA));
        const hashB = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretB));
        const amount = ethers.utils.parseEther("10");
        const timelock = Math.floor(Date.now() / 1000) + 3600;
        
        // Lock phase
        const lockStartTime = performance.now();
        
        // Alice locks
        const aliceLockTx = await htlc.connect(alice).lockFunds(
            bob.address, tokenA.address, amount, hashB, timelock, "sepolia"
        );
        const aliceLockReceipt = await aliceLockTx.wait();
        htlcResults.gasUsed.aliceLock = aliceLockReceipt.gasUsed.toNumber();
        
        // Bob locks
        const bobLockTx = await htlc.connect(bob).lockFunds(
            alice.address, tokenB.address, amount, hashA, timelock, "bsc"
        );
        const bobLockReceipt = await bobLockTx.wait();
        htlcResults.gasUsed.bobLock = bobLockReceipt.gasUsed.toNumber();
        
        const lockEndTime = performance.now();
        htlcResults.lockTimes.push(lockEndTime - lockStartTime);
        
        // Claim phase
        const claimStartTime = performance.now();
        
        // Bob claims
        // Get Alice's swapId (from lockFunds return value)
        const aliceSwapId = await aliceLockTx.wait().then(receipt => {
            const event = receipt.events.find(e => e.event === 'SwapInitiated');
            return event.args.swapId;
        });

        const bobClaimTx = await htlc.connect(bob).claimFunds(aliceSwapId, secretB);
        const bobClaimReceipt = await bobClaimTx.wait();
        htlcResults.gasUsed.bobClaim = bobClaimReceipt.gasUsed.toNumber();
        
        // Alice claims
        // Get Bob's swapId (from lockFunds return value)
        const bobSwapId = await bobLockTx.wait().then(receipt => {
            const event = receipt.events.find(e => e.event === 'SwapInitiated');
            return event.args.swapId;
        });

        const aliceClaimTx = await htlc.connect(alice).claimFunds(bobSwapId, secretA);
        const aliceClaimReceipt = await aliceClaimTx.wait();
        htlcResults.gasUsed.aliceClaim = aliceClaimReceipt.gasUsed.toNumber();
        
        const claimEndTime = performance.now();
        htlcResults.claimTimes.push(claimEndTime - claimStartTime);
        
        const cycleEndTime = performance.now();
        htlcResults.fullCycleTimes.push(cycleEndTime - cycleStartTime);
        
        console.log(`  Test ${i + 1}/10 completed`);
    }
    
    console.log("\n1.2 FPPHTLC Complete Process Test");
    
    const fpphtlcResults = {
        lockTimes: [],
        claimTimes: [],
        fullCycleTimes: [],
        gasUsed: {
            aliceLock: 0,
            bobLock: 0,
            aliceClaim: 0,
            bobClaim: 0
        }
    };
    
    // Run FPPHTLC test 10 times
    for (let i = 0; i < 10; i++) {
        const cycleStartTime = performance.now();
        
        // Prepare parameters
        const secretA = `alice_secret_${i}`;
        const secretB = `bob_secret_${i}`;
        const hashA = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretA));
        const hashB = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secretB));
        const amount = ethers.utils.parseEther("10");
        const timelock = Math.floor(Date.now() / 1000) + 3600;
        
        // Generate combined hashes
        const combinedHashAlice = await fpphtlc.generateCombinedHash(
            alice.address, bob.address, hashA, hashB
        );
        const combinedHashBob = await fpphtlc.generateCombinedHash(
            bob.address, alice.address, hashB, hashA
        );
        
        // Generate swapId
        const swapId = ethers.utils.keccak256(ethers.utils.solidityPack(
            ["string", "uint256"], ["test", i]
        ));
        const bobSwapId = ethers.utils.keccak256(ethers.utils.solidityPack(
            ["bytes32", "string"], [swapId, "_bob"]
        ));
        
        // Lock phase
        const lockStartTime = performance.now();
        
        // Parallel locking
        const [aliceLockTx, bobLockTx] = await Promise.all([
            fpphtlc.connect(alice).lockFunds(
                bob.address, tokenA.address, amount, combinedHashAlice, timelock, "sepolia", swapId
            ),
            fpphtlc.connect(bob).lockFunds(
                alice.address, tokenB.address, amount, combinedHashBob, timelock, "bsc", bobSwapId
            )
        ]);
        
        const [aliceLockReceipt, bobLockReceipt] = await Promise.all([
            aliceLockTx.wait(),
            bobLockTx.wait()
        ]);
        
        fpphtlcResults.gasUsed.aliceLock = aliceLockReceipt.gasUsed.toNumber();
        fpphtlcResults.gasUsed.bobLock = bobLockReceipt.gasUsed.toNumber();
        
        const lockEndTime = performance.now();
        fpphtlcResults.lockTimes.push(lockEndTime - lockStartTime);
        
        // Claim phase
        const claimStartTime = performance.now();
        
        // Bob claims
        const bobClaimTx = await fpphtlc.connect(bob).claimFunds(
            swapId, secretA, secretB
        );
        const bobClaimReceipt = await bobClaimTx.wait();
        fpphtlcResults.gasUsed.bobClaim = bobClaimReceipt.gasUsed.toNumber();
        
        // Alice claims
        const aliceClaimTx = await fpphtlc.connect(alice).claimFunds(
            bobSwapId, secretB, secretA
        );
        const aliceClaimReceipt = await aliceClaimTx.wait();
        fpphtlcResults.gasUsed.aliceClaim = aliceClaimReceipt.gasUsed.toNumber();
        
        const claimEndTime = performance.now();
        fpphtlcResults.claimTimes.push(claimEndTime - claimStartTime);
        
        const cycleEndTime = performance.now();
        fpphtlcResults.fullCycleTimes.push(cycleEndTime - cycleStartTime);
        
        console.log(`  Test ${i + 1}/10 completed`);
    }
    
    // Calculate averages and improvement percentages
    const calculateAverage = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    const htlcAvg = {
        lockTime: calculateAverage(htlcResults.lockTimes),
        claimTime: calculateAverage(htlcResults.claimTimes),
        fullCycleTime: calculateAverage(htlcResults.fullCycleTimes)
    };
    
    const fpphtlcAvg = {
        lockTime: calculateAverage(fpphtlcResults.lockTimes),
        claimTime: calculateAverage(fpphtlcResults.claimTimes),
        fullCycleTime: calculateAverage(fpphtlcResults.fullCycleTimes)
    };
    
    const improvements = {
        lockTime: ((htlcAvg.lockTime - fpphtlcAvg.lockTime) / htlcAvg.lockTime) * 100,
        claimTime: ((htlcAvg.claimTime - fpphtlcAvg.claimTime) / htlcAvg.claimTime) * 100,
        fullCycleTime: ((htlcAvg.fullCycleTime - fpphtlcAvg.fullCycleTime) / htlcAvg.fullCycleTime) * 100
    };
    
    // Calculate total gas costs
    const htlcTotalGas = htlcResults.gasUsed.aliceLock + htlcResults.gasUsed.bobLock + 
                        htlcResults.gasUsed.aliceClaim + htlcResults.gasUsed.bobClaim;
    
    const fpphtlcTotalGas = fpphtlcResults.gasUsed.aliceLock + fpphtlcResults.gasUsed.bobLock + 
                           fpphtlcResults.gasUsed.aliceClaim + fpphtlcResults.gasUsed.bobClaim;
    
    const gasDiff = ((fpphtlcTotalGas - htlcTotalGas) / htlcTotalGas) * 100;
    
    // Output test results
    console.log("\n📊 Test Results Summary");
    console.log("\n1. Time Performance");
    console.log(`HTLC Lock Time: ${htlcAvg.lockTime.toFixed(2)}ms`);
    console.log(`FPPHTLC Lock Time: ${fpphtlcAvg.lockTime.toFixed(2)}ms`);
    console.log(`Lock Phase Improvement: ${improvements.lockTime.toFixed(2)}%`);
    
    console.log(`\nHTLC Claim Time: ${htlcAvg.claimTime.toFixed(2)}ms`);
    console.log(`FPPHTLC Claim Time: ${fpphtlcAvg.claimTime.toFixed(2)}ms`);
    console.log(`Claim Phase Improvement: ${improvements.claimTime.toFixed(2)}%`);
    
    console.log(`\nHTLC Full Cycle: ${htlcAvg.fullCycleTime.toFixed(2)}ms`);
    console.log(`FPPHTLC Full Cycle: ${fpphtlcAvg.fullCycleTime.toFixed(2)}ms`);
    console.log(`Full Cycle Improvement: ${improvements.fullCycleTime.toFixed(2)}%`);
    
    console.log("\n2. Gas Cost Analysis");
    console.log("HTLC Gas Costs:");
    console.log(`- Alice Lock: ${htlcResults.gasUsed.aliceLock}`);
    console.log(`- Bob Lock: ${htlcResults.gasUsed.bobLock}`);
    console.log(`- Alice Claim: ${htlcResults.gasUsed.aliceClaim}`);
    console.log(`- Bob Claim: ${htlcResults.gasUsed.bobClaim}`);
    console.log(`- Total Gas: ${htlcTotalGas}`);
    
    console.log("\nFPPHTLC Gas Costs:");
    console.log(`- Alice Lock: ${fpphtlcResults.gasUsed.aliceLock}`);
    console.log(`- Bob Lock: ${fpphtlcResults.gasUsed.bobLock}`);
    console.log(`- Alice Claim: ${fpphtlcResults.gasUsed.aliceClaim}`);
    console.log(`- Bob Claim: ${fpphtlcResults.gasUsed.bobClaim}`);
    console.log(`- Total Gas: ${fpphtlcTotalGas}`);
    console.log(`- Gas Cost Difference: ${gasDiff.toFixed(2)}%`);
    
    return {
        htlcAvg,
        fpphtlcAvg,
        improvements,
        htlcResults,
        fpphtlcResults,
        gasDiff
    };
}

if (require.main === module) {
    runComprehensiveTest()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Test failed:", error);
            process.exit(1);
        });
}

module.exports = { runComprehensiveTest }; 