var util = require('util');
var oracle = require('oracle');
var mongodb = require('mongodb');
        

/* main.js
 * All calls here are publicly exposed as REST API endpoints.
 * - all parameters must be passed in a single JSON paramater.
 * - the return 'callback' method signature is 'callback (error, data)', where 'data' is a JSON object.
*/

/* 'getConfig' server side REST API method.
 * Trivial example of pulling in a shared config file.
 */
exports.getConfig = function(params, callback) {
  console.log("In getConfig() call");
  var cfg = require("config.js");
  return callback(null, {config: cfg.config});
};

var settings = {
  "hostname": process.env.ORACLE_HOSTNAME,
  "database": process.env.ORACLE_DATABASE,
  "user":     process.env.ORACLE_USER,
  "password": process.env.ORACLE_PASSWORD,
  "port":     process.env.ORACLE_PORT
};

// Simple oracle select statement
exports.selectOracle = function(params, callback) {
  oracle.connect(settings, function(err, connection) {
    if(err) return callback(err);
    connection.execute("SELECT * FROM INTEGRATION_TEST_ORACLE_01", [], function(err, results) {
      if(err) return callback(err);
      return callback (null, results);
    });
  });
};

exports.selectMongoDB = function (params, callback) {
  var client = new mongodb.Db(process.env.MONGODB_DATABASE, new mongodb.Server(process.env.MONGODB_HOSTNAME, process.env.MONGODB_PORT, {}), {
    w: 1
  });

  var handleErr = function (err) {
    console.error(err);
    try {
      client.close();
    } catch (e) {
      // fail silently
    }
    return callback(err);
  };

  client.open(function (err) {
    if (err) return handleErr(err);
    client.authenticate(process.env.MONGODB_USER, process.env.MONGODB_PASSWORD, function (err, res) {
      if (err) return handleErr(err);
      client.collection('integration_test_mongodb_01', function (err, collection) {
        if (err) return handleErr(err);
        collection.find({}, function (err, cursor) {
          if (err) return handleErr(err);
          cursor.toArray(function (err, docs) {
            if (err) return handleErr(err);
            return callback(null, docs);
          });
        });
      });
    });
  });
};