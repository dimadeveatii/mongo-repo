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
      collection = 'updateOne-' + db.$newid()
    })
  })
  
  describe('#updateOne', function () {
    var points
    before(function () {
      points = [{ x: 1, y: 2 }, { x: 1, y: 3 }]
      return db.repo(collection).add(points).then(function (res) { points = res })
    })
    
    it('should resolve with null', function () {
      return db.repo(collection).updateOne({ test: 1234 }, { prop: 1 })
        .should.eventually.be.null
    })
    
    it('should update when exists', function () {
      return db.repo(collection).updateOne({ y: 2 }, { y: 5 })
        .then(function () { return db.repo(collection).project(points[0], { _id: 0, y: 1 }) })
        .should.eventually.deep.equal({ y: 5 })
    })
    
    it('should update single when multiple matches found', function () {
      return db.repo(collection).updateOne({ x: 1 }, { x: 10 })
        .then(function () { return db.repo(collection).count({ x: 10 }) })
        .should.eventually.equal(1)
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})