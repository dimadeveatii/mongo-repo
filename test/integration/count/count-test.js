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
        collection = 'count-' + db.$newid()
      })
  })

  describe('#count', function () {
    var points
    before(function () {
      points = [{ x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }]
      return db.repo(collection).add(points).then(function (res) { points = res })
    })

    it('should resolve with 0 for empty collection', function () {
      return db.repo('unknown').count().should.eventually.equal(0)
    })

    it('should count only those matching the criteria', function () {
      return db.repo(collection).count({ y: 2 }).should.eventually.equal(1)
    })

    it('should count all when no criteria was specified', function () {
      return db.repo(collection).count().should.eventually.equal(points.length)
    })
  })

  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})