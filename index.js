#!/usr/bin/env node
var prompt = require('prompt');
var program = require("commander");
var chalk = require("chalk");

// Helpers
var hexToBytes = function(hex) {
  for (var bytes = [], c = 0; c < hex.length; c+=2)
  bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// Command Line Flags
program
  .option('-m, --mode <mode>', "The mode to start decypher in [testrpc, ropsten, main]")
  .option('-i, --infuraKey <infuraKey>', "The slug for your Infura instance")
  .option('-p, --port <port>', "The port to connect to if running a testrpc instance locally")
  .parse(process.argv)

global.decypher = {}
global.decypher.program = program

switch(decypher.program.mode) {
  case "testrpc":
    console.log(chalk.bold.cyan(`Starting Decypher...`));

    // Declare Constants
    global.solc = require('solc');
    global.EthTx = require('ethereumjs-tx');
    global.EthUtil = require('ethereumjs-util');
    global.fs = require("fs");
    global.Web3 = require("web3");
    global.lodash = require("lodash");
    global.SolidityFunction = require("web3/lib/web3/function");
    global.web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:${decypher.program.port || 8545}`))
    global.acct1 = web3.eth.accounts[0];
    global.acct2 = web3.eth.accounts[1];
    global.acct3 = web3.eth.accounts[2];
    global.acct4 = web3.eth.accounts[3];
    global.acct5 = web3.eth.accounts[4];

    global.decypher.contractName = (source) => {
      try {
        var re1 = /contract.*{/g
        var re2 = /\s\w+\s/
        return source.match(re1).pop().match(re2)[0].trim()
      }
      catch (error) {
        return false;
      }
    }

    global.decypher.etherBalance = (contract) => {
      switch(typeof(contract)) {
        case "object":
          if(contract.address) {
            return global.web3.fromWei(global.web3.eth.getBalance(contract.address), 'ether').toNumber();
          } else {
            return new Error("cannot call getEtherBalance on an object that does not have a property 'address'");
          }
          break;
        case "string":
          return global.web3.fromWei(global.web3.eth.getBalance(contract), 'ether').toNumber();
          break;
      }
    }

    global.decypher.createContract = (source, params=[], options={}) => {
      if(global.decypher.contractName(source)) {
        contractSource = source;
      } else {
        contractSource = fs.readFileSync(source, 'utf8');
      }
      var compiled = solc.compile(contractSource)
      var contractName = global.decypher.contractName(contractSource)
      var bytecode = compiled["contracts"][`:${contractName}`]["bytecode"]
      var abi = JSON.parse(compiled["contracts"][`:${contractName}`]["interface"])
      var contract = global.web3.eth.contract(abi)
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
        from: global.web3.eth.accounts[0],
        data: bytecode,
        gas: global.web3.eth.estimateGas({ data: bytecode }),
        gasPrice: global.web3.eth.gasPrice
      }

      var deployed = contract.new(...params, Object.assign(tx, options), callback)
      return deployed
    }

    // Start REPL
    require('repl').start({});
    break;

  case "ropsten":
    prompt.start();

    prompt.get([{name: 'privateKey', hidden: true}], (error, result) => {
      console.log(chalk.bold.cyan(`Starting Decypher...`));

      // Declare Constants
      global.decypher.privateKey = result.privateKey;
      global.decypher.privateKeyx = new Buffer(global.decypher.privateKey, 'hex');
      global.solc = require('solc');
      global.EthTx = require('ethereumjs-tx');
      global.EthUtil = require('ethereumjs-util');
      global.Web3 = require("web3");
      global.lodash = require("lodash");
      global.SolidityFunction = require("web3/lib/web3/function");
      global.decypher.acct = `0x${EthUtil.privateToAddress(hexToBytes(global.decypher.privateKey)).toString('hex')}`;
      global.web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/${global.decypher.infuraKey}`));

      global.decypher.contractName = (source) => {
        var re1 = /contract.*{/g
        var re2 = /\s\w+\s/
        return source.match(re1).pop().match(re2)[0].trim()
      }

      global.decypher.etherBalance = (contract) => {
        switch(typeof(contract)) {
          case "object":
            if(contract.address) {
              return global.web3.fromWei(global.web3.eth.getBalance(contract.address), 'ether').toNumber();
            } else {
              return new Error("cannot call getEtherBalance on an object that does not have a property 'address'");
            }
            break;
          case "string":
            return global.web3.fromWei(global.web3.eth.getBalance(contract), 'ether').toNumber();
            break;
        }
      }

      global.decypher.createContract = (source, params=[], options={}) => {
        if(global.decypher.contractName(source)) {
          contractSource = source;
        } else {
          contractSource = fs.readFileSync(source, 'utf8');
        }

        var compiled = solc.compile(contractSource);
        var contractName = global.decypher.contractName(contractSource);
        var bytecode = compiled["contracts"][`:${contractName}`]["bytecode"];
        var abi = JSON.parse(compiled["contracts"][`:${contractName}`]["interface"])
        var contract = global.web3.eth.contract(abi)
        var contractData = `0x${contract.new.getData(...params, {data: bytecode})}`

        var callback = (error, result) => {
          if(error) {
            console.log(chalk.red("Error Creating Contract"))
            console.log(error)
          } else {
            console.log("...")
            console.log(chalk.green(`deploying contract ${contractName}`))
            console.log(chalk.yellow(`https://testnet.etherscan.io/address/${global.decypher.acct}`))
          }
        }

        var rawTx = {
          nonce: global.web3.toHex(global.web3.eth.getTransactionCount(global.decypher.acct)),
          from: global.decypher.acct,
          data: contractData,
          gasLimit: global.web3.toHex(options.gas || global.web3.eth.estimateGas({ data: contractData })),
          gasPrice: global.web3.toHex(options.gasPrice || global.web3.eth.gasPrice)
        }

        var tx = new global.EthTx(rawTx)
        tx.sign(global.decypher.privateKeyx)
        var txData = tx.serialize().toString('hex')

        global.web3.eth.sendRawTransaction(`0x${txData}`, callback)
        return contract
      }

      global.decypher.callContract = () => {
        var deployed = arguments['0'].deployed
        var methodName  = arguments['0'].methodName

        var args = [...arguments]; var params = args.slice(1, args.length);
        var solidityFunction = new global.SolidityFunction('', lodash.find(deployed.abi, { name: methodName }), '')
        var payloadData = solidityFunction.toPayload(params).data

        var rawTx = {
          nonce: global.web3.toHex(global.web3.eth.getTransactionCount(global.decypher.acct)),
          gasPrice: global.web3.toHex(arguments['0'].gasPrice || global.web3.eth.gasPrice),
          gasLimit: global.web3.toHex(arguments['0'].gas || 300000),
          to: deployed.address,
          from: global.decypher.acct,
          data: payloadData
        }

        var tx = new global.EthTx(rawTx)
        tx.sign(global.decypher.privateKeyx)
        var txData = tx.serialize().toString('hex')

        global.web3.eth.sendRawTransaction(`0x${txData}`, (error, txHash) => {
          if(error) {
            console.log(chalk.red(`Error Sending Transaction...`))
            console.log(error)
          } else {
            console.log(chalk.cyan(`Sent Transaction...`))
            console.log(txHash)
          }
        })

        return true
      }

      // Start REPL
      require('repl').start({});
    })
    break;

    default:
      console.log(chalk.red(`Unknown Mode: '${decypher.program.mode}' - Valid modes are [testrpc, ropsten]`))
      break;
}
