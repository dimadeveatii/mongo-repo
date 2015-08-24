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
      collection = 'updateAll-' + db.$newid()
    })
  })
  
  describe('#updateAll', function () {
    var points
    before(function () {
      points = [{ x: 1, y: 2 }, { x: 1, y: 3 }]
      return db.repo(collection).add(points).then(function (res) { points = res })
    })
    
    it('should resolve with null', function () {
      return db.repo(collection).updateAll({ _id: db.$newid() }, { x: 5 })
        .should.eventually.be.null
    })
    
    it('should update all matches', function () {
      return db.repo(collection).updateAll({ x: 1 }, { y: 99 })
        .then(function () { return db.repo(collection).count({ y: 99 }) })
        .should.eventually.equal(2)
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})