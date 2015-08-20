'use strict'

var chai = require("chai")
var chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)

chai.should()
var expect = chai.expect

var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID
var connectionString = 'mongodb://localhost:27017/integration'
var Repository = require('../')

describe('#Integration tests ...', function () {
  var db

  before(function (done) {
    MongoClient.connect(connectionString, function (err, dbClient) {
      if (err)
        return done(new Error('In order to run integration tests please specify a valid connectionString.'))

      db = dbClient
      done()
    })
  })

  describe('#reading documents', function () {
    describe('#get', function () {

      var documentId
      var userDocument = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@test.com',
      }

      before(function(done) {
        var repo = Repository.create(db, 'users')
        repo.add(userDocument).then(function (res) {
          documentId = res._id
          done()
        })
      })

      it('when get non-existing by ObjectID resolves with null', function () {
        var repo = Repository.create(db, 'users')
        return repo.get(new ObjectID())
          .should.eventually
          .be.null
      })

      it('when get existing by ObjectID resolves with the document', function () {
        var repo = Repository.create(db, 'users')
        return repo.get(documentId)
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
      })
      
      it('when get existing by string id resolves with the document', function () {
        var repo = Repository.create(db, 'users')
        return repo.get(documentId.toString())
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
      })

      it('when get existing by document with id resolves with the document', function () {
        var repo = Repository.create(db, 'users')
        return repo.get({ _id: documentId })
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
      })

      after(function(done) {
        var repo = Repository.create(db, 'users')
        repo.remove(userDocument).then(function () { done() })
      })
    })

    describe('#getOne', function () {
      var firstName = 'John'
      var documentId
      var userDocument = {
        firstName: firstName,
        lastName: 'Doe',
        email: 'johndoe@test.com',
      }

      before(function (done) {
        var repo = Repository.create(db, 'users')
        repo.add(userDocument).then(function (res) {
          documentId = res._id
          done()
        })
      })

      it('when get non-matching criteria resolves with null', function () {
        var repo = Repository.create(db, 'users')
        return repo.getOne({firstName: 'test'})
          .should.eventually
          .be.null
      })

      it('when get matching resolves with the document', function () {
        var repo = Repository.create(db, 'users')
        return repo.getOne({firstName: firstName})
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
      })
      
      it('when get multiple matching resolves with single document', function () {
        var repo = Repository.create(db, 'users')
        return repo
          .add({ firstName: firstName, lastName: 'test' })
          .then(function (doc) {
            return repo.getOne({ firstName: firstName })
              .then(function (res) {
                return repo.remove(doc)
                  .then(function () { return res })
              })
            })
          .should.eventually
          .have.property('email')
          .that.equal(userDocument.email)
      })

      after(function (done) {
        var repo = Repository.create(db, 'users')
        repo.remove(userDocument).then(function () { done() })
      })
    })

    describe('#getAll', function () {
      var userDocuments = [
        {
          firstName: 'John',
          lastName: 'Doe1',
          email: 'johndoe@test.com',
        },
        {
          firstName: 'John',
          lastName: 'Doe2',
          email: 'johndoe2@test.com',
        }
      ]

      before(function (done) {
        var repo = Repository.create(db, 'users')
        repo.add(userDocuments).then(function (res) {
          userDocuments = res
          done()
        })
      })

      it('when get non-matching resolves with empty array', function () {
        var repo = Repository.create(db, 'users')
        return repo.getAll({ firstName: 'test' })
          .should.eventually.be.empty
      })

      it('when get 2 matches resolves with 2-elements array', function () {
        var repo = Repository.create(db, 'users')
        return repo.getAll({ firstName: 'John' })
          .should.eventually.have.length(2)
      })
      
      it('when sort applied resolves ordered', function () {
        var repo = Repository.create(db, 'users')
        return repo.getAll({ firstName: 'John' }, {lastName: -1})
          .should.eventually
          .have.deep.property('[0].lastName', 'Doe2')
      })

      it('when skip first returns second', function () {
        var repo = Repository.create(db, 'users')
        return repo.getAll({ firstName: 'John' }, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0].lastName', 'Doe2')
      })

      it('when take one returns first', function () {
        var repo = Repository.create(db, 'users')
        return repo.getAll({ firstName: 'John' }, 0, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0].lastName', 'Doe1')
      })

      it('when skip one and take one returns second', function () {
        var repo = Repository.create(db, 'users')
        return repo.getAll({ firstName: 'John' }, 1, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0].lastName', 'Doe2')
      })

      it('when skip one and take one with sort desc by name returns first', function () {
        var repo = Repository.create(db, 'users')
        return repo.getAll({ firstName: 'John' }, {lastName: -1}, 1, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0].lastName', 'Doe1')
      })

      after(function (done) {
        var repo = Repository.create(db, 'users')
        repo.remove(userDocuments[0]).then(function () {
          return repo.remove(userDocuments[1])
        }).then(function () { done() })
      })
    })
  })

  describe('#projecting documents', function () {
    describe('#project', function () {

      var documentId
      var userDocument = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@test.com',
      }

      before(function (done) {
        var repo = Repository.create(db, 'users')
        repo.add(userDocument).then(function (res) {
          documentId = res._id
          done()
        })
      })

      it('when projecting non-existing by ObjectID resolves with null', function () {
        var repo = Repository.create(db, 'users')
        return repo.project(new ObjectID(), {firstName: 1})
          .should.eventually
          .be.null
      })

      it('when projecting existing by ObjectID resolves with the document projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.project(documentId, {_id: 0, firstName: 1})
          .should.eventually
          .deep.equal({firstName: userDocument.firstName})
      })

      it('when get existing by string id resolves with the document projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.project(documentId.toString(), { _id: 0, firstName: 1 })
          .should.eventually
          .deep.equal({ firstName: userDocument.firstName })
      })

      it('when get existing by document with id resolves with the document projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.project({_id: documentId}, { _id: 0, firstName: 1 })
          .should.eventually
          .deep.equal({ firstName: userDocument.firstName })
      })

      after(function (done) {
        var repo = Repository.create(db, 'users')
        repo.remove(userDocument).then(function () { done() })
      })
    })

    describe('#projectOne', function () {
      var firstName = 'John'
      var documentId
      var userDocument = {
        firstName: firstName,
        lastName: 'Doe',
        email: 'johndoe@test.com',
      }

      before(function (done) {
        var repo = Repository.create(db, 'users')
        repo.add(userDocument).then(function (res) {
          documentId = res._id
          done()
        })
      })

      it('when project non-matching criteria resolves with null', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectOne({ firstName: 'test' }, {_id: 0, firstName: 1})
          .should.eventually
          .be.null
      })

      it('when project matching resolves with the document projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectOne({ firstName: firstName }, { _id: 0, firstName: 1 })
          .should.eventually
          .deep.equal({firstName: userDocument.firstName})
      })

      it('when project multiple matching resolves with single document projection', function () {
        var repo = Repository.create(db, 'users')
        return repo
          .add({ firstName: firstName, lastName: 'test' })
          .then(function (doc) {
          return repo.projectOne({ firstName: firstName }, { _id: 0, firstName: 1 })
           .then(function (res) {
              return repo.remove(doc)
                .then(function () { return res })
            })
          })
          .should.eventually
          .deep.equal({ firstName: userDocument.firstName })
      })
      
      after(function (done) {
        var repo = Repository.create(db, 'users')
        repo.remove(userDocument).then(function () { done() })
      })
    })

    describe('#projectAll', function () {
      var userDocuments = [
        {
          firstName: 'John',
          lastName: 'Doe1',
          email: 'johndoe@test.com',
        },
        {
          firstName: 'John',
          lastName: 'Doe2',
          email: 'johndoe2@test.com',
        }
      ]
      
      before(function (done) {
        var repo = Repository.create(db, 'users')
        repo.add(userDocuments).then(function (res) {
          userDocuments = res
          done()
        })
      })

      it('when project non-matching resolves with empty array', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectAll({ firstName: 'test' }, {_id: 0, firstName: 1})
          .should.eventually.be.empty
      })

      it('when project 2 matches resolves with 2-elements array projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectAll({ firstName: 'John' }, { _id: 0, firstName: 1 })
          .should.eventually.have.length(2)
      })

      it('when sort applied resolves ordered projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectAll({ firstName: 'John' }, { _id: 0, lastName: 1}, { lastName: -1 })
          .should.eventually
          .have.deep.property('[0]')
          .that.deep.equal({lastName: 'Doe2'})
      })
      
      it('when skip first returns second projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectAll({ firstName: 'John' }, { _id: 0, lastName: 1 }, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0]')
          .that.deep.equal({ lastName: 'Doe2' })
      })
      
      it('when take one returns first projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectAll({ firstName: 'John' }, { _id: 0, lastName: 1 }, 0, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0]')
          .that.deep.equal({ lastName: 'Doe1' })
      })
      
      it('when skip one and take one returns second projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectAll({ firstName: 'John' }, { _id: 0, lastName: 1 }, 1, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0]')
          .that.deep.equal({ lastName: 'Doe2' })
      })
      
      it('when skip one and take one with sort desc by name returns first projection', function () {
        var repo = Repository.create(db, 'users')
        return repo.projectAll({ firstName: 'John' }, { _id: 0, lastName: 1}, { lastName: -1 }, 1, 1)
          .should.eventually
          .have.length(1)
          .and
          .have.deep.property('[0]')
          .that.deep.equal({ lastName: 'Doe1' })
      })

      after(function (done) {
        var repo = Repository.create(db, 'users')
        repo.remove(userDocuments[0]).then(function () {
          return repo.remove(userDocuments[1])
        }).then(function () { done() })
      })
    })
  })

  describe('#adding documents', function () {
    describe('#add', function () {

      before(function () {
        db.collection('points').drop()
      })

      it('when add returns the document with _id property', function () {
        var document = { x: 1, y: 2 }
        var repo = Repository.create(db, 'points')
        return repo.add(document)
          .should.eventually.have.property('_id')
      })

      it('when add can be queried', function () {
        var document = { x: 1, y: 2 }
        var repo = Repository.create(db, 'points')
        return repo.add(document)
          .then(function (doc) {
            return repo.get(doc)
              .should.eventually.deep.equal(doc)
          })
      })

      it('when add an array returns an array of documents', function () {
        var document1 = { x: 1, y: 2 }
        var document2 = { x: 3, y: 4 }
        var repo = Repository.create(db, 'points')
        return repo.add([document1, document2])
          .should.eventually.have.length(2)
      })

      after(function () {
        db.collection('points').drop()
      })
    })

    describe('#addOrUpdate', function () {
      before(function () { 
        db.collection('names').drop()
      })

      it('when doesn\'t exist returns the id of added doc', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test' }
        return repo.addOrUpdate(doc)
          .should.eventually
          .satisfy(function (x) { return x.toString() === doc._id.toString() })
      })

      it('when doesn\'t exist then is added', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test' }
        return repo.addOrUpdate(doc).then(function (res) { 
          return repo.getAll(doc).should.eventually.have.length(1)
        })
      })

      it('when exists then is not added', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test', x: 1 }
        return repo.add(doc).then(function (res) {
          return repo.addOrUpdate({_id: doc._id, name: 'test2', x: 1})
            .then(function () { return repo.getAll({x: 1}) })
            .should.eventually.have.length(1)
        })
      })

      it('when exists then is updated', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test' }
        return repo
          .add(doc)
          .then(function (res) {
            return repo.addOrUpdate({ _id: doc._id, name: 'test2' })
          })
          .then(function () { return repo.get(doc) })
          .should.eventually.have.property('name', 'test2')
      })

      it('when is updated resolves with null', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test' }
        return repo
          .add(doc)
          .then(function (res) {
            return repo.addOrUpdate({ _id: doc._id, name: 'test2' })
          })
          .should.eventually.be.null
      })

      after(function () {
        db.collection('names').drop()
      })
    })

    describe('#addOrUpdateAll', function () { 
      before(function () {
        db.collection('names').drop()
      })

      it('when doesn\'t exist returns the id of added doc', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test' }
        return repo.addOrUpdateAll({_id: doc._id}, doc)
          .should.eventually
          .satisfy(function (x) { return x.toString() === doc._id.toString() })
      })

      it('when doesn\'t exist then is added', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test' }
        return repo.addOrUpdateAll({ _id: doc._id }, doc).then(function (res) {
          return repo.getAll(doc).should.eventually.have.length(1)
        })
      })

      it('when exists then is not added', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test', x: 99 }
        return repo.add(doc).then(function (res) {
          return repo.addOrUpdateAll({name: 'test', x: 99}, { name: 'test2'})
            .then(function () { return repo.getAll({ x: 99 }) })
            .should.eventually.have.length(1)
        })
      })

      it('when exists then updates all', function () {
        var repo = Repository.create(db, 'names')
        var docs = [
          { _id: new ObjectID(), name: 'test', x: 2 },
          { _id: new ObjectID(), name: 'test', x: 2 }]
          return repo
            .add(docs)
            .then(function (res) {
            return repo.addOrUpdateAll({name: 'test'}, { name: 'test2' })
          })
          .then(function () { return repo.getAll({x: 2}) })
          .should.eventually.have.length(2)
          .and
          .satisfy(function (arr) { 
            return arr[0].name === arr[1].name && 
              arr[0].name === 'test2'
          })
      })

      it('when is updated resolves with null', function () {
        var repo = Repository.create(db, 'names')
        var doc = { _id: new ObjectID(), name: 'test' }
        return repo
          .add(doc)
          .then(function (res) {
            return repo.addOrUpdateAll({ name: 'test'}, { name: 'test2' })
          })
          .should.eventually.be.null
      })

      after(function () {
        db.collection('names').drop()
      })
    })
  })

  describe('#updating documents', function () {
    describe('#update', function () {
      var points
      before(function () {
        db.collection('points').drop()

        points = [{ x: 1, y: 2 }, { x: 1, y: 3 }]
        var repo = Repository.create(db, 'points')
        return repo.add(points).then(function (res) { points = res })
      })

      it('returns null', function () { 
        var repo = Repository.create(db, 'points')
        return repo.update({_id: new ObjectID(), x: 5})
          .should.eventually.be.null
      })

      it('when exists then is updated', function () {
        var repo = Repository.create(db, 'points')
        return repo.update({ _id: points[0]._id, y: 2, z: 101 })
          .then(function () { return repo.project(points[0], {_id: 0, z: 1}) })
          .should.eventually.deep.equal({z: 101})
      })
    })

    describe('#updateAll', function () {
      var points
      before(function () {
        db.collection('points').drop()

        points = [{ x: 1, y: 2 }, { x: 1, y: 3 }]
        var repo = Repository.create(db, 'points')
        return repo.add(points).then(function (res) { points = res })
      })

      it('returns null', function () {
        var repo = Repository.create(db, 'points')
        return repo.updateAll({_id: new ObjectID()}, { x: 5 })
          .should.eventually.be.null
      })

      it('when exists updates all', function () {
        var repo = Repository.create(db, 'points')
        return repo.updateAll({ x: 1 }, { y: 99 })
          .then(function () { return repo.count({y: 99}) })
          .should.eventually.equal(2)
      })
    })

    after(function () {
      db.collection('points').drop()
    })
  })

  describe('#removing documents', function () {
    var points
    before(function () {
      db.collection('points').drop()

      points = [{ x: 1, y: 2 }, { x: 1, y: 3 }]
      var repo = Repository.create(db, 'points')
      return repo.add(points).then(function (res) { points = res })
    })

    describe('#remove', function () {
      it('when non-matching criteria then collection not modified', function () {
        var repo = Repository.create(db, 'points')
        return repo.remove(new ObjectID())
          .then(function () { return repo.count() })
          .should.eventually.equal(points.length)
      })
      it('when exists then is removed', function () { 
        var p = {_id: new ObjectID(), x: 100}
        var repo = Repository.create(db, 'points')
        return repo.add(p)
          .then(function () { return repo.remove(p) })
          .then(function () { return repo.count() })
          .should.eventually.equal(points.length)
      })
    })

    describe('#removeAll', function () {
      it('when non-matching criteria then collection not modified', function () { 
        var repo = Repository.create(db, 'points')
        return repo.removeAll({fake: 'data'})
          .then(function () { return repo.count() })
          .should.eventually.equal(points.length)
      })
      it('when exists many then removes all matching', function () { 
        var repo = Repository.create(db, 'points')
        return repo.removeAll({ x: 1 })
          .then(function () { return repo.count() })
          .should.eventually.equal(0)
      })
    })

    after(function () {
      db.collection('points').drop()
    })
  })

  after(function() {
    if (db) db.close()
    db = null
  })
})