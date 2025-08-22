const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Giving Bob some TokenB...");
    
    // Get accounts
    const [alice, bob] = await ethers.getSigners();
    console.log(`Alice: ${alice.address}`);
    console.log(`Bob: ${bob.address}`);

    // Load addresses
    const addresses = require("../config/addresses.json");
    // const networkAddresses = addresses.sepolia;
    const networkAddresses = addresses.bscTestnet;


    // Get token contract
    const ERC20Mock = await ethers.getContractFactory("contracts/mocks/ERC20Mock.sol:ERC20Mock");
    const tokenB = ERC20Mock.attach(networkAddresses.TokenB);

    try {
        // Check initial balances
        const aliceBalance = await tokenB.balanceOf(alice.address, { gasLimit: 100000 });
        const bobBalance = await tokenB.balanceOf(bob.address, { gasLimit: 100000 });
        
        console.log(`Initial Alice TokenB: ${ethers.utils.formatEther(aliceBalance)}`);
        console.log(`Initial Bob TokenB: ${ethers.utils.formatEther(bobBalance)}`);

        // Transfer 500 tokens
        const transferAmount = ethers.utils.parseEther("500");
        console.log(`Transferring ${ethers.utils.formatEther(transferAmount)} TokenB from Alice to Bob...`);
        
        const tx = await tokenB.connect(alice).transfer(bob.address, transferAmount, { gasLimit: 100000 });
        await tx.wait();
        
        console.log("Transfer completed!");

        // Check final balances
        const finalAliceBalance = await tokenB.balanceOf(alice.address, { gasLimit: 100000 });
        const finalBobBalance = await tokenB.balanceOf(bob.address, { gasLimit: 100000 });
        
        console.log(`Final Alice TokenB: ${ethers.utils.formatEther(finalAliceBalance)}`);
        console.log(`Final Bob TokenB: ${ethers.utils.formatEther(finalBobBalance)}`);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

main(); 