const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    // Get network
    const network = hre.network.name;
    console.log(`Deploying contracts to ${network}...`);

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    // Get gas settings from environment or use defaults
    const gasPrice = await ethers.provider.getGasPrice();
    const gasLimit = ethers.BigNumber.from(process.env.GAS_LIMIT || "3000000");

    const overrides = {
        gasPrice: gasPrice,
        gasLimit: gasLimit
    };

    // Deploy HTLC
    console.log("\nDeploying HTLC...");
    const HTLC = await ethers.getContractFactory("HTLC");
    const htlc = await HTLC.deploy(overrides);
    await htlc.deployed();
    console.log("HTLC deployed to:", htlc.address);

    // Deploy FPPHTLC
    console.log("\nDeploying FPPHTLC...");
    const FPPHTLC = await ethers.getContractFactory("FPPHTLC");
    const fpphtlc = await FPPHTLC.deploy(overrides);
    await fpphtlc.deployed();
    console.log("FPPHTLC deployed to:", fpphtlc.address);

    // Deploy TokenA
    console.log("\nDeploying TokenA...");
    const initialSupply = ethers.utils.parseEther(process.env.INITIAL_SUPPLY || "1000");
    const ERC20Mock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");
    const tokenA = await ERC20Mock.deploy("TokenA", "TKA", initialSupply, overrides);
    await tokenA.deployed();
    console.log("TokenA deployed to:", tokenA.address);

    // Deploy TokenB
    console.log("\nDeploying TokenB...");
    const tokenB = await ERC20Mock.deploy("TokenB", "TKB", initialSupply, overrides);
    await tokenB.deployed();
    console.log("TokenB deployed to:", tokenB.address);

    // Update addresses.json
    const addressesPath = path.join(__dirname, "../config/addresses.json");
    let addresses = {};
    if (fs.existsSync(addressesPath)) {
        addresses = JSON.parse(fs.readFileSync(addressesPath));
    }

    addresses[network === 'bnbt' ? 'bscTestnet' : network] = {
        HTLC: htlc.address,
        FPPHTLC: fpphtlc.address,
        TokenA: tokenA.address,
        TokenB: tokenB.address
    };

    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 4));
    console.log("\nAddresses updated in config/addresses.json");

    // Verify contracts if on a network that supports verification
    if (network === 'sepolia' || network === 'bscTestnet') {
        console.log("\nWaiting for block confirmations before verification...");
        await htlc.deployTransaction.wait(5);
        await fpphtlc.deployTransaction.wait(5);
        await tokenA.deployTransaction.wait(5);
        await tokenB.deployTransaction.wait(5);

        console.log("\nVerifying contracts...");
        try {
            await hre.run("verify:verify", {
                address: htlc.address,
                constructorArguments: []
            });
            console.log("HTLC verified");
        } catch (error) {
            console.log("Error verifying HTLC:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: fpphtlc.address,
                constructorArguments: []
            });
            console.log("FPPHTLC verified");
        } catch (error) {
            console.log("Error verifying FPPHTLC:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: tokenA.address,
                constructorArguments: ["TokenA", "TKA", initialSupply]
            });
            console.log("TokenA verified");
        } catch (error) {
            console.log("Error verifying TokenA:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: tokenB.address,
                constructorArguments: ["TokenB", "TKB", initialSupply]
            });
            console.log("TokenB verified");
        } catch (error) {
            console.log("Error verifying TokenB:", error.message);
        }
    }

    console.log("\nDeployment complete!");
    
    // Automatically distribute tokens after deployment
    console.log("\n💰 Automatically distributing tokens...");
    try {
        // Import and run token distribution
        const { distributeTokens } = require("./distribute-tokens");
        await distributeTokens();
        console.log("✅ Token distribution completed automatically!");
    } catch (error) {
        console.log("⚠️ Automatic token distribution failed, but deployment was successful.");
        console.log("   You can run token distribution manually with: npx hardhat run scripts/distribute-tokens.js --network <network>");
        console.log("   Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 