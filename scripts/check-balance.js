const { ethers } = require("hardhat");

async function main() {
    const [alice, bob] = await ethers.getSigners();
    
    console.log("\nAccount Balances:");
    console.log("=================");
    
    // Get network
    const network = await ethers.provider.getNetwork();
    console.log(`\nNetwork: ${network.name} (chainId: ${network.chainId})`);
    
    // Check Alice's balance
    const aliceBalance = await ethers.provider.getBalance(alice.address);
    console.log("\nAlice's Account:");
    console.log("Address:", alice.address);
    console.log("Balance:", ethers.utils.formatEther(aliceBalance), "ETH");
    
    // Check Bob's balance
    const bobBalance = await ethers.provider.getBalance(bob.address);
    console.log("\nBob's Account:");
    console.log("Address:", bob.address);
    console.log("Balance:", ethers.utils.formatEther(bobBalance), "ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 