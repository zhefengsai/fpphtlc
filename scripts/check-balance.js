const { ethers } = require("hardhat");
const addresses = require("../config/addresses.json");
require("dotenv").config();

// Add 0x prefix to private keys if needed
const addHexPrefix = (key) => {
    if (!key) return null;
    return key.startsWith('0x') ? key : `0x${key}`;
};

async function checkBalancesOnNetwork(networkName, rpcUrl, contractAddresses) {
    console.log(`\n💰 Checking balances on ${networkName}...`);
    
    // Create provider for the specific network
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create wallet instances for Alice and Bob on this network
    const alicePrivateKey = addHexPrefix(process.env.PRIVATE_KEY_ALICE);
    const bobPrivateKey = addHexPrefix(process.env.PRIVATE_KEY_BOB);
    
    const alice = new ethers.Wallet(alicePrivateKey, provider);
    const bob = new ethers.Wallet(bobPrivateKey, provider);

    console.log(`Alice address: ${alice.address}`);
    console.log(`Bob address: ${bob.address}`);

    // Check ETH balances
    const aliceEthBalance = await alice.getBalance();
    const bobEthBalance = await bob.getBalance();
    
    console.log(`\n📊 ETH Balances on ${networkName}:`);
    console.log(`  Alice ETH: ${ethers.utils.formatEther(aliceEthBalance)} ETH`);
    console.log(`  Bob ETH: ${ethers.utils.formatEther(bobEthBalance)} ETH`);

    // Get token contracts using standard ERC20 ABI
    const standardERC20ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ];
    
    const tokenA = new ethers.Contract(contractAddresses.TokenA, standardERC20ABI, provider);
    const tokenB = new ethers.Contract(contractAddresses.TokenB, standardERC20ABI, provider);

    console.log(`\n🔍 Token Contract Addresses on ${networkName}:`);
    console.log(`  TokenA: ${contractAddresses.TokenA}`);
    console.log(`  TokenB: ${contractAddresses.TokenB}`);

    // Check token balances with error handling
    console.log(`\n📊 Token Balances on ${networkName}:`);
    
    try {
        // Check TokenA balances
        const aliceTokenABalance = await tokenA.balanceOf(alice.address);
        const bobTokenABalance = await tokenA.balanceOf(bob.address);
        
        console.log(`  Alice TokenA: ${ethers.utils.formatEther(aliceTokenABalance)} tokens`);
        console.log(`  Bob TokenA: ${ethers.utils.formatEther(bobTokenABalance)} tokens`);
    } catch (error) {
        console.log(`  ❌ Error checking TokenA balances: ${error.message}`);
        console.log(`     This might be due to:`);
        console.log(`     - Contract not deployed at ${contractAddresses.TokenA}`);
        console.log(`     - ABI mismatch`);
        console.log(`     - Network connectivity issues`);
    }
    
    try {
        // Check TokenB balances
        const aliceTokenBBalance = await tokenB.balanceOf(alice.address);
        const bobTokenBBalance = await tokenB.balanceOf(bob.address);
        
        console.log(`  Alice TokenB: ${ethers.utils.formatEther(aliceTokenBBalance)} tokens`);
        console.log(`  Bob TokenB: ${ethers.utils.formatEther(bobTokenBBalance)} tokens`);
    } catch (error) {
        console.log(`  ❌ Error checking TokenB balances: ${error.message}`);
        console.log(`     This might be due to:`);
        console.log(`     - Contract not deployed at ${contractAddresses.TokenB}`);
        console.log(`     - ABI mismatch`);
        console.log(`     - Network connectivity issues`);
    }

    // Check contract deployment status
    console.log(`\n🔍 Contract Deployment Status on ${networkName}:`);
    
    try {
        const tokenACode = await provider.getCode(contractAddresses.TokenA);
        if (tokenACode === "0x") {
            console.log(`  ❌ TokenA contract NOT DEPLOYED at ${contractAddresses.TokenA}`);
        } else {
            console.log(`  ✅ TokenA contract DEPLOYED at ${contractAddresses.TokenA}`);
        }
    } catch (error) {
        console.log(`  ❌ Error checking TokenA deployment: ${error.message}`);
    }
    
    try {
        const tokenBCode = await provider.getCode(contractAddresses.TokenB);
        if (tokenBCode === "0x") {
            console.log(`  ❌ TokenB contract NOT DEPLOYED at ${contractAddresses.TokenB}`);
        } else {
            console.log(`  ✅ TokenB contract DEPLOYED at ${contractAddresses.TokenB}`);
        }
    } catch (error) {
        console.log(`  ❌ Error checking TokenB deployment: ${error.message}`);
    }
}

async function main() {
    console.log("💰 Starting comprehensive balance check...");
    
    // Validate required environment variables
    if (!process.env.PRIVATE_KEY_ALICE) throw new Error("PRIVATE_KEY_ALICE not set");
    if (!process.env.PRIVATE_KEY_BOB) throw new Error("PRIVATE_KEY_BOB not set");
    if (!process.env.SEPOLIA_RPC_URL) throw new Error("SEPOLIA_RPC_URL not set");
    if (!process.env.BSC_TESTNET_RPC_URL) throw new Error("BSC_TESTNET_RPC_URL not set");

    // Sepolia network configuration
    const sepoliaAddresses = {
        TokenA: process.env.SEPOLIA_TOKEN_A || addresses.sepolia.TokenA,
        TokenB: process.env.SEPOLIA_TOKEN_B || addresses.sepolia.TokenB,
        HTLC: process.env.SEPOLIA_HTLC || addresses.sepolia.HTLC,
        FPPHTLC: process.env.SEPOLIA_FPPHTLC || addresses.sepolia.FPPHTLC
    };

    // BSC Testnet network configuration
    const bscAddresses = {
        TokenA: process.env.BSC_TESTNET_TOKEN_A || addresses.bscTestnet.TokenA,
        TokenB: process.env.BSC_TESTNET_TOKEN_B || addresses.bscTestnet.TokenB,
        HTLC: process.env.BSC_TESTNET_HTLC || addresses.bscTestnet.HTLC,
        FPPHTLC: process.env.BSC_TESTNET_FPPHTLC || addresses.bscTestnet.FPPHTLC
    };

    try {
        // Check balances on Sepolia
        await checkBalancesOnNetwork("Sepolia", process.env.SEPOLIA_RPC_URL, sepoliaAddresses);
        
        // Check balances on BSC Testnet
        await checkBalancesOnNetwork("BSC Testnet", process.env.BSC_TESTNET_RPC_URL, bscAddresses);
        
        console.log("\n📋 Summary:");
        console.log("✅ ETH balances checked successfully");
        console.log("⚠️ Token balances may have errors due to contract deployment or ABI issues");
        console.log("💡 If token balances fail, check:");
        console.log("   1. Contract deployment status");
        console.log("   2. Contract addresses in config/addresses.json");
        console.log("   3. Network connectivity");
        console.log("   4. ABI compatibility");
        
    } catch (error) {
        console.error("\n❌ Balance check failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 