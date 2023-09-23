const axios = require('axios');
const fs = require("fs");

var args = process.argv.slice(2);

let sourceChain = args[0];
let destinationChain = args[1];
let writeDestination = args[2];

// Example data scrape: node tx_export polygon binance polygon_bsc_txs.json

const data = {
    "sourceChain": sourceChain,
    "destinationChain": destinationChain,
    "from": 0,
    "size": 100,
    "method":"searchGMP",
    "sort": {
        "value": "desc"
    },
    "sortBy": "value",
    "asset": "uusdc"
}

const getTX = axios.post('https://api.gmp.axelarscan.io/',data).then((r) => {
    console.log(r.data.data.length);
    let temp = [];
    for(let i = 0; i < r.data.data.length; i++) {
        temp.push(r.data.data[i].call.transactionHash);
    }

    let objToWrite = {
        "data": temp
    }

    fs.writeFileSync("./" + writeDestination, JSON.stringify(objToWrite));
})