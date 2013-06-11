var util = require('util');
var oracle = require('oracle');
var mongodb = require('mongodb');
var async = require('async');


var ORACLE_SETTINGS = {
  "hostname": process.env.ORACLE_HOSTNAME,
  "database": process.env.ORACLE_DATABASE,
  "user":     process.env.ORACLE_USER,
  "password": process.env.ORACLE_PASSWORD,
  "port":     process.env.ORACLE_PORT
};

var handleError = function (err, cb, dbClient) {
  // if theres an error, log it, clean up and return the error to the client
  if (err) {
    console.error('handleError err:', err);
    try {
      dbClient.close();
    } catch (e) {
      // fail silently, db might have been disconnected as a result of the error
    }
    // ensure we send error back to client
    return cb(err);
  }
};

/*
 * Get all entries/rows in the configured Oracle Database Table
 */
exports.selectOracle = function(params, callback) {
  console.log('selectOracle');
  // connect to db
  var connectStartTime = new Date();
  oracle.connect(ORACLE_SETTINGS, function(err, connection) {
    handleError(err, callback, connection);
    console.log('selectOracle connected');
    $fh.stats.timing('oracle_connect_time', Date.now() - connectStartTime);
    // execute select statement to get all rows
    var selectStartTime = new Date();
    connection.execute("SELECT * FROM " + process.env.ORACLE_TABLE, [], function(err, results) {
      handleError(err, callback, connection);
      var execTime = Date.now() - selectStartTime;
      $fh.stats.timing('oracle_select_time', execTime);
      $fh.stats.timing('oracle_execute_time', execTime);
      connection.close();
      console.log('selectOracle success results.length:', results.length);
      return callback (null, results);
    });
  });
};

/*
 * Import data into Oracle
 * @params.list array of entries to import into the configured Oracle Database Table 
 */
exports.importOracle = function (params, callback) {
  console.log('importOracle');
  // look for array of items to import
  var list = params.list;
  if (list == null || list.length < 1) handleError('missing "list" entries in parameters', callback, null);
  console.log('importOracle list.length:', list.length);
  // connect to oracle
  var connectStartTime = new Date();
  oracle.connect(ORACLE_SETTINGS, function(err, connection) {
    handleError(err, callback, connection);
    console.log('importOracle connected');
    $fh.stats.timing('oracle_connect_time', Date.now() - connectStartTime);
    // iterate over list items, inserting each into the db table
    async.mapSeries(list, function (item, cb) {
      console.log('importOracle mapSeries item:', item);
      var stmt = 'INSERT INTO ' + process.env.ORACLE_TABLE + ' VALUES (:1, :2, :3, :4, :5)';
      var itemVals = [
        item['Team'],
        item['Stadium'],
        item['Web Site'],
        item['League'],
        item['Last World Series Win']
      ];
      console.log('importOracle connection.execute stmt:', stmt, 'itemVals:', itemVals);
      var insertStartTime = new Date();
      connection.execute(stmt, itemVals, function(err, results) {
        if (!err) {
          var execTime = Date.now() - insertStartTime
          $fh.stats.timing('oracle_insert_time', execTime);
          $fh.stats.timing('oracle_execute_time', execTime);
        }
        cb(err, results);
      });
    }, function (err, results) {
      handleError(err, callback, connection);
      connection.close();
      console.log('importOracle success results.length:', results.length);
      return callback(null, results);
    });
  });
};

exports.copyOracleToMongoDB = function (params, callback) {
  console.log('copyOracleToMongoDB');
  // get all oracle db table rows
  exports.selectOracle({}, function (err, results) {
    handleError(err, callback, null);
    if (results == null || results.length < 1) handleError('No rows found in Oracle DB Table', callback, null);
    var mongoEntriesToAdd = [];
    console.log('copyOracleToMongoDB mapping oracle rows to mongo docs');
    async.map(results, function (row) {
      mongoEntriesToAdd.push({
        'Team': row['TEAM'],
        'Stadium': row['STADIUM'],
        'Web Site': row['WEB_SITE'],
        'League': row['LEAGUE'],
        'Last World Series Win': row['LAST_WORLD_SERIES_WIN']
      });
    }, function (err, res) {
      handleError(err, callback, null);
      importMongoDB({
        list: mongoEntriesToAdd
      }, function (err, res2) {
        handleError(err, callback, null);
        console.log('copyOracleToMongoDB success res2:', res2);
      });
    });
  });
};

