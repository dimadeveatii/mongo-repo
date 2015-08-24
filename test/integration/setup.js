'use strict'

var chai = require("chai")
var chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)
chai.should()

module.exports.connectionString = 'mongodb://locahost:27017/integration'