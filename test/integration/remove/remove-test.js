'use strict'

var setup = require('../setup')
var Repository = require('../../../')

describe.only('#Integration tests', function () {
  var db
  var collection
  
  before(function () {
    return Repository.connectDB(setup.connectionString)
     .then(function (dbClient) {
      db = dbClient
      collection = 'remove-' + db.$newid()
    })
  })
  
  describe('#remove', function () {
    var points
    before(function () {
      points = [{ x: 1, y: 2 }, { x: 1, y: 3 }]
      return db.repo(collection).add(points).then(function (res) { points = res })
    })

    it('should not modify collection when removing non existent item', function () {
      return db.repo(collection).remove(db.$newid())
        .then(function () { return db.repo(collection).count() })
        .should.eventually.equal(points.length)
    })

    it('should remove document', function () {
      var p = { _id: db.$newid(), x: 100 }
      return db.repo(collection).remove(points[0])
        .then(function () { return db.repo(collection).count() })
        .should.eventually.equal(points.length - 1)
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})