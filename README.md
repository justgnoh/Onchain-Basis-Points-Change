# Onchain-Basis-Points-Change

## Overview
An on-chain analysis project to monitor price behavior and price change between high value swaps for axlUSDC/USDC pairs on various DEXs. 

`Axelar Scan API` is used to query the highest value transactions in descending order given a source & destination chain. Handles GMP and GMP Express transactions. 

Price change is measured in basis points (0.0001)

## Usage
- Choose the DEX where your token pair resides
- Provide address of each pool on a specific DEX (no validation)
- Run `tx_export.js` with arguments (source chain, destination chain, write destination)
- Run `getBPSChange.js` with arguments (source chain, destination chain, input file)
- Results are written to `result.txt` for post processing

| Source/Destination Chains      | Description |
| ----------- | ----------- |
| base      | Base chain       |
| arbitrum   | Arbitrum chain        |
| optimism   | Optimism chain        |
| linea   | Linea chain        |
| polygon   |  Polygon chain       |
| ethereum   |  Ethereum chain       |
| binance   | BNB chain        |

### Write Destination

Write destinations are currently only configured to be created within the same directory.

### Command line prompt for `tx_export.js`

```bash
# Example inputs for tx_export.js
node tx_export.js base linea test.json
node tx_export.js polygon arbitrum txs.json
```

### Command line prompt for `getBPSChange.js`

```bash
# Example inputs for getBPSChange.js
node getBPSChange.js polygon linea ./test.json
node getBPSChange.js binance arbitrum ./txs.json
```
