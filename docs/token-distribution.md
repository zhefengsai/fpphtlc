# Token Distribution Guide

## Overview

After deploying contracts, tokens are automatically distributed to Alice and Bob accounts to ensure both parties have sufficient tokens for testing HTLC operations.

## Automatic Distribution

When you run the deployment script, token distribution happens automatically:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

This will:
1. Deploy all contracts (HTLC, FPPHTLC, TokenA, TokenB)
2. Automatically distribute tokens to Alice and Bob
3. Set up token approvals for HTLC contracts

## Manual Distribution

If you need to redistribute tokens manually:

```bash
npx hardhat run scripts/distribute-tokens.js --network sepolia
```

## Configuration

### Environment Variables

You can configure token distribution amounts using environment variables:

```bash
# Token distribution amounts (default: 500 tokens each)
ALICE_TOKEN_A=500    # Alice's TokenA amount
ALICE_TOKEN_B=500    # Alice's TokenB amount
BOB_TOKEN_A=500      # Bob's TokenA amount
BOB_TOKEN_B=500      # Bob's TokenB amount

# Initial supply for token deployment (default: 1000 tokens)
INITIAL_SUPPLY=1000
```

### Default Distribution

By default, the distribution is:
- **Alice**: 500 TokenA + 500 TokenB
- **Bob**: 500 TokenA + 500 TokenB

This ensures both parties have sufficient tokens for HTLC testing.

## Distribution Process

1. **Check Current Balances**: Script checks existing token balances
2. **Transfer TokenA**: Alice transfers TokenA to Bob
3. **Transfer TokenB**: Alice transfers TokenB to Bob
4. **Cross-Transfer**: Bob transfers tokens back to Alice (if needed)
5. **Verify Final Balances**: Confirm all transfers completed successfully

## Error Handling

The script includes comprehensive error handling:
- Checks if contracts are deployed
- Validates token addresses
- Handles network-specific issues
- Provides clear error messages

## Network Support

Token distribution works on:
- **Sepolia Testnet**
- **BSC Testnet**
- **Local Hardhat Network**

## Troubleshooting

### Common Issues

1. **"addresses.json not found"**
   - Solution: Deploy contracts first using `scripts/deploy.js`

2. **"No addresses found for network"**
   - Solution: Check if contracts are deployed on the target network

3. **"Insufficient balance"**
   - Solution: Ensure Alice has enough tokens to distribute

4. **"Transaction failed"**
   - Solution: Check gas settings and network connectivity

### Manual Verification

You can verify token balances manually:

```bash
npx hardhat run scripts/check-balances.js --network sepolia
```

## Integration with Testing

The token distribution ensures that:
- Both Alice and Bob have sufficient tokens for HTLC operations
- Token approvals are set up for HTLC contracts
- Test scenarios can run without balance issues

This makes the testing environment more realistic and reliable. 