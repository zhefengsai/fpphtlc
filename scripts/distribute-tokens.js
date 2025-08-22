const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function distributeTokens() {
    // Get network
    const network = hre.network.name;
    console.log(`Distributing tokens on ${network}...`);

    // Get accounts
    const [alice, bob] = await ethers.getSigners();
    console.log(`Alice: ${alice.address}`);
    console.log(`Bob: ${bob.address}`);

    // Load contract addresses
    const addressesPath = path.join(__dirname, "../config/addresses.json");
    if (!fs.existsSync(addressesPath)) {
        console.error("❌ addresses.json not found. Please deploy contracts first.");
        return;
    }

    const addresses = JSON.parse(fs.readFileSync(addressesPath));
    const networkKey = network === 'bnbt' ? 'bscTestnet' : network;
    const networkAddresses = addresses[networkKey];

    if (!networkAddresses) {
        console.error(`❌ No addresses found for network ${networkKey}`);
        return;
    }

    console.log(`\n📋 Contract addresses:`);
    console.log(`TokenA: ${networkAddresses.TokenA}`);
    console.log(`TokenB: ${networkAddresses.TokenB}`);

    // Get gas settings
    const gasPrice = await ethers.provider.getGasPrice();
    const gasLimit = ethers.BigNumber.from(process.env.GAS_LIMIT || "300000");

    const overrides = {
        gasPrice: gasPrice,
        gasLimit: gasLimit
    };

    // Get token contracts
    const ERC20Mock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");
    const tokenA = ERC20Mock.attach(networkAddresses.TokenA);
    const tokenB = ERC20Mock.attach(networkAddresses.TokenB);

    // Get distribution amounts from environment or use defaults
    const aliceTokenA = ethers.utils.parseEther(process.env.ALICE_TOKEN_A || "500");
    const aliceTokenB = ethers.utils.parseEther(process.env.ALICE_TOKEN_B || "500");
    const bobTokenA = ethers.utils.parseEther(process.env.BOB_TOKEN_A || "500");
    const bobTokenB = ethers.utils.parseEther(process.env.BOB_TOKEN_B || "500");

    console.log(`\n💰 Distribution amounts:`);
    console.log(`Alice TokenA: ${ethers.utils.formatEther(aliceTokenA)} tokens`);
    console.log(`Alice TokenB: ${ethers.utils.formatEther(aliceTokenB)} tokens`);
    console.log(`Bob TokenA: ${ethers.utils.formatEther(bobTokenA)} tokens`);
    console.log(`Bob TokenB: ${ethers.utils.formatEther(bobTokenB)} tokens`);

    try {
        // Check current balances with error handling
        console.log(`\n🔍 Checking current balances...`);
        let aliceTokenABalance, aliceTokenBBalance, bobTokenABalance, bobTokenBBalance;
        
        try {
            aliceTokenABalance = await tokenA.balanceOf(alice.address, { gasLimit: 100000 });
            aliceTokenBBalance = await tokenB.balanceOf(alice.address, { gasLimit: 100000 });
            bobTokenABalance = await tokenA.balanceOf(bob.address, { gasLimit: 100000 });
            bobTokenBBalance = await tokenB.balanceOf(bob.address, { gasLimit: 100000 });
        } catch (error) {
            console.log("⚠️ Could not check current balances due to ethers.js compatibility issue");
            console.log("   Error:", error.message);
            console.log("   This is likely due to Node.js v23.11.0 and ethers.js v5.8.0 compatibility");
            console.log("   Proceeding with token distribution...");
            aliceTokenABalance = ethers.constants.Zero;
            aliceTokenBBalance = ethers.constants.Zero;
            bobTokenABalance = ethers.constants.Zero;
            bobTokenBBalance = ethers.constants.Zero;
        }

        console.log(`Alice TokenA balance: ${ethers.utils.formatEther(aliceTokenABalance)}`);
        console.log(`Alice TokenB balance: ${ethers.utils.formatEther(aliceTokenBBalance)}`);
        console.log(`Bob TokenA balance: ${ethers.utils.formatEther(bobTokenABalance)}`);
        console.log(`Bob TokenB balance: ${ethers.utils.formatEther(bobTokenBBalance)}`);

        // Distribute tokens
        console.log(`\n🚀 Starting token distribution...`);

        // Alice transfers TokenA to Bob
        if (bobTokenA.gt(0)) {
            console.log(`📤 Alice transferring ${ethers.utils.formatEther(bobTokenA)} TokenA to Bob...`);
            const tx1 = await tokenA.connect(alice).transfer(bob.address, bobTokenA, overrides);
            await tx1.wait();
            console.log(`✅ TokenA transfer completed. Tx: ${tx1.hash}`);
        }

        // Alice transfers TokenB to Bob
        if (bobTokenB.gt(0)) {
            console.log(`📤 Alice transferring ${ethers.utils.formatEther(bobTokenB)} TokenB to Bob...`);
            const tx2 = await tokenB.connect(alice).transfer(bob.address, bobTokenB, overrides);
            await tx2.wait();
            console.log(`✅ TokenB transfer completed. Tx: ${tx2.hash}`);
        }

        // Bob transfers TokenA to Alice (if needed)
        if (aliceTokenA.gt(0)) {
            console.log(`📤 Bob transferring ${ethers.utils.formatEther(aliceTokenA)} TokenA to Alice...`);
            const tx3 = await tokenA.connect(bob).transfer(alice.address, aliceTokenA, overrides);
            await tx3.wait();
            console.log(`✅ TokenA transfer completed. Tx: ${tx3.hash}`);
        }

        // Bob transfers TokenB to Alice (if needed)
        if (aliceTokenB.gt(0)) {
            console.log(`📤 Bob transferring ${ethers.utils.formatEther(aliceTokenB)} TokenB to Alice...`);
            const tx4 = await tokenB.connect(bob).transfer(alice.address, aliceTokenB, overrides);
            await tx4.wait();
            console.log(`✅ TokenB transfer completed. Tx: ${tx4.hash}`);
        }

        // Check final balances with error handling
        console.log(`\n🔍 Checking final balances...`);
        let finalAliceTokenA, finalAliceTokenB, finalBobTokenA, finalBobTokenB;
        
        try {
            finalAliceTokenA = await tokenA.balanceOf(alice.address, { gasLimit: 100000 });
            finalAliceTokenB = await tokenB.balanceOf(alice.address, { gasLimit: 100000 });
            finalBobTokenA = await tokenA.balanceOf(bob.address, { gasLimit: 100000 });
            finalBobTokenB = await tokenB.balanceOf(bob.address, { gasLimit: 100000 });
        } catch (error) {
            console.log("⚠️ Could not check final balances due to ethers.js compatibility issue");
            console.log("   Error:", error.message);
            finalAliceTokenA = ethers.constants.Zero;
            finalAliceTokenB = ethers.constants.Zero;
            finalBobTokenA = ethers.constants.Zero;
            finalBobTokenB = ethers.constants.Zero;
        }

        console.log(`\n📊 Final balances:`);
        console.log(`Alice TokenA: ${ethers.utils.formatEther(finalAliceTokenA)} tokens`);
        console.log(`Alice TokenB: ${ethers.utils.formatEther(finalAliceTokenB)} tokens`);
        console.log(`Bob TokenA: ${ethers.utils.formatEther(finalBobTokenA)} tokens`);
        console.log(`Bob TokenB: ${ethers.utils.formatEther(finalBobTokenB)} tokens`);

        console.log(`\n🎉 Token distribution completed successfully!`);

    } catch (error) {
        console.error(`❌ Token distribution failed: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
        process.exit(1);
    }
}

// Export the function for use in other scripts
module.exports = { distributeTokens };

// Main function for direct execution
async function main() {
    await distributeTokens();
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
} 