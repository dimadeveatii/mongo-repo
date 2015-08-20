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

  after(function() {
    if (db) db.close()
    db = null
  })
})