exports.copyMongoDBToOracle = function (params, callback) {
  console.log('copyMongoDBToOracle');
  // get all mongo db table rows
  exports.selectMongoDB({}, function (err, results) {
    handleError(err, callback, null);
    if (results == null || results.length < 1) handleError('No documents found in Mongo DB collection', callback, null);
    var oracleEntriesToAdd = [];
    console.log('copyMongoDBToOracle mapping mongo docs to oracle rows');
    async.map(results, function (row) {
      oracleEntriesToAdd.push({
        'Team': row['Team'],
        'Stadium': row['Stadium'],
        'Web Site': row['Web Site'],
        'League': row['League'],
        'Last World Series Win': row['Last World Series Win']
      });
    }, function (err, res) {
      handleError(err, callback, null);
      importOracle({
        list: oracleEntriesToAdd
      }, function (err, res2) {
        handleError(err, callback, null);
        console.log('copyMongoDBToOracle success res2:', res2);
      });
    });
  });
};

/*
 * Get all entries/documents in the configured mongo database collection
 */
exports.selectMongoDB = function (params, callback) {
  console.log('selectMongoDB');
  // create mongo db client
  var client = new mongodb.Db(process.env.MONGODB_DATABASE, new mongodb.Server(process.env.MONGODB_HOSTNAME, process.env.MONGODB_PORT, {}), {
    w: 1
  });
  console.log('selectMongoDB client created');

  // open connection to db
  var openStartTime = new Date();
  client.open(function (err) {
    handleError(err, callback, client);
    console.log('selectMongoDB open');
    $fh.stats.timing('mongo_open_time', Date.now() - openStartTime);
    // authenticate with user/pass
    client.authenticate(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, function (err, res) {
      handleError(err, callback, client);
      console.log('selectMongoDB auth res:', res);
      // get collection we're interested in
      client.collection(process.env.MONGODB_COLLECTION, function (err, collection) {
        handleError(err, callback, client);
        console.log('selectMongoDB got collection');
        // find all entries in this collection
        var findStartTime = new Date();
        collection.find({}, function (err, cursor) {
          handleError(err, callback, client);
          console.log('selectMongoDB got cursor');
          var queryTime = Date.now() - findStartTime;
          $fh.stats.timing('mongo_find_time', queryTime);
          $fh.stats.timing('mongo_query_time', queryTime);
          // convert result cursor to an array
          cursor.toArray(function (err, docs) {
            handleError(err, callback, client);
            client.close();
            console.log('selectMongoDB success docs.length:', docs.length);
            return callback(null, docs);
          });
        });
      });
    });
  });
};

/*
 * Import data into mongodb
 * @params.list array of entries to import into the configured mongo database collection 
 */
exports.importMongoDB = function (params, callback) {
  console.log('importMongoDB');
  var list = params.list;
  if (list == null || list.length < 1) handleError('missing "list" entries in parameters', callback, null);
  console.log('importMongoDB list.length:', list.length);

  // create mongo db client
  var client = new mongodb.Db(process.env.MONGODB_DATABASE, new mongodb.Server(process.env.MONGODB_HOSTNAME, process.env.MONGODB_PORT, {}), {
    w: 1
  });
  console.log('selectMongoDB client created');

  // open connection to db
  var openStartTime = new Date();
  client.open(function (err) {
    handleError(err, callback, client);
    console.log('importMongoDB open');
    $fh.stats.timing('mongo_open_time', Date.now() - openStartTime);
    // authenticate with user/pass
    client.authenticate(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, function (err, res) {
      handleError(err, callback, client);
      console.log('importMongoDB auth res:', res);
      // get collection we're interested in
      client.collection(process.env.MONGODB_COLLECTION, function (err, collection) {
        handleError(err, callback, client);
        console.log('importMongoDB got collection');
        // insert entries into the collection
        var insertStartTime = new Date();
        collection.insert(list, {
          keepGoing:true
        }, function (err, result) {
          handleError(err, callback, client);
          client.close();
          console.log('importMongoDB success result:', result);
          var queryTime = Date.now() - insertStartTime;
          $fh.stats.timing('mongo_insert_time', queryTime);
          $fh.stats.timing('mongo_query_time', queryTime);
          return callback(null, result);
        });
      });
    });
  });
};