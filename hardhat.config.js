require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

// Default values for testing
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/2aecf52b43c14068bf356ff538bfbe47";
const BSC_TESTNET_RPC_URL = process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const PRIVATE_KEY_ALICE = process.env.PRIVATE_KEY_ALICE || "";
const PRIVATE_KEY_BOB = process.env.PRIVATE_KEY_BOB || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: "10000000000000000000000"
      }
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY_ALICE, PRIVATE_KEY_BOB],
      chainId: 11155111,
      gasPrice: 3000000000,  // 3 Gwei
      maxPriorityFeePerGas: 3000000000,  // 3 Gwei
      maxFeePerGas: 3000000000  // 3 Gwei
    },
    bscTestnet: {
      url: BSC_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY_ALICE, PRIVATE_KEY_BOB],
      chainId: 97,
      gasPrice: 10000000000,  // 10 Gwei
      maxPriorityFeePerGas: 10000000000,  // 10 Gwei
      maxFeePerGas: 10000000000  // 10 Gwei
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 100000
  }
};
