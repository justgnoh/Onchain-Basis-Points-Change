const fs = require("fs");
const axios = require('axios');
// const data = require('./polygon_bsc_txs.json');
// const base_linea_txs = require('./base_linea_txs.json');
// const arbitrum_polygon_txs = require('./arbitrum_polygon.json');
// const polygon_arbitrum_txs = require('./polygon_arbitrum_txs.json');
// const polygon_base_txs = require('./polygon_base_txs.json');
// const base_polygon_txs = require('./base_polygon_txs.json');

var args = process.argv.slice(2);

const from_chain = args[0];
const to_chain = args[1];
const sourceData = require(args[2]);

// Debug Print Source Data
// console.log(sourceData);

// Subgraphs
const polygon_kyber = "https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-matic"
const arb_kyber = "https://api.thegraph.com/subgraphs/name/kybernetwork/kyberswap-elastic-arbitrum-one"
const base_sushi = "https://api.studio.thegraph.com/query/32073/v3-base/v0.0.1"
const linea_kyber = "https://linea-graph.kyberengineering.io/subgraphs/name/kybernetwork/kyberswap-elastic-linea"
const bsc_pancake = "https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc"

// Set Subgraph Links
let from_subgraph;
let to_subgraph;
let from_poolID;
let to_poolID;

switch(from_chain) {
  case 'polygon':
    from_subgraph = polygon_kyber;
    from_poolID = "0xe7129c006353ceda8f229240282c48a54402af45";
    break;
  case 'base':
    from_subgraph = base_sushi;
    from_poolID = "0x966053115156a8279a986ed9400ac602fb2f5800";
    break;
  case 'linea':
    from_subgraph = linea_kyber;
    from_poolID = "0xfbedc4ebeb2951ff96a636c934fce35117847c9d"
    break;
  case 'binance':
    from_subgraph = bsc_pancake;
    from_poolID = "0x803036ac78752ef599ec75c500ac8b0ac0be67df"
    break;
  case 'arbitrum':
    from_subgraph = arb_kyber;
    from_poolID = "0x3ae5285e7fc52d7a09457784eece8ecb40d461b7"
}

switch(to_chain) {
  case 'polygon':
    to_subgraph = polygon_kyber;
    to_poolID = "0xe7129c006353ceda8f229240282c48a54402af45";
    break;
  case 'base':
    to_subgraph = base_sushi;
    to_poolID = "0x966053115156a8279a986ed9400ac602fb2f5800"
    break;
  case 'linea':
    to_subgraph = linea_kyber;
    to_poolID = "0xfbedc4ebeb2951ff96a636c934fce35117847c9d"
    break;
  case 'binance':
    to_subgraph = bsc_pancake;
    to_poolID = "0x803036ac78752ef599ec75c500ac8b0ac0be67df"
    break;
  case 'arbitrum':
    to_subgraph = arb_kyber;
    to_poolID = "0x3ae5285e7fc52d7a09457784eece8ecb40d461b7"
}

// ======= Main Logic =======
// Calculate the price of axlUSDC or USDC on a kyberswap pool
// Input Block number for calculation
async function calculateBpsChange(sqrtPriceX96, nextsqrtPriceX96, chain) {
  // axlUSDC/USDC
  let Decimal1 = 6;
  let Decimal0 = 6;

  if (chain == 'binance') {
    // axlUSDC/BUSD
    // ...
    Decimal1 = 18
    Decimal0 = 6
  }
  
  let prevPrice = sqrtPriceX96**2 / 2**192 * 10**Decimal0 / 10**Decimal1;

  let nextPrice = nextsqrtPriceX96**2 / 2**192 * 10**Decimal0 / 10**Decimal1;

  let priceDiff = nextPrice-prevPrice;
  let bpsChange = parseFloat(priceDiff/0.0001)

  console.log("-----" + chain)
  console.log("Prev Price: "  + prevPrice)
  console.log("Next Price: "  + nextPrice)
  console.log("Price Difference: " + priceDiff);

  console.log("======== Bps Change: " + bpsChange);
  return Math.abs(bpsChange)
}

async function processTXByBlockNumber(subgraph, poolId, blockNumber) {
  try {
    console.log(subgraph);
    const query = await axios.post(subgraph, {
      query: `
      {
        pool(id: "${poolId}") {
          swaps(
            orderBy: timestamp
            orderDirection: asc
            first: 2
            where: {_change_block: {number_gte: ${blockNumber}}}
          ) {
            sqrtPriceX96
            transaction {
              blockNumber
            }
          }
        }
      }
      `
    })
    return query
  } catch(e) {
    // console.log(e);
    return e;
  }
}

async function getPreviousSQRTPrice(subgraph, poolId, blockNumber, retryCount) {
    const r = await axios.post(subgraph, {
      query: `
      {
        pool(id: "${poolId}") {
          swaps(
            orderBy: timestamp
            orderDirection: desc
            first: 2
            where: {transaction_: {blockNumber_lte: ${blockNumber}}}
          ) {
            sqrtPriceX96
            transaction {
              blockNumber
            }
          }
        }
      }
      `
    })

    // Get Prev SqrtPrice
    if (r.data.data) {
      console.log(r.data.data.pool.swaps);
      prevTransaction = r.data.data.pool.swaps[1]
      if (r.data.data.pool.swaps[0].transaction.blockNumber == blockNumber) {
        prevSQRTPrice = prevTransaction.sqrtPriceX96;
        console.log(prevSQRTPrice);
        console.log("----- prevSQRTPrice Found: " + prevEntrySQRTPrice + " at block: " + prevTransaction.transaction.blockNumber);
        return prevSQRTPrice;
      } else {
        console.log("Unique case where previous block is within the same second")
        return r.data.data.pool.swaps[0].sqrtPriceX96;
      }
    }
  // console.log('PREV TRANSACTION INDEX: ' + prevTransactionIndex);
}

