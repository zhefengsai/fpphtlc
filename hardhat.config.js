require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

// Network Configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const BSC_TESTNET_RPC_URL = process.env.BSC_TESTNET_RPC_URL;

// Account Configuration
const PRIVATE_KEY_ALICE = process.env.PRIVATE_KEY_ALICE;
const PRIVATE_KEY_BOB = process.env.PRIVATE_KEY_BOB;

// API Keys
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;

// Gas Settings
const GAS_PRICE_SEPOLIA = process.env.GAS_PRICE_SEPOLIA || "3000000000";
const GAS_PRICE_BSC = process.env.GAS_PRICE_BSC || "10000000000";
const GAS_LIMIT = process.env.GAS_LIMIT || "500000";
const MAX_FEE_PER_GAS = process.env.MAX_FEE_PER_GAS || "10000000000";
const MAX_PRIORITY_FEE_PER_GAS = process.env.MAX_PRIORITY_FEE_PER_GAS || "1000000000";
const NETWORK_TIMEOUT = parseInt(process.env.NETWORK_TIMEOUT || "60000");

// Validate required environment variables
if (!SEPOLIA_RPC_URL) throw new Error("SEPOLIA_RPC_URL not set");
if (!BSC_TESTNET_RPC_URL) throw new Error("BSC_TESTNET_RPC_URL not set");
if (!PRIVATE_KEY_ALICE) throw new Error("PRIVATE_KEY_ALICE not set");
if (!PRIVATE_KEY_BOB) throw new Error("PRIVATE_KEY_BOB not set");
if (!ETHERSCAN_API_KEY) throw new Error("ETHERSCAN_API_KEY not set");
if (!BSCSCAN_API_KEY) throw new Error("BSCSCAN_API_KEY not set");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY_ALICE, PRIVATE_KEY_BOB],
      chainId: 11155111,
      gasPrice: parseInt(GAS_PRICE_SEPOLIA),
      gas: parseInt(GAS_LIMIT),
      timeout: NETWORK_TIMEOUT
    },
    bscTestnet: {
      url: BSC_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY_ALICE, PRIVATE_KEY_BOB],
      chainId: 97,
      gasPrice: parseInt(GAS_PRICE_BSC),
      gas: parseInt(GAS_LIMIT),
      timeout: NETWORK_TIMEOUT,
      type: 0,
      allowUnlimitedContractSize: true,
      blockGasLimit: 100000000,
      initialBaseFeePerGas: parseInt(MAX_PRIORITY_FEE_PER_GAS),
      maxFeePerGas: parseInt(MAX_FEE_PER_GAS),
      maxPriorityFeePerGas: parseInt(MAX_PRIORITY_FEE_PER_GAS),
      hardfork: "london",
      mining: {
        auto: true,
        interval: 1000
      }
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY
    }
  }
};
