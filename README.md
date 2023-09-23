# Onchain-Basis-Points-Change

## Overview
An on-chain analysis project to monitor price behavior and price change between high value swaps for axlUSDC/USDC pairs on various DEXs. 

`Axelar Scan API` is used to query the highest value transactions in descending order given a source & destination chain. Handles GMP and GMP Express transactions. 

Price change is measured in basis points (bps) (0.0001)

### Implementation Details
The first step is to obtain the transaction hashes of cross-chain swaps via Squid Router. At the point of writing, Squid Router is the largest application that is built on top of Axelar. The goal of this analysis is to find the transactions that resulted in a >10bps combined change in price. Since a cross-chain swap via Squid Router involves a swap into axlUSDC, and a swap out of axlUSDC into USDC, we define the swap into axlUSDC as the `entry swap` and the swap out of axlUSDC as the `exit swap`. 

The script finds an entry transaction and an exit transaction via the `Axelar Scan API`. It processes the entry transaction by block number and first checks if a swap occurs. If no swap occurs, the next entry transaction hash is processed. Otherwise, it will algorithmically proceed to find the previous transaction via the respective subgraphs. Once the previous transaction is found, the bps changed is calculated for the `entry swap`. The same procedure is done for the exit transaction. The entire processing of a given entry transaction will skip if no `entry swap` or `exit swap` is found.

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
