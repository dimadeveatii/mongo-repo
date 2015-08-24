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
      collection = 'update-' + db.$newid()
    })
  })
  
  describe('#update', function () {
    var points
    before(function () {
      points = [{ x: 1, y: 2 }, { x: 1, y: 3 }]
      return db.repo(collection).add(points).then(function (res) { points = res })
    })

    it('should resolve with null', function () {
      return db.repo(collection).update({ _id: db.$newid(), x: 5 })
        .should.eventually.be.null
    })

    it('should update when exists', function () {
      return db.repo(collection).update({ _id: points[0]._id, y: 2, z: 101 })
        .then(function () { return db.repo(collection).project(points[0], { _id: 0, z: 1 }) })
        .should.eventually.deep.equal({ z: 101 })
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})