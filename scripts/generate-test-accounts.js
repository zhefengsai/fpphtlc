const { ethers } = require("ethers");

async function main() {
    console.log("Generating test accounts for cross-network testing...\n");

    // Generate Alice's account
    const alice = ethers.Wallet.createRandom();
    console.log("Alice's Account:");
    console.log("Private Key:", alice.privateKey);
    console.log("Address:", alice.address);
    console.log("Private Key (without 0x):", alice.privateKey.slice(2));
    console.log();

    // Generate Bob's account
    const bob = ethers.Wallet.createRandom();
    console.log("Bob's Account:");
    console.log("Private Key:", bob.privateKey);
    console.log("Address:", bob.address);
    console.log("Private Key (without 0x):", bob.privateKey.slice(2));
    console.log();

    console.log("Instructions:");
    console.log("1. Save these private keys and addresses");
    console.log("2. Get Sepolia ETH from: https://sepoliafaucet.com/");
    console.log("3. Get BSC Testnet BNB from: https://testnet.bnbchain.org/faucet-smart");
    console.log("4. Set up your .env file with these values");
    console.log("\nExample .env file:");
    console.log(`SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
PRIVATE_KEY_ALICE=${alice.privateKey.slice(2)}
PRIVATE_KEY_BOB=${bob.privateKey.slice(2)}
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 