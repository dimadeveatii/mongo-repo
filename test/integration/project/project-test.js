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
      collection = 'project-' + db.$newid()
    })
  })
  
  describe('#project', function () {
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
      return db.repo(collection).project(db.$newid(), { firstName: 1 })
        .should.eventually
        .be.null
    })

    it('should resolve with projection by ObjectID', function () {
      return db.repo(collection).project(documentId, { _id: 0, firstName: 1 })
        .should.eventually
        .deep.equal({ firstName: userDocument.firstName })
    })

    it('should resolve with projection by ObjectID as string', function () {
      return db.repo(collection).project(documentId.toString(), { _id: 0, firstName: 1 })
        .should.eventually
        .deep.equal({ firstName: userDocument.firstName })
    })

    it('should resolve with projection by object with _id field', function () {
      return db.repo(collection).project({ _id: documentId }, { _id: 0, firstName: 1 })
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