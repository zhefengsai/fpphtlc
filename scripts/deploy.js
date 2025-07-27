const { ethers, run, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function verifyContract(address, args = []) {
    console.log(`Verifying contract at ${address}...`);
    try {
        await run("verify:verify", {
            address: address,
            constructorArguments: args,
        });
        console.log("Contract verified successfully");
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Contract is already verified");
        } else {
            console.error("Error verifying contract:", error);
        }
    }
}

async function main() {
    console.log("\nStarting deployment...");

    // Deploy HTLC
    const HTLC = await ethers.getContractFactory("HTLC");
    const htlc = await HTLC.deploy();
    await htlc.deployed();
    console.log("HTLC deployed to:", htlc.address);

    // Deploy FPPHTLC
    const FPPHTLC = await ethers.getContractFactory("FPPHTLC");
    const fpphtlc = await FPPHTLC.deploy();
    await fpphtlc.deployed();
    console.log("FPPHTLC deployed to:", fpphtlc.address);

    // Deploy Token A
    const ERC20Mock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");
    const tokenA = await ERC20Mock.deploy("Token A", "TKA", ethers.utils.parseEther("1000000"));
    await tokenA.deployed();
    console.log("Token A deployed to:", tokenA.address);

    // Deploy Token B
    const tokenB = await ERC20Mock.deploy("Token B", "TKB", ethers.utils.parseEther("1000000"));
    await tokenB.deployed();
    console.log("Token B deployed to:", tokenB.address);

    // Save addresses
    const addresses = {
        [network.name]: {
            HTLC: htlc.address,
            FPPHTLC: fpphtlc.address,
            TokenA: tokenA.address,
            TokenB: tokenB.address
        }
    };

    // Create config directory if it doesn't exist
    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    // Save addresses to config file
    const configPath = path.join(configDir, 'addresses.json');
    let existingAddresses = {};
    if (fs.existsSync(configPath)) {
        existingAddresses = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    const updatedAddresses = { ...existingAddresses, ...addresses };
    fs.writeFileSync(configPath, JSON.stringify(updatedAddresses, null, 4));

    console.log("\nDeployment Summary:");
    console.log("==================");
    console.log("HTLC:", htlc.address);
    console.log("FPPHTLC:", fpphtlc.address);
    console.log("Token A:", tokenA.address);
    console.log("Token B:", tokenB.address);

    // Verify contracts if on testnet
    if (network.name === "sepolia" || network.name === "bscTestnet") {
        console.log("\nVerifying contracts...");
        await verifyContract(htlc.address);
        await verifyContract(fpphtlc.address);
        await verifyContract(tokenA.address, ["Token A", "TKA", ethers.utils.parseEther("1000000")]);
        await verifyContract(tokenB.address, ["Token B", "TKB", ethers.utils.parseEther("1000000")]);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 