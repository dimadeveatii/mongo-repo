# mongo-repo
Fast, lightweight, promise like repository implementation over mongodb.<br/>
Defines a clear api to perform CRUD operations over a mongodb collection. All repository methods returns promises.<br/> 
The *connectDB(connectionString)* method resolves with a database object that is a MongoClient with an extended functionallity to access a collection as a repository: *db.repo(collectionName)*. 

```javascript
var repo = require('mongo-repo');

var db
repo.connectDB('my connection string').then(function(client){
  db = client
}).then(run)

function run(){
  db.repo('users').add({ userName: 'JohnDoe', createdOn: db.$currentDate()})
    .then(function(user){
      console.log('Added user with id: ' + user._id)
      
      // count all documents
      return db.repo('users').count()
    })
    .then(function(n){
      console.log('Total users now: ' + n)
      
      // get the document
      return db.repo('users')
        .getOne({userName: 'JohnDoe'})
    })
    .then(function(user){
      // update the document
      return db.repo('users')
        .update({_id: user._id, userName: 'Joe', modified: db.$currentDate()})
    })
    .then(function(){
      // delete the document
      return db.repo('users')
        .removeOne({userName: 'Joe'})
    })
}
```

The repository object is a thin wrapper over mongodb collections, that is lazily created only once per request. The database object is also extended with operators like db.$inc(), db.$mul() etc. that can be used to pass update instructions in a cleaner way, rather then  native mongo dot notation. For more details about mongodb update operators see [mongo-dot-notation](https://github.com/dimadeveatii/mongo-dot-notation).

### Installation
Install from npm:
```javascript
npm install mongo-repo --save
```

### Connecting to DB and accesing the repository
A db client that exposes repositories can be connected using the *connectDB* method.
```javascript
var Repository = require('mongo-repo')
Repository.connectDB('your connection string...').then(function(db){
  // access a repository
  var repo = db.repo('my_collection_name')
})
```
Alternatively, you can manyally create a repository instance:
```javascript
var MongoClient = require('mongodb').MongoClient;

var url = 'mongodb://localhost:27017/mydatabase';
MongoClient.connect(url, function(err, db) {
  var repo = Repository.create(db.collection('my_collection_name'))
}) 
```
### Methods
CRUD methods are divided into 3 categories:
* CRUD by id/document
```javascript
// Get the document by id
// @document - either an ObjectID, a valid string representation of an ObjectID
//            or an abject with _id field
db.repo(collectionName).get(document) 

// Get a subset of document's fields by id
// @document - either an ObjectID, a valid string representation of an ObjectID
//            or an abject with _id field
// @projection - an object specifying which fields to get
db.repo(collectionName).project(document, projection)

// Add a new document; this method always produces inserts
// @document - the document to be inserted
db.repo(collectionName).add(document) 

// Adds or updates a new document; when the object exists then is updated, otherwise inserted.
// @document - the document to be inserted or updated
db.repo(collectionName).addOrUpdate(document) 

// update a document only if exists
// @document - an object identified by _id field (mandatory) and fields to update
db.repo(collectionName).update(document)

// delete a document
// @document - either an ObjectID, a valid string representation of an ObjectID
//            or an abject with _id field
db.repo(collectionName).remove(document)
```

* CRUD only one
```javascript
// Get the first document that matches the criteria
// @criteria - same style as used by mongo
db.repo(collectionName).getOne(criteria) 

// Get a subset of the (first) document's fields that matches the criteria
// @criteria - same style as used by mongo
// @projection - an object specifying which fields to get
db.repo(collectionName).projectOne(criteria, projection)

// update only first document that matches the criteria
// @criteria - same style as used by mongo
// @document - an object with fields to update
db.repo(collectionName).updateOne(criteria, document)

// deletes the first document that matches the criteria
// @criteria - same style as used by mongo
db.repo(collectionName).removeOne(criteria)
```

* CRUD multiple
```javascript

// gets all documents matching the criteria
// @criteria - same style as used by mongo
// @sort (optional) - an object specifying by which fields to sort 
// @skip (otional) - an int specifying how many documents to skip from the beggining
// @take (optional) - an int specifying how many documents to take
db.getAll(criteria, sort, skip, take)

// gets a subset of fields for all documents matching the criteria
// @criteria - same style as used by mongo
// @projection - an object specifying which fields to get
// @sort (optional) - an object specifying by which fields to sort 
// @skip (otional) - an int specifying how many documents to skip from the beggining
// @take (optional) - an int specifying how many documents to take
db.projectAll(criteria, projection, sort, skip, take)

// adds the document if there are no matches for the criteria,
// otherwise updates all documents that matches the criteria
// @criteria - same style as used by mongo
// @document - an object with fields to update
db.addOrUpdateAll(criteria, document)

// updates all documents that matches the criteria
// @criteria - same style as used by mongo
// @document - an object with fields to update
db.updateAll(criteria, document)

// deletes all documents that matches the criteria
// @criteria (optional) - same style as used by mongo
db.removeAll(criteria)
```

Additionally, there is a count method.
```javascript
// @criteria (optional) - same style as used by mongo
db.repo(collectionName).count(criteria)
```

### More examples
Getting all IDs of the users with age >= 25.
```javascript
db.repo('my_collection').projectAll({age: {$gte: 25}}, {_id: 1})
  .then(function(ids){ console.log(ids) })
```

Updating a document using operators.
```javascript
var documentId;
db.repo('my_collection').update({
  _id: documentId,
  visits: db.$inc(), // increment the field
  name: db.$rename('fullName'), // renames the field from name to fullName
  blocked: db.$unset() // deletes the field from the document
  updatedOn: db.$currentDate() // sets the current date
})
```

Add or update a document:
```javascript
var doc = {
  _id: db.$newid(),
  name: 'johndoe',
  createdOn: db.$setOnInsert(new Date())
}

db.repo('users').addOrUpdate(doc).then(function(res){
  console.log(res) // {_id: '...', name: 'johndoe', createdOn: '...'}
}).then(function(){
  return db.repo('users').addOrUpdate({_id: doc._id, email: 'john@doe.com'})
}).then(function(){
  return db.repo('users').get(doc)
}).then(function(res){
  console.log(res) // {_id: '...', name: 'johndoe', createdOn: '...', email: 'john@doe.test'}
})
```

> Copyright © 2015 Dumitru Deveatii, released under the MIT license
