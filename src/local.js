class Local {

  constructor({solc, EthTx, EthUtil, fs, lodash, web3}) {
    this.solc = solc;
    this.EthTx = EthTx;
    this.EthUtil = EthUtil;
    this.fs = fs;
    this.lodash = lodash;
    this.web3 = web3;
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
      contractSource = source;
    } else {
      contractSource = this.fs.readFileSync(source, 'utf8');
    }
    var compiled = this.solc.compile(contractSource);
    var contractName = this.contractName(contractSource);
    return compiled["contracts"][`:${contractName}`]["opcodes"];
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

  createContract(source, params=[], options={}) {
    var contractSource;
    if(this.contractName(source)) {
      contractSource = source;
    } else {
      contractSource = this.fs.readFileSync(source, 'utf8');
    }
    var compiled = this.solc.compile(contractSource)
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
          console.log("...")
          console.log(chalk.green(`deployed contract ${contractName}`))
          console.log(chalk.green(`Transaction Hash: ${result.transactionHash}`))
          console.log(chalk.green(`Contract Address: ${result.address}`))
        }
      }
    }
    var tx = {
      from: this.web3.eth.accounts[0],
      data: bytecode,
      gas: this.web3.eth.estimateGas({ data: bytecode }),
      gasPrice: this.web3.eth.gasPrice
    }

    var deployed = contract.new(...params, Object.assign(tx, options), callback)
    return deployed
  }

}

module.exports = Local
