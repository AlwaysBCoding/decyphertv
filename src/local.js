var chalk = require("chalk");
var solc = require("solc");
var EthTx = require("ethereumjs-tx");
var EthUtil = require("ethereumjs-util");
var fs = require("fs");
var lodash = require("lodash");

class Local {

  constructor({web3}) {
    this.web3 = web3;
    this.last = {
      txHash: null,
      blockNumber: null,
      contractAddress: null
    }
  }

  contractName(source) {
    try {
      var re1 = /contract.*{/g
      var re2 = /\s\w+\s/
      return source.match(re1).pop().match(re2)[0].trim()
    }
    catch (error) {
      return false;
    }
  }

  opcodes(source) {
    var contractSource;
    if(this.contractName(source)) {
      contractSource = source; }
    else {
      contractSource = fs.readFileSync(source, 'utf8'); }
    var compiled = solc.compile(contractSource);
    var contractName = this.contractName(contractSource);
    return compiled["contracts"][`:${contractName}`]["opcodes"];
  }

  abi(source) {
    var contractSource;
    if(this.contractName(source)) {
      contractSource = source; }
    else {
      contractSource = fs.readFileSync(source, 'utf8'); }
    var compiled = solc.compile(contractSource);
    var contractName = this.contractName(contractSource);
    return JSON.parse(compiled["contracts"][`:${contractName}`]["interface"]);
  }

  contract(source) {
    var contractSource;
    if(this.contractName(source)) {
      contractSource = source; }
    else {
      contractSource = fs.readFileSync(source, 'utf8'); }
    return this.web3.eth.contract(this.abi(contractSource));
  }

  deployed(source, address) {
    var contractSource;
    if(this.contractName(source)) {
      contractSource = source; }
    else {
      contractSource = fs.readFileSync(source, 'utf8'); }
    return this.contract(contractSource).at(address);
  }

  etherBalance(contract) {
    switch(typeof(contract)) {
      case "object":
        if(contract.address) {
          return this.web3.fromWei(ths.web3.eth.getBalance(contract.address), 'ether').toNumber();
        } else {
          return new Error("cannot call getEtherBalance on an object that does not have a property 'address'");
        }
        break;
      case "string":
        return this.web3.fromWei(this.web3.eth.getBalance(contract), 'ether').toNumber();
        break;
    }
  }

  // Async Calls
  deployContract(source, params=[], options={}) {
    var renderContext = this;
    var contractSource;
    if(this.contractName(source)) {
      contractSource = source; }
    else {
      contractSource = fs.readFileSync(source, 'utf8'); }

    var compiled = solc.compile(contractSource)
    var contractName = this.contractName(contractSource)
    var bytecode = compiled["contracts"][`:${contractName}`]["bytecode"]
    var abi = JSON.parse(compiled["contracts"][`:${contractName}`]["interface"])
    var contract = this.web3.eth.contract(abi)
    var loggingSentinel = false;

    var callback = (error, result) => {
      if(error) {
        console.log(chalk.red("Error Creating Contract"))
        console.log(error)
      } else {
        if(!loggingSentinel) {
          loggingSentinel = true;
        } else {
          console.log(chalk.green(`Deploying Contract ${chalk.underline(contractName)} | Transaction Hash: ${chalk.underline(result.transactionHash)}`))
          console.log(chalk.green(`Contract Address: ${chalk.underline(result.address)}`))
          renderContext.last = {
            txHash: result.transactionHash, blockNumber: result.blockNumber, contractAddress: result.address }
        }
      }
    }
    var tx = {
      from: this.web3.eth.accounts[0],
      data: bytecode,
      gas: this.web3.eth.estimateGas({ data: bytecode }),
      gasPrice: this.web3.eth.gasPrice
    }

    contract.new(...params, Object.assign(tx, options), callback)
  }

}

module.exports = Local
