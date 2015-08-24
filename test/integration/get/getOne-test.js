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
      collection = 'getOne-' + db.$newid()
    })
  })
  
  describe('#getOne', function () {
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

    it('should resolve with null when doesn\'t exist', function () {
      return db.repo(collection).getOne({ firstName: 'test' })
        .should.eventually
        .be.null
    })

    it('should resolve with document when exists', function () {
      return db.repo(collection).getOne({ firstName: firstName })
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
    })

    it('should resolve with one when multiple match the criteria', function () {
      return db.repo(collection)
          .add({ firstName: firstName, lastName: 'test' })
          .then(function (doc) {
        return db.repo(collection).getOne({ firstName: firstName })
              .then(function (res) {
          return db.repo(collection).remove(doc)
                  .then(function () { return res })
        })
      })
      .should.eventually
      .have.property('email')
      .that.equal(userDocument.email)
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})