var chalk = require("chalk");
var solc = require("solc");
var EthTx = require("ethereumjs-tx");
var EthUtil = require("ethereumjs-util");
var fs = require("fs");
var lodash = require("lodash");

class Remote {

  constructor({privateKey, web3}) {
    this.privateKey = privateKey;
    this.privateKeyx = new Buffer(privateKey, 'hex');
    this.acct = "0x" + EthUtil.privateToAddress("0x" + privateKey).toString('hex');
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
      contractSource = fs.readFileSync(source, 'utf8');
    }
    var compiled = solc.compile(contractSource);
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

  hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c+=2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }

  createContract(source, params=[], options={}) {
    var contractSource;
    if(this.contractName(source)) {
      contractSource = source;
    } else {
      contractSource = fs.readFileSync(source, 'utf8');
    }

    var compiled = solc.compile(contractSource);
    var contractName = this.contractName(contractSource);
    var bytecode = compiled["contracts"][`:${contractName}`]["bytecode"];
    var abi = JSON.parse(compiled["contracts"][`:${contractName}`]["interface"])
    var contract = this.web3.eth.contract(abi)
    var contractData = `0x${contract.new.getData(...params, {data: bytecode})}`

    var callback = (error, result) => {
      if(error) {
        console.log(chalk.red("Error Creating Contract"))
        console.log(error)
      } else {
        console.log("...")
        console.log(chalk.green(`deploying contract ${contractName}`))
        console.log(chalk.yellow(`https://testnet.etherscan.io/address/${this.acct}`))
      }
    }

    var rawTx = {
      nonce: this.web3.toHex(this.web3.eth.getTransactionCount(this.acct)),
      from: this.acct,
      data: contractData,
      gasLimit: this.web3.toHex(options.gas || tihs.web3.eth.estimateGas({ data: contractData })),
      gasPrice: this.web3.toHex(options.gasPrice || this.web3.eth.gasPrice)
    }

    var tx = new EthTx(rawTx)
    tx.sign(this.privateKeyx)
    var txData = tx.serialize().toString('hex')

    this.web3.eth.sendRawTransaction(`0x${txData}`, callback)
    return contract
  }

  // callContract() => {
  //   var deployed = arguments['0'].deployed
  //   var methodName  = arguments['0'].methodName
  //
  //   var args = [...arguments]; var params = args.slice(1, args.length);
  //   var solidityFunction = new global.SolidityFunction('', lodash.find(deployed.abi, { name: methodName }), '')
  //   var payloadData = solidityFunction.toPayload(params).data
  //
  //   var rawTx = {
  //     nonce: global.web3.toHex(global.web3.eth.getTransactionCount(global.decypher.acct)),
  //     gasPrice: global.web3.toHex(arguments['0'].gasPrice || global.web3.eth.gasPrice),
  //     gasLimit: global.web3.toHex(arguments['0'].gas || 300000),
  //     to: deployed.address,
  //     from: global.decypher.acct,
  //     data: payloadData
  //   }
  //
  //   var tx = new global.EthTx(rawTx)
  //   tx.sign(global.decypher.privateKeyx)
  //   var txData = tx.serialize().toString('hex')
  //
  //   global.web3.eth.sendRawTransaction(`0x${txData}`, (error, txHash) => {
  //     if(error) {
  //       console.log(chalk.red(`Error Sending Transaction...`))
  //       console.log(error)
  //     } else {
  //       console.log(chalk.cyan(`Sent Transaction...`))
  //       console.log(txHash)
  //     }
  //   })
  //
  //   return true
  // }

}

module.exports = Remote
