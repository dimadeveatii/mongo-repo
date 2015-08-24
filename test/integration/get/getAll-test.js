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
      collection = 'getAll-' + db.$newid()
    })
  })
  
  describe('#getAll', function () {
    var userDocuments = [
      {
        name: 'Andrew',
        age: 25,
        email: 'andrew@test.com',
      },
      {
        name: 'Bill',
        age: 25,
        email: 'bill@test.com',
      },
      {
        name: 'Cindy',
        age: 24,
        email: 'cindy@test.com',
      }
    ]

    before(function () {
      return db.repo(collection).add(userDocuments).then(function (res) {
        userDocuments = res
      })
    })

    it('should resolve with empty array when no matches', function () {
      return db.repo(collection).getAll({ name: 'David' })
        .should.eventually.be.empty
    })

    it('should resolve with matching documents', function () {
      return db.repo(collection).getAll({ age: 25 })
        .should.eventually.have.length(2)
    })

    it('should resolve ordered documents when sort specified', function () {
      return db.repo(collection).getAll({ }, { name: -1 })
        .should.eventually
        .have.deep.property('[0].name', 'Cindy')
    })

    it('should resolve with Bill and Cindy when 1st skipped', function () {
      return db.repo(collection).getAll({ }, 1)
        .should.eventually
        .have.length(2)
        .and
        .satisfy(function (res) { return res[0].name === 'Bill' && res[1].name === 'Cindy' })
    })

    it('should resolve with Andrew when takes one', function () {
      return db.repo(collection).getAll({ }, 0, 1)
        .should.eventually
        .have.length(1)
        .and
        .have.deep.property('[0].name', 'Andrew')
    })

    it('should resolve with Bill when skips 1st and takes 1', function () {
      return db.repo(collection).getAll({ }, 1, 1)
        .should.eventually
        .have.length(1)
        .and
        .have.deep.property('[0].name', 'Bill')
    })

    it('should resolve with Andrew when skips two and takes 1 sorted by name descending', function () {
      return db.repo(collection).getAll({ }, { name: -1 }, 2, 1)
        .should.eventually
        .have.length(1)
        .and
        .have.deep.property('[0].name', 'Andrew')
    })
  })

  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})