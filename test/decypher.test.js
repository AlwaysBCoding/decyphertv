// External Libraries
var fs = require("fs")

// Constants
const decypher = require("../src/decypher")
const __TESTDIR__ = "/Users/AlwaysBCoding/Desktop/decyphertv/test"

// Contracts
var HelloWorldContract = fs.readFileSync(__TESTDIR__ + "/contracts/HelloWorld.sol", "utf8")
var CrowdfundContract = fs.readFileSync(__TESTDIR__ + "/contracts/crowdfund.sol", "utf8")
var EscrowContract = fs.readFileSync(__TESTDIR__ + "/contracts/Escrow.sol", "utf8")

// Method Tests
describe("#contractName", () => {

  test('parses TitleCase name', () => {
    expect(decypher.contractName(HelloWorldContract)).toBe("HelloWorld")
  })

  test('parses lowercase name', () => {
    expect(decypher.contractName(CrowdfundContract)).toBe("crowdfund")
  })

  test('parses Simple name', () => {
    expect(decypher.contractName(EscrowContract)).toBe("Escrow")
  })

})
