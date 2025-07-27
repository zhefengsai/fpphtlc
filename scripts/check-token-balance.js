const { ethers } = require("hardhat");
const ADDRESSES = require('../config/addresses.json');

async function main() {
    const [alice, bob] = await ethers.getSigners();
    
    // Get network
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === 'bnbt' ? 'bscTestnet' : network.name;
    
    console.log(`\nChecking balances on ${networkName}...`);
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

    // Check Token A balances
    console.log("\nToken A:", addresses.TokenA);
    console.log("Name:", await tokenA.name());
    console.log("Symbol:", await tokenA.symbol());
    console.log("Decimals:", await tokenA.decimals());
    console.log("Total Supply:", ethers.utils.formatEther(await tokenA.totalSupply()));
    console.log("Alice Balance:", ethers.utils.formatEther(await tokenA.balanceOf(alice.address)));
    console.log("Bob Balance:", ethers.utils.formatEther(await tokenA.balanceOf(bob.address)));
    console.log("HTLC Allowance (Alice):", ethers.utils.formatEther(await tokenA.allowance(alice.address, addresses.HTLC)));
    console.log("HTLC Allowance (Bob):", ethers.utils.formatEther(await tokenA.allowance(bob.address, addresses.HTLC)));
    console.log("FPPHTLC Allowance (Alice):", ethers.utils.formatEther(await tokenA.allowance(alice.address, addresses.FPPHTLC)));
    console.log("FPPHTLC Allowance (Bob):", ethers.utils.formatEther(await tokenA.allowance(bob.address, addresses.FPPHTLC)));

    // Check Token B balances
    console.log("\nToken B:", addresses.TokenB);
    console.log("Name:", await tokenB.name());
    console.log("Symbol:", await tokenB.symbol());
    console.log("Decimals:", await tokenB.decimals());
    console.log("Total Supply:", ethers.utils.formatEther(await tokenB.totalSupply()));
    console.log("Alice Balance:", ethers.utils.formatEther(await tokenB.balanceOf(alice.address)));
    console.log("Bob Balance:", ethers.utils.formatEther(await tokenB.balanceOf(bob.address)));
    console.log("HTLC Allowance (Alice):", ethers.utils.formatEther(await tokenB.allowance(alice.address, addresses.HTLC)));
    console.log("HTLC Allowance (Bob):", ethers.utils.formatEther(await tokenB.allowance(bob.address, addresses.HTLC)));
    console.log("FPPHTLC Allowance (Alice):", ethers.utils.formatEther(await tokenB.allowance(alice.address, addresses.FPPHTLC)));
    console.log("FPPHTLC Allowance (Bob):", ethers.utils.formatEther(await tokenB.allowance(bob.address, addresses.FPPHTLC)));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 