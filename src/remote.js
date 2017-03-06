// PKey: cf1115666c7059f3140f10f815a452e313dce2eeae139e08127fdab0a88cb647
// To: 0xee82ddb350f48dd5712d54072172aa1a97c677c8
// Contract Address: 0x917ce96b00369b80b0f268807c4ee18cf5ae5374

var chalk = require("chalk");
var solc = require("solc");
var EthTx = require("ethereumjs-tx");
var EthUtil = require("ethereumjs-util");
var fs = require("fs");
var lodash = require("lodash");
var SolidityFunction = require("web3/lib/web3/function");
var Spinner = require("cli-spinner").Spinner;
var Q = require('q');

class Remote {

  constructor({privateKey, web3}) {
    this.privateKey = privateKey;
    this.privateKeyx = new Buffer(privateKey, 'hex');
    this.acct = "0x" + EthUtil.privateToAddress("0x" + privateKey).toString('hex');
    this.web3 = web3;
    this.last = {
      txHash: null,
      blockNumber: null,
      contractAddress: null
    }
  }

  // Temporary
  createSpinner(ident) {
    if(ident === 'mining') {
      var spinner = new Spinner(chalk.yellow("%s Waiting for transaction to be mined..."));
      spinner.setSpinnerString(0);
      return spinner;
    }
  }

  // Synchronous calls
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
          return this.web3.fromWei(this.web3.eth.getBalance(contract.address), 'ether').toNumber();
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
  sendEther({to, value}, options={}) {
    var renderContext = this;
    var deferred = Q.defer();

    deferred.promise
    .then((data) => {
      console.log(chalk.green(`Transaction Confirmed: Block Number: ${chalk.underline(data.blockNumber)}, Gas Used: ${chalk.underline(data.gasUsed)}`));
      renderContext.last = {
        txHash: data.transactionHash, blockNumber: data.blockNumber, contractAddress: null }; })
    .catch((error) => {
      console.log(chalk.red("Error Sending Ether")); console.log(error); })

    var callback = (error, txHash) => {
      if(error) {
        console.log(chalk.red("Error Sending Ether")); console.log(error); }
      else {
        console.log(chalk.green(`Sending ${chalk.underline(this.web3.fromWei(value).toString())} ETH to ${chalk.underline(to)} | Transaction Hash: ${chalk.underline(txHash)}`))
        var spinner = renderContext.createSpinner('mining');
        spinner.start();
        var miningInterval = setInterval(() => {
          var txReceipt = renderContext.web3.eth.getTransactionReceipt(txHash);
          if(txReceipt) {
            deferred.resolve(txReceipt);
            spinner.stop(true);
            clearInterval(miningInterval);
          }
        }, 1000)
      }
    }

    var rawTx = {
      nonce: this.web3.toHex(this.web3.eth.getTransactionCount(this.acct)),
      from: this.acct,
      to: to,
      value: web3.toHex(value),
      gasLimit: web3.toHex(21000),
      gasPrice: this.web3.toHex(options.gasPrice || this.web3.eth.gasPrice)
    }

    var tx = new EthTx(rawTx);
    tx.sign(this.privateKeyx);
    var txData = tx.serialize().toString('hex');

    this.web3.eth.sendRawTransaction(`0x${txData}`, callback);
  }

  deployContract(source, params=[], options={}) {
    var renderContext = this;
    var deferred = Q.defer();

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

    deferred.promise
    .then((data) => {
      console.log(chalk.green(`Contract Deployed: Contract Address: ${chalk.underline(data.contractAddress)}, Block Number: ${chalk.underline(data.blockNumber)}, Gas Used: ${chalk.underline(data.gasUsed)}`));
      renderContext.last = {
        txHash: data.transactionHash, blockNumber: data.blockNumber, contractAddress: data.contractAddress }; })
    .catch((error) => {
      console.log(chalk.red("Error Deploying Contract")); console.log(error); })

    var callback = (error, txHash) => {
      if(error) {
        console.log(chalk.red("Error Deploying Contract")) ; console.log(error); }
      else {
        console.log(chalk.green(`Deploying Contract ${chalk.underline(contractName)} | Transaction Hash: ${chalk.underline(txHash)}`));
        var spinner = renderContext.createSpinner('mining');
        spinner.start();
        var miningInterval = setInterval(() => {
          var txReceipt = renderContext.web3.eth.getTransactionReceipt(txHash);
          if(txReceipt) {
            deferred.resolve(txReceipt);
            spinner.stop(true);
            clearInterval(miningInterval);
          }
        }, 1000)
      }
    }

    var rawTx = {
      nonce: this.web3.toHex(this.web3.eth.getTransactionCount(this.acct)),
      from: this.acct,
      data: contractData,
      gasLimit: this.web3.toHex(options.gas || this.web3.eth.estimateGas({ data: contractData })),
      gasPrice: this.web3.toHex(options.gasPrice || this.web3.eth.gasPrice)
    }

    var tx = new EthTx(rawTx);
    tx.sign(this.privateKeyx);
    var txData = tx.serialize().toString('hex');

    this.web3.eth.sendRawTransaction(`0x${txData}`, callback);
  }

