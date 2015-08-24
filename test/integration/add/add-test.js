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
        collection = 'add-' + db.$newid()
      })
  })
  
  describe('#add', function () {
    it('should resolve with inserted document', function () {
      var document = { x: 1, y: 2 }
      return db.repo(collection).add(document)
        .should.eventually.have.property('_id')
    })
    
    it('should be queryable when added', function () {
      var document = { x: 1, y: 2 }
      return db.repo(collection).add(document)
        .then(function (doc) {
          return db.repo(collection).get(doc)
            .should.eventually.deep.equal(doc)
        })
    })
    
    it('should resolve with inserterd documents when array passed', function () {
      var document1 = { x: 1, y: 2 }
      var document2 = { x: 3, y: 4 }
      return db.repo(collection).add([document1, document2])
        .should.eventually.have.length(2)
    })

    it('should be queryable when added add array', function () {
      var document1 = { x: 9, y: 1 }
      var document2 = { x: 9, y: 1 }
      return db.repo(collection).add([document1, document2])
        .then(function (doc) {
          return db.repo(collection).count({x: 9})
              .should.eventually.equal(2)
        })
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})