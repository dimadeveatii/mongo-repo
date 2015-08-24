'use strict'

var setup = require('../setup')
var Repository = require('../../../')

describe('#Integration tests', function () {
  var db
  var collection
  
  before(function () {
    return Repository.connectDB(setup.connectionString)
     .then(function (dbClient) {
      db = dbClient
      collection = 'projectOne-' + db.$newid()
    })
  })
  
  describe('#projectOne', function () {
    var firstName = 'John'
    var documentId
    var userDocument = {
      firstName: firstName,
      lastName: 'Doe',
      email: 'johndoe@test.com',
    }
    
    before(function () {
      return db.repo(collection).add(userDocument).then(function (res) {
        documentId = res._id
      })
    })

    it('should resolve with null when doens\' exist', function () {
      return db.repo(collection).projectOne({ firstName: 'test' }, { _id: 0, firstName: 1 })
          .should.eventually
          .be.null
    })
    
    it('should resolve with projection when exists', function () {
      return db.repo(collection).projectOne({ firstName: firstName }, { _id: 0, firstName: 1 })
        .should.eventually
        .deep.equal({ firstName: userDocument.firstName })
    })
    
    it('should resolve with single projection when multiple match the criteria', function () {
      return db.repo(collection)
        .add({ firstName: firstName, lastName: 'test' })
        .then(function (doc) {
          return db.repo(collection).projectOne({ firstName: firstName }, { _id: 0, firstName: 1 })
            .then(function (res) {
              return db.repo(collection).remove(doc)
                .then(function () { return res })
          })
        })
        .should.eventually
        .deep.equal({ firstName: userDocument.firstName })
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})