  callContract(deployed, methodName, params=[], options={}) {
    var renderContext = this;
    var deferred = Q.defer();

    var solidityFunction = new SolidityFunction('', lodash.find(deployed.abi, { name: methodName }), '')
    var payloadData = solidityFunction.toPayload(params).data

    deferred.promise
    .then((data) => {
      console.log(chalk.green(`Executed Contract Call: Block Number: ${chalk.underline(data.blockNumber)}, Gas Used: ${chalk.underline(data.gasUsed)}`));
      renderContext.last = {
        txHash: data.transactionHash, blockNumber: data.blockNumber, contractAddress: deployed.address }; })
    .catch((error) => {
      console.log(chalk.red("Error Calling Contract")); console.log(error); })

    var callback = (error, txHash) => {
      if(error) {
        console.log(chalk.red("Error Calling Contract")); console.log(error); }
      else {
        console.log(chalk.green(`Calling Contract ${chalk.underline(deployed.address)} | Transaction Hash: ${chalk.underline(txHash)}`))
        var spinner = renderContext.createSpinner('mining');
        spinner.start();
        var miningInterval = setInterval(() => {
          var txReceipt = renderContext.web3.eth.getTransactionReceipt(txHash);
          if(txReceipt) {
            deferred.resolve(txReceipt);
            spinner.stop(true);
            clearInterval(miningInterval);
          }
        }, 1000)
      }
    }

    var rawTx = {
      nonce: this.web3.toHex(this.web3.eth.getTransactionCount(this.acct)),
      from: this.acct,
      data: payloadData,
      gasLimit: this.web3.toHex(options.gas || this.web3.eth.estimateGas({ data: payloadData })),
      gasPrice: this.web3.toHex(options.gasPrice || this.web3.eth.gasPrice),
      to: deployed.address
    }

    var tx = new EthTx(rawTx)
    tx.sign(this.privateKeyx)
    var txData = tx.serialize().toString('hex')

    this.web3.eth.sendRawTransaction(`0x${txData}`, callback)
  }

  // var callContract = (deployed, methodName, params=[], options={}) => {
  //   var solidityFunction = new SolidityFunction('', lodash.find(deployed.abi, { name: methodName }), '')
  //   var payloadData = solidityFunction.toPayload(params).data
  //
  //   console.log(payloadData)
  //
  //   var callback = (error, txHash) => {
  //     if(error) {
  //       console.log(chalk.red("Error Calling Contract"))
  //       console.log(error)
  //     } else {
  //       console.log("...")
  //       console.log(chalk.green(`Completed Contract Call`))
  //       console.log(chalk.yellow(`TX: ${txHash}`))
  //     }
  //   }
  //
  //   var rawTx = {
  //     nonce: web3.toHex(web3.eth.getTransactionCount(decypher.acct)),
  //     gasPrice: web3.toHex(options.gasPrice || web3.eth.gasPrice),
  //     gasLimit: web3.toHex(options.gas || 300000),
  //     to: deployed.address,
  //     from: decypher.acct,
  //     data: payloadData
  //   }
  //
  //   var tx = new EthTx(rawTx)
  //   tx.sign(decypher.privateKeyx)
  //   var txData = tx.serialize().toString('hex')
  //
  //   web3.eth.sendRawTransaction(`0x${txData}`, callback)
  //
  //   return true
  // }

  // callContract(deployed, "newNode", [decypher.acct, "Washington", 0], {gas: 3000000})

  // cx() {
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
