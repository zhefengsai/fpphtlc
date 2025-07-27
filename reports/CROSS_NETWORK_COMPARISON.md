# Cross-Network Comparison Report: HTLC vs FPPHTLC

## Test Configuration
- Test Iterations: 5
- Token Amount: 0.001 tokens
- Timelock Duration: 3600 seconds

## 1. Detailed Network Performance

### Sepolia Network

#### HTLC Protocol
- Lock Time:
  - Average: 30.08s
  - Min: 24.16s
  - Max: 36.95s
- Claim Time:
  - Average: 29.38s
  - Min: 21.34s
  - Max: 43.13s
- Gas Usage:
  - Average: 878,410.4
  - Min: 878,408
  - Max: 878,420
  - Total: 4,392,052

#### FPPHTLC Protocol
- Lock Time:
  - Average: 0.00s
  - Min: Infinitys
  - Max: 0.00s
- Claim Time:
  - Average: 0.00s
  - Min: Infinitys
  - Max: 0.00s
- Gas Usage:
  - Average: 0
  - Min: ∞
  - Max: 0
  - Total: 0

### BSC Testnet Network

#### HTLC Protocol
- Lock Time:
  - Average: 11.35s
  - Min: 8.24s
  - Max: 13.18s
- Claim Time:
  - Average: 10.17s
  - Min: 8.29s
  - Max: 11.37s
- Gas Usage:
  - Average: 889,899.2
  - Min: 886,040
  - Max: 890,864
  - Total: 4,449,496

#### FPPHTLC Protocol
- Lock Time:
  - Average: 0.00s
  - Min: Infinitys
  - Max: 0.00s
- Claim Time:
  - Average: 0.00s
  - Min: Infinitys
  - Max: 0.00s
- Gas Usage:
  - Average: 0
  - Min: ∞
  - Max: 0
  - Total: 0

## 2. Protocol Comparison

### Performance Improvement
- Lock Time: 100%
- Claim Time: 100%
- Gas Usage: -100%

### Network Comparison
- Transaction Speed: BSC Testnet faster
- Gas Cost: Sepolia cheaper

## 3. Test Details

### Successful Tests
- HTLC: 10 tests
- FPPHTLC: 0 tests

### Error Analysis

#### HTLC Errors
- bscTestnet (7/28/2025, 12:01:40 AM): Error: insufficient funds for intrinsic transaction cost [ See: https://links.ethers.org/v5-errors-INSUFFICIENT_FUNDS ] (error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\"jsonrpc\":\"2.0\",\"id\":58,\"error\":{\"code\":-32000,\"message\":\"insufficient funds for gas * price + value: balance 84525044517447324, queued cost 43534596000000000, tx cost 43534692000000000, overshot 2544243482552676\"}}","error":{"code":-32000},"requestBody":"{\"method\":\"eth_sendRawTransaction\",\"params\":[\"0x02f8b3618201178459682f008459682f008401badb98947adc0eadc8a472108e05d866d79c4c16b5d9346080b844095ea7b3000000000000000000000000c608f966b48cab8e46ac4f439ac78679bade69f3000000000000000000000000000000000000000000000000002386f26fc10000c001a05808043f75c769dbdfaa69949103a474609e689c3a76af89cebfa2116529ecf7a003e4fc8755e733275f39294758ce01ed2e6dfe1ff261985c99f6df69d1b1ee8d\"],\"id\":58,\"jsonrpc\":\"2.0\"}","requestMethod":"POST","url":"https://data-seed-prebsc-1-s1.binance.org:8545/"}, method="sendTransaction", transaction="0x02f8b3618201178459682f008459682f008401badb98947adc0eadc8a472108e05d866d79c4c16b5d9346080b844095ea7b3000000000000000000000000c608f966b48cab8e46ac4f439ac78679bade69f3000000000000000000000000000000000000000000000000002386f26fc10000c001a05808043f75c769dbdfaa69949103a474609e689c3a76af89cebfa2116529ecf7a003e4fc8755e733275f39294758ce01ed2e6dfe1ff261985c99f6df69d1b1ee8d", code=INSUFFICIENT_FUNDS, version=providers/5.8.0)

#### FPPHTLC Errors
- bscTestnet (7/28/2025, 12:01:40 AM): Error: insufficient funds for intrinsic transaction cost [ See: https://links.ethers.org/v5-errors-INSUFFICIENT_FUNDS ] (error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\"jsonrpc\":\"2.0\",\"id\":58,\"error\":{\"code\":-32000,\"message\":\"insufficient funds for gas * price + value: balance 84525044517447324, queued cost 43534596000000000, tx cost 43534692000000000, overshot 2544243482552676\"}}","error":{"code":-32000},"requestBody":"{\"method\":\"eth_sendRawTransaction\",\"params\":[\"0x02f8b3618201178459682f008459682f008401badb98947adc0eadc8a472108e05d866d79c4c16b5d9346080b844095ea7b3000000000000000000000000c608f966b48cab8e46ac4f439ac78679bade69f3000000000000000000000000000000000000000000000000002386f26fc10000c001a05808043f75c769dbdfaa69949103a474609e689c3a76af89cebfa2116529ecf7a003e4fc8755e733275f39294758ce01ed2e6dfe1ff261985c99f6df69d1b1ee8d\"],\"id\":58,\"jsonrpc\":\"2.0\"}","requestMethod":"POST","url":"https://data-seed-prebsc-1-s1.binance.org:8545/"}, method="sendTransaction", transaction="0x02f8b3618201178459682f008459682f008401badb98947adc0eadc8a472108e05d866d79c4c16b5d9346080b844095ea7b3000000000000000000000000c608f966b48cab8e46ac4f439ac78679bade69f3000000000000000000000000000000000000000000000000002386f26fc10000c001a05808043f75c769dbdfaa69949103a474609e689c3a76af89cebfa2116529ecf7a003e4fc8755e733275f39294758ce01ed2e6dfe1ff261985c99f6df69d1b1ee8d", code=INSUFFICIENT_FUNDS, version=providers/5.8.0)
- both (7/28/2025, 12:08:25 AM): Error: call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="generateCombinedHash(bytes32,bytes32)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.8.0)
- both (7/28/2025, 12:08:25 AM): Error: call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="generateCombinedHash(bytes32,bytes32)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.8.0)
- both (7/28/2025, 12:08:25 AM): Error: call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="generateCombinedHash(bytes32,bytes32)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.8.0)
- both (7/28/2025, 12:08:25 AM): Error: call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="generateCombinedHash(bytes32,bytes32)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.8.0)
- both (7/28/2025, 12:08:25 AM): Error: call revert exception [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (method="generateCombinedHash(bytes32,bytes32)", data="0x", errorArgs=null, errorName=null, errorSignature=null, reason=null, code=CALL_EXCEPTION, version=abi/5.8.0)

## 4. Conclusion

### Overall Performance
- Lock Phase: FPPHTLC significantly faster
- Claim Phase: FPPHTLC significantly faster
- Gas Efficiency: FPPHTLC more efficient

### Recommendations
1. Consider using FPPHTLC for faster transaction completion
2. FPPHTLC shows better gas efficiency
3. Network choice depends on priority (speed vs cost)

---
Report generated at: 2025-07-27T16:08:25.403Z