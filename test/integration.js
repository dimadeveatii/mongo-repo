'use strict'

var chai = require("chai")
var chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)

chai.should()
var expect = chai.expect

var MongoClient = require('mongodb').MongoClient
var connectionString = 'mongodb://localhost:27017/integration'
var Repository = require('../')

describe('#Integration tests ...', function () {
  var db

  before(function (done) {
    MongoClient.connect(connectionString, function (err, dbClient) {
      if (err)
        return done(new Error('In order to run integration tests please specify a valid connectionString.'))

      db = dbClient
      done()
    })
  })

  describe('#reading data', function () {
    describe('#get', function () {
      
      var documentId
      var userDocument = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@test.com',
        visits: 0
      }
      
      before(function(done) {
        var repo = Repository.create(db, 'users')
        repo.add(userDocument).then(function (res) {
          documentId = res._id
          done()
        })
      })

      it('when get by ObjectID and exists resolves with the document', function () {
        var repo = Repository.create(db, 'users')
        return repo.get(documentId)
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
      })

      after(function(done) {
        var repo = Repository.create(db, 'users')
        repo.remove(userDocument).then(function () { done() })
      })
    })
  })

  after(function() {
    db.close()
    db = null
  })
})