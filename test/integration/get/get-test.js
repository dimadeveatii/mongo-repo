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
      collection = 'get-' + db.$newid()
    })
  })
  
  describe('#get', function () {
    var documentId
    var userDocument = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@test.com',
    }

    before(function () {
      return db.repo(collection).add(userDocument).then(function (res) {
        documentId = res._id
      })
    })

    it('should resolve with null when doesn\'t exist', function () {
      return db.repo(collection).get(db.$newid())
          .should.eventually
          .be.null
    })

    it('should resolve with document by ObjectID', function () {
      return db.repo(collection).get(documentId)
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
    })

    it('should resolve with document by ObjectID as string', function () {
      return db.repo(collection).get(documentId.toString())
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
    })

    it('should resolve with document by object with _id field', function () {
      return db.repo(collection).get({ _id: documentId })
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