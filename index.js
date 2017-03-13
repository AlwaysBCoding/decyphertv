#!/usr/bin/env node
var prompt = require('prompt');
var program = require("commander");
var chalk = require("chalk");

// Command Line Flags
program
  .option('-m, --mode <mode>', "The mode to start decypher in [local, remote]")
  .option('-e, --endpoint <endpoint>', "The endpoint for your node to connect to http://...")
  .parse(process.argv)

switch(program.mode) {
  case "local":
    console.log(chalk.bold.cyan(`Starting Decypher...`));

    global.solc = require('solc');
    global.EthTx = require('ethereumjs-tx');
    global.EthUtil = require('ethereumjs-util');
    global.fs = require("fs");
    global.Web3 = require("web3");
    global.SolidityFunction = require("web3/lib/web3/function");
    global.web3 = new Web3(new Web3.providers.HttpProvider(`${program.endpoint}`))
    global.acct1 = web3.eth.accounts[0];
    global.acct2 = web3.eth.accounts[1];
    global.acct3 = web3.eth.accounts[2];
    global.acct4 = web3.eth.accounts[3];
    global.acct5 = web3.eth.accounts[4];

    var Decypher = require("./src/local");
    global.decypher = new Decypher({ web3: global.web3 });

    require('repl').start({});
    break;

  case "remote":
    prompt.start();
    prompt.get([{name: 'privateKey', hidden: true}], (error, result) => {
      console.log(chalk.bold.cyan(`Starting Decypher...`));

      global.solc = require('solc');
      global.EthTx = require('ethereumjs-tx');
      global.EthUtil = require('ethereumjs-util');
      global.fs = require("fs");
      global.Web3 = require("web3");
      global.SolidityFunction = require("web3/lib/web3/function");
      global.web3 = new Web3(new Web3.providers.HttpProvider(`${program.endpoint}`))

      var Decypher = require("./src/remote");
      global.decypher = new Decypher({ privateKey: result.privateKey, web3: global.web3 });

      require('repl').start({});
    })
    break;

    default:
      console.log(chalk.red(`Unknown Mode: '${decypher.program.mode}' - Valid modes are [local, remote]`))
      break;
}
