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
      collection = 'projectAll-' + db.$newid()
    })
  })
  
  describe('#projectAll', function () {
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
      return db.repo(collection)
        .projectAll({ name: 'David' }, { _id: 0, firstName: 1 })
        .should.eventually.be.empty
    })
    
    it('should resolve with matching document projections', function () {
      return db.repo(collection).projectAll({ age: 25 }, { _id: 0, firstName: 1 })
        .should.eventually.have.length(2)
    })
    
    it('should resolve ordered projections when sort specified', function () {
      return db.repo(collection)
        .projectAll({ }, { _id: 0, email: 1 }, { name: -1 })
        .should.eventually
        .have.deep.property('[0]')
        .that.deep.equal({ email: 'cindy@test.com' })
    })
    
    it('should resolve with Bill and Cindy emails when 1st skipped', function () {
      return db.repo(collection)
        .projectAll({ }, { _id: 0, email: 1 }, 1)
        .should.eventually
        .have.length(2)
        .and
        .satisfy(function (res) {
          return res[0].email === 'bill@test.com' && res[1].email === 'cindy@test.com'
        })
    })
    
    it('should resolve with Andrew\'s email when takes one', function () {
      return db.repo(collection)
        .projectAll({ }, { _id: 0, email: 1 }, 0, 1)
        .should.eventually
        .have.length(1)
        .and
        .have.deep.property('[0]')
        .that.deep.equal({ email: 'andrew@test.com' })
    })
    
    it('should resolve with Bill\'s email when skips 1st and takes 1', function () {
      return db.repo(collection)
        .projectAll({  }, { _id: 0, email: 1 }, 1, 1)
        .should.eventually
        .have.length(1)
        .and
        .have.deep.property('[0]')
        .that.deep.equal({ email: 'bill@test.com' })
    })
    
    it('should resolve with Andrew\'s email when skips two and takes 1 sorted by name descending', function () {
      return db.repo(collection)
        .projectAll({ }, { _id: 0, email: 1 }, { name: -1 }, 2, 1)
        .should.eventually
        .have.length(1)
        .and
        .have.deep.property('[0]')
        .that.deep.equal({ email: 'andrew@test.com' })
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})