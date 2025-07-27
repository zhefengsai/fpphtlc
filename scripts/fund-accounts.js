const { ethers } = require("hardhat");

// Default values for testing (same as in hardhat.config.js)
const DEFAULT_PRIVATE_KEY_ALICE = "";
const DEFAULT_PRIVATE_KEY_BOB = "";

async function main() {
    // Get network
    const network = hre.network.name;
    console.log(`Funding accounts on ${network}...`);

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    // Create wallet instances for Alice and Bob
    const alice = new ethers.Wallet(DEFAULT_PRIVATE_KEY_ALICE, ethers.provider);
    const bob = new ethers.Wallet(DEFAULT_PRIVATE_KEY_BOB, ethers.provider);

    console.log(`Alice address: ${alice.address}`);
    console.log(`Bob address: ${bob.address}`);

    // Fund accounts
    const fundAmount = ethers.utils.parseEther("0.1"); // 0.1 BNB or ETH

    console.log(`\nSending ${ethers.utils.formatEther(fundAmount)} ${network === "bscTestnet" ? "BNB" : "ETH"} to each account...`);

    // Send funds to Alice
    const txAlice = await deployer.sendTransaction({
        to: alice.address,
        value: fundAmount
    });
    await txAlice.wait();
    console.log(`Funded Alice: ${txAlice.hash}`);

    // Send funds to Bob
    const txBob = await deployer.sendTransaction({
        to: bob.address,
        value: fundAmount
    });
    await txBob.wait();
    console.log(`Funded Bob: ${txBob.hash}`);

    console.log("\nFunding complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 