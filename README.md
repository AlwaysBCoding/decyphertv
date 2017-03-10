DecypherTV
=========

A simple library for interacting with the Ethereum blockchain without needing to run your own node. This library is intended to be used as a command-line interface to follow along with the Ethereum Ðapp Development series on http://decypher.tv/series/ethereum-development - but the library can also be used as a simple command line interface into Ethereum for your own purposes.

## Installation
This library is going to be changing constantly, however there will be a snapshot of the current state of the library at the time each episode was recorded available.

To install the specific version used in an episode

`$ npm install -g decyphertv@0.1.{episodeNumber}`

To simply install the latest version

`$ npm install -g decyphertv`

## Usage

There are two modes. Local and Remote. Local assumes that you are running your own node locally (via testrpc, geth, or parity). Remote assumes that you are transacting to a remote node running on a different computer (via infura, blockcypher, or any custom endpoint)

## Start Shell (Local)
To start a shell that is connected to a local node. Pass the flags -m local and -e endpoint where endpoint is the URL of the node  
`$ decypher -m remote -e ${endpoint}`  
`$ decypher -m remote -e http://localhost:8545`

## Start Shell (Remote)
To start a shell that is connected to a remote node. Pass the flags -m remote and -e endpoint where endpoint is the URL of the node  
`$ decypher -m remote -e ${endpoint}`  
`$ decypher -m remote -e https://mainnet.infura.io/123`

## Globals Loaded
NPM Package     | Global Variable
-------------   | -------------
solc            | solc
ethereumjs-tx   | EthTx
ethereumjs-util | EthUtil
web3 (class)    | Web3
web3 (instance) | web3


## Helper Methods
The contract source can either be a string of the contract code, or a relative/absolute path to a .sol solidity file.

```javascript
decypher.opcodes(source)
```

```javascript
decypher.abi(source)
```

```javascript
decypher.contract(source)
```

```javascript
decypher.deployed(source, address)
```

```javascript
decypher.etherBalance(contract|account)
```

## Contract Calls (Remote)
All contract calls take an optional final parameter of an options hash that can override the defaults

```javascript
// Function Signature
decypher.sendEther({to, value}, options={})

// Example Usage
decypher.sendEther({to: "0xC46CDe805aCC8e7507E53E36486C7D8600559d65", value: web3.toWei(1, 'ether')}, {gas: 21000})
```

```javascript
// Function Signature
decypher.deployContract(source, params=[], options={})

// Example Usage
var source = `contract HelloWorld {
  string public message;
  
  function HelloWorld(string _message) {
    message = _message;
  }
}`

decypher.deployContract(source, ["Hello, World!"], {gas: 500000})
```

```javascript
// Function Signature
decypher.callContract(deployed, methodName, params=[], options={})

// Example Usage
var source = `contract HelloWorld {
  string public message;
  
  function HelloWorld(string _message) {
    message = _message;
  }
  
  function updateMessage(string _message) {
  	message = _message;
  }
  
}`

var deployed = decypher.deployed(source, "0xC46CDe805aCC8e7507E53E36486C7D8600559d65")

decypher.callContract(deployed, "updateMessage", ["New Message!!"], {gas: 500000})
```

## Tests

Tests will be added at a future time.

## Contributing

Contribution guides will be added at a future time.
