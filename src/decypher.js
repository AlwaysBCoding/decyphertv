var decypher = {}

decypher.contractName = (source) => {
  try {
    var re1 = /contract.*{/g
    var re2 = /\s\w+\s/
    return source.match(re1).pop().match(re2)[0].trim()
  }
  catch (error) {
    return false;
  }
}

module.exports = decypher
