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
        .update(user, {userName: 'Joe', modified: db.$currentDate()})
    })
    .then(function(user){
      // delete documents
      return db.repo('users')
        .removeAll({userName: 'Joe'})
    })
}
```

The repository object is a thin wrapper over mongodb collections, that is lazily created only once per request. The database object is also extended with operators like db.$inc(), db.$mul() etc. that can be used to pass update instructions in a cleaner way, rather then  native mongo dot notation. For more details about mongodb update operators see [mongo-dot-notation](https://github.com/dimadeveatii/mongo-dot-notation).

// TODO: under development
