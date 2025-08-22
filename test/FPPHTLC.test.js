const { expect } = require("chai");
const { ethers } = require("hardhat");

// Load deployed contract addresses
const ADDRESSES = require('../config/addresses.json');

describe("FPPHTLC Cross-Chain Tests", function () {
    // Network Configuration
    const DEFAULT_PRIVATE_KEY_ALICE = "You need to fill in your own private key";
    const DEFAULT_PRIVATE_KEY_BOB = "You need to fill in your own private key";
    const DEFAULT_SEPOLIA_RPC_URL = "You need to fill in your own RPC URL";
    const DEFAULT_BSC_TESTNET_RPC_URL = "You need to fill in your own RPC URL";

    // Test participants
    let sepoliaAlice;
    let sepoliaBob;
    let bscAlice;
    let bscBob;

    // Contracts
    let sepoliaFPPHTLC;
    let bscFPPHTLC;
    let sepoliaTokenA;
    let bscTokenB;

    // Test configuration
    const CONFIG = {
        INITIAL_SUPPLY: ethers.utils.parseEther("1000000"),
        TRANSFER_AMOUNT: ethers.utils.parseEther("100"),
        SWAP_AMOUNT: ethers.utils.parseEther("0.001"), // Small amount for testing
        TIMELOCK_DURATION: 3600
    };

    let timelock;

    before(async function () {
        // Set timeout for tests
        this.timeout(60000); // 60 seconds

        // Get providers
        const sepoliaProvider = new ethers.providers.JsonRpcProvider(DEFAULT_SEPOLIA_RPC_URL);
        const bscProvider = new ethers.providers.JsonRpcProvider(DEFAULT_BSC_TESTNET_RPC_URL);

        // Create wallets
        sepoliaAlice = new ethers.Wallet(DEFAULT_PRIVATE_KEY_ALICE, sepoliaProvider);
        sepoliaBob = new ethers.Wallet(DEFAULT_PRIVATE_KEY_BOB, sepoliaProvider);
        bscAlice = new ethers.Wallet(DEFAULT_PRIVATE_KEY_ALICE, bscProvider);
        bscBob = new ethers.Wallet(DEFAULT_PRIVATE_KEY_BOB, bscProvider);

        // Get contract factories
        const FPPHTLC = await ethers.getContractFactory("FPPHTLC");
        const TokenMock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");

        // Attach to deployed contracts
        sepoliaFPPHTLC = FPPHTLC.attach(ADDRESSES.sepolia.FPPHTLC);
        bscFPPHTLC = FPPHTLC.attach(ADDRESSES.bscTestnet.FPPHTLC);
        sepoliaTokenA = TokenMock.attach(ADDRESSES.sepolia.TokenA);
        bscTokenB = TokenMock.attach(ADDRESSES.bscTestnet.TokenB);

        // Set timelock
        timelock = Math.floor(Date.now() / 1000) + CONFIG.TIMELOCK_DURATION;

        console.log("\nTest Configuration:");
        console.log("===================");
        console.log("Networks:");
        console.log("- Sepolia RPC:", DEFAULT_SEPOLIA_RPC_URL);
        console.log("- BSC Testnet RPC:", DEFAULT_BSC_TESTNET_RPC_URL);
        console.log("\nContracts:");
        console.log("- Sepolia FPPHTLC:", ADDRESSES.sepolia.FPPHTLC);
        console.log("- BSC FPPHTLC:", ADDRESSES.bscTestnet.FPPHTLC);
        console.log("- Sepolia Token A:", ADDRESSES.sepolia.TokenA);
        console.log("- BSC Token B:", ADDRESSES.bscTestnet.TokenB);
        console.log("\nAccounts:");
        console.log("- Alice Sepolia:", sepoliaAlice.address);
        console.log("- Bob Sepolia:", sepoliaBob.address);
        console.log("- Alice BSC:", bscAlice.address);
        console.log("- Bob BSC:", bscBob.address);
    });

    describe("Cross-Chain Atomic Swap", function () {
        let secretA;
        let secretB;
        let hashA;
        let hashB;
        let combinedHashAlice;
        let combinedHashBob;
        let swapId;
        let bobSwapId;

        beforeEach(async function () {
            // Generate secrets and hashes
            secretA = ethers.utils.formatBytes32String("alice_secret_" + Date.now());
            secretB = ethers.utils.formatBytes32String("bob_secret_" + Date.now());
            hashA = ethers.utils.keccak256(ethers.utils.arrayify(secretA));
            hashB = ethers.utils.keccak256(ethers.utils.arrayify(secretB));

            console.log("\nDebug Info:");
            console.log("secretA:", secretA);
            console.log("secretB:", secretB);
            console.log("hashA:", hashA);
            console.log("hashB:", hashB);

            // Generate combined hashes for both networks
            console.log("\nGenerating combined hashes...");
            try {
                // Call Sepolia contract with sepoliaAlice's signer
                combinedHashAlice = await sepoliaFPPHTLC.connect(sepoliaAlice).generateCombinedHash(
                    hashA,
                    hashB
                );
                console.log("combinedHashAlice:", combinedHashAlice);

                // Call BSC contract with bscBob's signer
                combinedHashBob = await bscFPPHTLC.connect(bscBob).generateCombinedHash(
                    hashB,
                    hashA
                );
                console.log("combinedHashBob:", combinedHashBob);
            } catch (error) {
                console.error("Error calling generateCombinedHash:", error);
                console.error("hashA type:", typeof hashA);
                console.error("hashB type:", typeof hashB);
                throw error;
            }

            // Generate swap IDs
            swapId = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ["string", "uint256", "string"],
                    ["cross_chain_swap", Date.now(), "sepolia"]
                )
            );

            bobSwapId = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ["string", "uint256", "string"],
                    ["cross_chain_swap", Date.now(), "bsc"]
                )
            );
        });

        it("should successfully complete cross-chain atomic swap", async function () {
            console.log("\nStarting Cross-Chain Atomic Swap Test");
            console.log("=======================================");

            // Record initial balances
            const aliceInitialBalanceA = await sepoliaTokenA.balanceOf(sepoliaAlice.address);
            const aliceInitialBalanceB = await bscTokenB.balanceOf(bscAlice.address);
            const bobInitialBalanceA = await sepoliaTokenA.balanceOf(sepoliaBob.address);
            const bobInitialBalanceB = await bscTokenB.balanceOf(bscBob.address);

            console.log("\nInitial Balances:");
            console.log("Alice Sepolia Token A:", ethers.utils.formatEther(aliceInitialBalanceA));
            console.log("Alice BSC Token B:", ethers.utils.formatEther(aliceInitialBalanceB));
            console.log("Bob Sepolia Token A:", ethers.utils.formatEther(bobInitialBalanceA));
            console.log("Bob BSC Token B:", ethers.utils.formatEther(bobInitialBalanceB));

            // Step 1: Lock funds on both networks
            console.log("\nStep 1: Locking Funds");
            console.log("----------------------");

            console.log("Alice locking TokenA on Sepolia...");
            await expect(
                sepoliaFPPHTLC.connect(sepoliaAlice).lockFunds(
                    sepoliaBob.address,
                    sepoliaTokenA.address,
                    CONFIG.SWAP_AMOUNT,
                    combinedHashAlice,
                    timelock,
                    "sepolia",
                    swapId
                )
            ).to.emit(sepoliaFPPHTLC, "SwapInitiated")
                .withArgs(
                    swapId,
                    sepoliaAlice.address,
                    sepoliaBob.address,
                    sepoliaTokenA.address,
                    CONFIG.SWAP_AMOUNT,
                    combinedHashAlice,
                    timelock,
                    "sepolia"
                );

            console.log("Bob locking TokenB on BSC...");
            await expect(
                bscFPPHTLC.connect(bscBob).lockFunds(
                    bscAlice.address,
                    bscTokenB.address,
                    CONFIG.SWAP_AMOUNT,
                    combinedHashBob,
                    timelock,
                    "bsc",
                    bobSwapId
                )
            ).to.emit(bscFPPHTLC, "SwapInitiated")
                .withArgs(
                    bobSwapId,
                    bscBob.address,
                    bscAlice.address,
                    bscTokenB.address,
                    CONFIG.SWAP_AMOUNT,
                    combinedHashBob,
                    timelock,
                    "bsc"
                );

            // Step 2: Verify locks
            console.log("\nStep 2: Verifying Locks");
            console.log("------------------------");

            const sepoliaSwap = await sepoliaFPPHTLC.getSwap(swapId);
            const bscSwap = await bscFPPHTLC.getSwap(bobSwapId);

            expect(sepoliaSwap.isActive).to.be.true;
            expect(bscSwap.isActive).to.be.true;
            console.log("✓ Both swaps are active");

            // Step 3: Claim funds
            console.log("\nStep 3: Claiming Funds");
            console.log("----------------------");

            console.log("Bob claiming TokenA on Sepolia...");
            await expect(
                sepoliaFPPHTLC.connect(sepoliaBob).claimFunds(swapId, secretA, secretB)
            ).to.emit(sepoliaFPPHTLC, "SwapClaimed")
                .withArgs(swapId, sepoliaBob.address);

            console.log("Alice claiming TokenB on BSC...");
            await expect(
                bscFPPHTLC.connect(bscAlice).claimFunds(bobSwapId, secretB, secretA)
            ).to.emit(bscFPPHTLC, "SwapClaimed")
                .withArgs(bobSwapId, bscAlice.address);

            // Step 4: Verify final balances
            console.log("\nStep 4: Verifying Final Balances");
            console.log("--------------------------------");

            const aliceFinalBalanceA = await sepoliaTokenA.balanceOf(sepoliaAlice.address);
            const aliceFinalBalanceB = await bscTokenB.balanceOf(bscAlice.address);
            const bobFinalBalanceA = await sepoliaTokenA.balanceOf(sepoliaBob.address);
            const bobFinalBalanceB = await bscTokenB.balanceOf(bscBob.address);

            console.log("\nFinal Balances:");
            console.log("Alice Sepolia Token A:", ethers.utils.formatEther(aliceFinalBalanceA));
            console.log("Alice BSC Token B:", ethers.utils.formatEther(aliceFinalBalanceB));
            console.log("Bob Sepolia Token A:", ethers.utils.formatEther(bobFinalBalanceA));
            console.log("Bob BSC Token B:", ethers.utils.formatEther(bobFinalBalanceB));

            // Verify balance changes
            expect(aliceFinalBalanceA).to.equal(aliceInitialBalanceA.sub(CONFIG.SWAP_AMOUNT));
            expect(aliceFinalBalanceB).to.equal(aliceInitialBalanceB.add(CONFIG.SWAP_AMOUNT));
            expect(bobFinalBalanceA).to.equal(bobInitialBalanceA.add(CONFIG.SWAP_AMOUNT));
            expect(bobFinalBalanceB).to.equal(bobInitialBalanceB.sub(CONFIG.SWAP_AMOUNT));

            console.log("\n✓ Cross-chain atomic swap completed successfully");
        });
    });
}); 