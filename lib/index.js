'use strict'

var when = require('when')
var dot = require('mongo-dot-notation')

var ObjectID = require('mongodb').ObjectID

var ID_FIELD_NAME = '_id'

module.exports.Operators = dot.Operators

module.exports.create = function (db, collectionName, useDocStyle) {
  return new Repository(db, collectionName)
}

function Repository(db, collectionName, useDocStyle){
  if (!db)
    throw new Error('Missing argument db.')

  if (!collectionName)
    throw new Error('Missing argument collectionName.')

  this.name = collectionName
  this.useDocStyle = typeof(useDocStyle) === 'undefined' ? true : !!useDocStyle
  this._collection = db.collection(collectionName)
}

Repository.prototype.get = function (documentId) {
  var criteria = searchByIdCriteria(documentId)
  if (!criteria) return when.reject('Missing argument id.')

  return this.getOne(criteria)
}

Repository.prototype.getOne = function (criteria) {
  return this.projectOne(criteria)
}

Repository.prototype.getAll = function (criteria, sort, skip, take) {
  return this.projectAll(criteria, null, sort, skip, take)
}

Repository.prototype.project = function (documentId, projection) {
  var criteria = searchByIdCriteria(documentId)
  if (!criteria) return when.reject('Missing argument id.')

  return this.projectOne(criteria, projection)
}

Repository.prototype.projectOne = function (criteria, projection) {
  var self = this

  return when.promise(function (resolve, reject) {
    self._collection.findOne(
      criteria,
      projection,
      queryResultHandler(resolve, reject))
  })
}

Repository.prototype.projectAll = function (criteria, projection, sort, skip, take) {
  var self = this

  criteria = criteria || {}

  if (typeof (sort) !== 'object') {
    take = skip
    skip = sort
    sort = null
  }

  return when.promise(function (resolve, reject) {
    var query = projection ? 
      self._collection.find(criteria, projection) : 
      self._collection.find(criteria)
    if (sort) query = query.sort(sort)
    if (!isNaN(skip)) query = query.skip(skip)
    if (!isNaN(take)) query = query.limit(take)
    
    query.toArray(queryResultHandler(resolve, reject))
  })
}

Repository.prototype.add = function (document) {
  var self = this

  return when.promise(function (resolve, reject) {
    self._collection.insert(
      document,
      Array.isArray(document) ? 
        addResultHandler(resolve, reject) :
        addSingleResultHandler(resolve, reject))
  })
}

Repository.prototype.addOrUpdate = function (documentId, document) {
  if (isDocument(documentId)) {
    document = documentId
    documentId = document[ID_FIELD_NAME]
  }
  
  var criteria = searchByIdCriteria(documentId)
  if (!criteria) return when.reject('Missing argument id.')

  if (!document)
    return when.reject(new Error('Missing parameter document.'))

  return update(this, criteria, document, true, false)
}

Repository.prototype.addOrUpdateAll = function (criteria, document) {
  return update(this, criteria, document, true, true)
}

Repository.prototype.update = function (documentId, document) {
  if (isDocument(documentId)) {
    document = documentId
    documentId = document[ID_FIELD_NAME]
  }

  if (!documentId || !document)
    return when.reject(new Error('Missing parameter document.'))

  var criteria = searchByIdCriteria(documentId)
  if (!criteria) return when.reject('Missing argument id.')

  return update(this, criteria, document, false, false)
}

Repository.prototype.updateAll = function (criteria, document) {
  return update(this, criteria, document, false, true)
}

Repository.prototype.remove = function (documentId) {
  var criteria = searchByIdCriteria(documentId)
  if (!criteria) return when.reject('Missing argument id.')

  return remove(this, criteria, true)
}

Repository.prototype.removeAll = function (criteria) {
  return remove(this, criteria, false)
}

Repository.prototype.count = function (criteria) {
  var self = this

  return when.promise(function (resolve, reject) {
    self._collection
      .find(criteria)
      .count(queryResultHandler(resolve, reject))
  })
}

function update(self, criteria, document, upsert, multi){
  if (!criteria)
    return when.reject(new Error('Missing update criteria.'))
  if (!document)
    return when.reject(new Error('Missing document parameter.'))

  try {
    document = self.useDocStyle ? dot.flatten(document) : document
    if (document.$set)
      delete document.$set[ID_FIELD_NAME]
  }
  catch (e) {
    return when.reject(e)
  }

  return when.promise(function (resolve, reject) {
    self._collection.update(
      criteria, 
      document,
      { upsert: upsert, multi: multi },
      function (err, res) {
        if (err) return reject(err)
        if (res.result && Array.isArray(res.result.upserted) 
            && res.result.upserted.length) {
          return resolve(res.result.upserted[0]._id)
        }

        return resolve(null)
      })
  })
}

function remove(self, criteria, justOne){
  return when.promise(function (resolve, reject) {
    self._collection.remove(
      criteria, 
      { justOne: justOne },
      function (err, res) {
        if (err) return reject(err)
        resolve(res.result && res.result.n)
      }
    )
  })
}

function queryResultHandler(resolve, reject) {
  return function (err, res) {
    if (err) return reject(err)
    return resolve(res)
  }
}

function addSingleResultHandler(resolve, reject) {
  return function (err, res) {
    if (err) return reject(err)
    if (!Array.isArray(res.ops) || !res.ops.length)
      return resolve(null)

    return resolve(res.ops[0])
  }
}

function addResultHandler(resolve, reject) {
  return function (err, res) {
    if (err) return reject(err)
    if (!Array.isArray(res.ops))
      return resolve([])
    
    return resolve(res.ops)
  }
}

function searchByIdCriteria(documentId){
  if (!documentId) return null

  if (documentId instanceof ObjectID) {
    var criteria = {}
    criteria[ID_FIELD_NAME] = documentId
    return criteria
  }

  if (typeof (documentId) === 'string') {
    var criteria = {}
    criteria[ID_FIELD_NAME] = new ObjectID(documentId)
    return criteria
  }

  if (isDocument(documentId)) {
    var criteria = {}
    criteria[ID_FIELD_NAME] = documentId[ID_FIELD_NAME]
    return criteria
  }

  return null
}

function isDocument(document){
  return !!document && document.hasOwnProperty(ID_FIELD_NAME)
}