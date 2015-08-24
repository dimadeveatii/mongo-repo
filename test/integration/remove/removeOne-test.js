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
      collection = 'removeOne-' + db.$newid()
    })
  })
  
  describe('#removeOne', function () {
    var points
    before(function () {
      points = [{ x: 1, y: 2 }, { x: 1, y: 3 }, {x: 2, y: 3}]
      return db.repo(collection).add(points).then(function (res) { points = res })
    })

    it('should not modify collection when no matches exist', function () {
      return db.repo(collection).removeOne({ fake: 'data' })
        .then(function () { return db.repo(collection).count() })
        .should.eventually.equal(points.length)
    })

    it('should remove matching the criteria', function () {
      return db.repo(collection).removeOne({ x: 1, y: 2 })
        .then(function () { return db.repo(collection).count() })
        .should.eventually.equal(2)
    })

    it('should remove single when multiple matches exist', function () {
      return db.repo(collection).removeOne({ x: 1 })
        .then(function () { return db.repo(collection).count() })
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