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
      collection = 'addOrUpdate-' + db.$newid()
    })
  })
  
  describe('#addOrUpdate', function () {
    it('should resolve with an ID when added', function () {
      var doc = { _id: db.$newid(), name: 'test' }
      return db.repo(collection).addOrUpdate(doc)
        .should.eventually
        .satisfy(function (x) { return x.toString() === doc._id.toString() })
    })
    
    it('should be added when doesn\'t exist', function () {
      var doc = { _id: db.$newid(), name: 'test' }
      return db.repo(collection).addOrUpdate(doc).then(function (res) {
        return db.repo(collection).getAll(doc).should.eventually.have.length(1)
      })
    })
    
    it('should not be added when exists', function () {
      var doc = { _id: db.$newid(), name: 'test', x: 1 }
      return db.repo(collection).add(doc).then(function (res) {
        return db.repo(collection).addOrUpdate({ _id: doc._id, name: 'test2', x: 1 })
          .then(function () { return db.repo(collection).getAll({ x: 1 }) })
          .should.eventually.have.length(1)
      })
    })
    
    it('should be updated when exists', function () {
      var doc = { _id: db.$newid(), name: 'test' }
      return db.repo(collection)
        .add(doc)
        .then(function (res) {
          return db.repo(collection).addOrUpdate({ _id: doc._id, name: 'test2' })
        })
        .then(function () { return db.repo(collection).get(doc) })
        .should.eventually.have.property('name', 'test2')
    })
    
    it('should resolve with null when updated', function () {
      var doc = { _id: db.$newid(), name: 'test' }
      return db.repo(collection)
        .add(doc)
        .then(function (res) {
          return db.repo(collection).addOrUpdate({ _id: doc._id, name: 'test2' })
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