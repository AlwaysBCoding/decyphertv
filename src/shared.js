class Shared {

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
  
}

module.exports = Shared
