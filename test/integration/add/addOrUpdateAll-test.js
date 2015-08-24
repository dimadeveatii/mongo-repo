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
      collection = 'addOrUpdateAll-' + db.$newid()
    })
  })

  describe('#addOrUpdateAll', function () {
    it('should resolve with an ID when added', function () {
      var doc = { _id: db.$newid(), name: 'test' }
      return db.repo(collection).addOrUpdateAll({ _id: doc._id }, doc)
        .should.eventually
        .satisfy(function (x) { return x.toString() === doc._id.toString() })
    })
    
    it('should be added when no matches found', function () {
      var doc = { _id: db.$newid(), name: 'test' }
      return db.repo(collection).addOrUpdateAll({ _id: doc._id }, doc).then(function (res) {
        return db.repo(collection).getAll(doc).should.eventually.have.length(1)
      })
    })
    
    it('should not be added when matches exist', function () {
      var doc = { _id: db.$newid(), name: 'test', x: 99 }
      return db.repo(collection).add(doc).then(function (res) {
        return db.repo(collection).addOrUpdateAll({ name: 'test', x: 99 }, { name: 'test2' })
          .then(function () { return db.repo(collection).getAll({ x: 99 }) })
          .should.eventually.have.length(1)
      })
    })
    
    it('should update all existent matches', function () {
      var docs = [
        { _id: db.$newid(), name: 'test', x: 2 },
        { _id: db.$newid(), name: 'test', x: 2 }]
      return db.repo(collection)
        .add(docs)
        .then(function (res) {
          return db.repo(collection).addOrUpdateAll({ name: 'test' }, { name: 'test2' })
        })
        .then(function () { return db.repo(collection).getAll({ x: 2 }) })
        .should.eventually.have.length(2)
        .and
        .satisfy(function (arr) {
          return arr[0].name === arr[1].name && 
                 arr[0].name === 'test2'
        })
    })
    
    it('should resolve with null when updated', function () {
      var doc = { _id: db.$newid(), name: 'test' }
      return db.repo(collection)
        .add(doc)
        .then(function (res) {
          return db.repo(collection).addOrUpdateAll({ name: 'test' }, { name: 'test2' })
        })
        .should.eventually.be.null
    })
  })
  
  after(function () {
    if (collection) db.collection(collection).drop()
    if (db) db.close()
    collection = null
    db = null
  })
})