let entryTXBlockNumber;
let entrySQRTPrice = 0;
let isValidEntrySwap = true;
let prevEntrySQRTPrice = 0;

let executedTXHash;
let executedTXblockNumber;
let exitSQRTPrice = 0;
let isValidExitSwap = true;
let prevExitSQRTPrice = 0;

let axelarScanHashList = sourceData.data;

async function main() {
  console.log(from_subgraph);
  console.log(to_subgraph);
  for (let i = 0; i < axelarScanHashList.length; i++) {
    // Reset Flags
    isValidEntrySwap = true;
    isValidExitSwap = true;

    console.log("========== HASH " + i + "==========");
    const data = {
      "txHash": axelarScanHashList[i],
      "size":1,
      "method":"searchGMP"
    }
    
    console.log("========== Scraping GMP ==========");
    await axios.post("https://api.gmp.axelarscan.io/", data).then((r) => {
      console.log((r.data.data[0].call.returnValues.amount/1000000).toString() + " " + r.data.data[0].call.returnValues.symbol);
    
      // Register entry swap block number
      entryTXBlockNumber = r.data.data[0].call.blockNumber;

      // Check if gmp express
      console.log("GMP Express Invoked?: " + r.data.data[0].express_executed);

      if (!r.data.data[0].express_executed && r.data.data[0].executed) {
        // Check executed
        executedTXHash = r.data.data[0].executed.transactionHash;
        executedTXblockNumber = r.data.data[0].executed.blockNumber;
      } else if (r.data.data[0].express_executed) {
        // Check Express transaction
        console.log("@@@@@ GMP EXPRESS INVOKED");
        executedTXHash = r.data.data[0].express_executed.transactionHash;
        executedTXblockNumber = r.data.data[0].express_executed.blockNumber;
      } 
      // Register exit tx
      console.log("%%%%% Found entryBlockNumber: " + entryTXBlockNumber);
      console.log("%%%%% Found entry TX: " + axelarScanHashList[i]);
      console.log("%%%%% Found exitBlockNumber: " + executedTXblockNumber);
      console.log("%%%%% Found exit TX: " + executedTXHash);
      // console.log(executedTXHash);
    });

    if (!executedTXHash || !executedTXblockNumber) {
      continue;
    }
  
    // Check if entry swap
    // TODO: Only for Polygon Kyberswap
    console.log("========== Processing Entry ==========")
    let x = await processTXByBlockNumber(from_subgraph, from_poolID, entryTXBlockNumber);

    console.log("%%%%% Getting Current Sqrt Price...")
    
    console.log(x.data.data.pool.swaps)
    if (x.data.data.pool.swaps.length > 0) {
      // console.log("----- Entry Swap Found: " + x.data.data.pool.swaps[0]);
      if (x.data.data.pool.swaps[0].transaction.blockNumber == entryTXBlockNumber) {
        entrySQRTPrice = x.data.data.pool.swaps[0].sqrtPriceX96;
        console.log("Found!: " + entrySQRTPrice);
      } else {
        console.log("xxxxxx Entry Swap NOT FOUND");
        isValidEntrySwap = false;
      }
    } else {
      console.log("ERROR OCCURED");
      isValidEntrySwap = false;
    }

    if (!isValidEntrySwap) continue;
    
    // Get Prev SqrtPrice
    console.log("===== Getting Previous Sqrt Price...")
    prevEntrySQRTPrice = await getPreviousSQRTPrice(from_subgraph, from_poolID, entryTXBlockNumber, 5);
  
    console.log("=========== Processing Exit ========== ");
    const exit = await processTXByBlockNumber(to_subgraph, to_poolID, executedTXblockNumber);
    
    // Get Current SqrtPrice
    console.log("===== Getting Current Sqrt Price...")
    if (exit.data.data) {
      if (exit.data.data.pool.swaps[0].transaction.blockNumber == executedTXblockNumber) {
        exitSQRTPrice = exit.data.data.pool.swaps[0].sqrtPriceX96;
        console.log("Found!: " + exitSQRTPrice);
      } else {
        console.log("xxxxxx Exit Swap NOT FOUND");
        isValidExitSwap = false;
      }
    } else {
      console.log("ERROR OCCURED");
      isValidExitSwap = false;
    }

    if (!isValidExitSwap) continue;

    console.log("===== Getting Prev Sqrt Price...")
    prevExitSQRTPrice = await getPreviousSQRTPrice(to_subgraph, to_poolID, executedTXblockNumber, 5);

    let totalbpschanged = await calculateBpsChange(prevEntrySQRTPrice, entrySQRTPrice, from_chain) + await calculateBpsChange(79265987523607066011758420225828486, 79267046891314047917921069580091957, to_chain)

    // Write results to results.txt
    fs.appendFileSync('results.txt', "tx: " + i + " , " + totalbpschanged +"\n",'utf-8');

    console.log("========== ========== ========== total bps changed: " + totalbpschanged);
  }

}

main();