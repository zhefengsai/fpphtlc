const { ethers } = require("hardhat");
const ADDRESSES = require('../config/addresses.json');

async function main() {
    const [alice, bob] = await ethers.getSigners();
    
    // Get network
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === 'bnbt' ? 'bscTestnet' : network.name;
    
    console.log(`\nDistributing tokens on ${networkName}...`);
    console.log("=".repeat(50));

    const addresses = ADDRESSES[networkName];
    if (!addresses) {
        console.error(`No addresses found for network ${networkName}`);
        return;
    }

    // Get contracts
    const ERC20Mock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");
    const tokenA = ERC20Mock.attach(addresses.TokenA);
    const tokenB = ERC20Mock.attach(addresses.TokenB);

    const amount = ethers.utils.parseEther("100"); // Transfer 100 tokens

    try {
        // Transfer Token A from Alice to Bob
        console.log("\nTransferring Token A to Bob...");
        const txA = await tokenA.connect(alice).transfer(bob.address, amount);
        await txA.wait();
        console.log("✅ Token A transfer completed");

        // Transfer Token B from Alice to Bob
        console.log("\nTransferring Token B to Bob...");
        const txB = await tokenB.connect(alice).transfer(bob.address, amount);
        await txB.wait();
        console.log("✅ Token B transfer completed");

        // Approve HTLC
        console.log("\nApproving HTLC...");
        const approveAmount = ethers.utils.parseEther("10"); // Approve 10 tokens
        await tokenA.connect(alice).approve(addresses.HTLC, approveAmount);
        await tokenB.connect(bob).approve(addresses.HTLC, approveAmount);
        console.log("✅ HTLC approvals completed");

        // Approve FPPHTLC
        console.log("\nApproving FPPHTLC...");
        await tokenA.connect(alice).approve(addresses.FPPHTLC, approveAmount);
        await tokenB.connect(bob).approve(addresses.FPPHTLC, approveAmount);
        console.log("✅ FPPHTLC approvals completed");

        // Print final balances
        console.log("\nFinal balances:");
        console.log("Token A - Alice:", ethers.utils.formatEther(await tokenA.balanceOf(alice.address)));
        console.log("Token A - Bob:", ethers.utils.formatEther(await tokenA.balanceOf(bob.address)));
        console.log("Token B - Alice:", ethers.utils.formatEther(await tokenB.balanceOf(alice.address)));
        console.log("Token B - Bob:", ethers.utils.formatEther(await tokenB.balanceOf(bob.address)));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 