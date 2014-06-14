// Inserts entity. Invokes callback(error) when done.
module.exports.insert = function (entity, callback) {
    var tableService = getTableService();
    createTableIfNotExists(tableService, function(error) {
        if (error) {
            callback(error);
            return;
        }

        tableService.insertEntity('journey', entity, function (error) {
            if (error) {
                callback(error);
                return;
            }
            callback(null);
        });
    });
};

// Deletes entity. Invokes callback(error) when done.
module.exports.delete = function (entity, callback) {
    var tableService = getTableService();
    tableService.deleteEntity('journey', { PartitionKey: entity.PartitionKey, RowKey: entity.RowKey }, function (error) {
        if (error) {
            callback(error);
            return;
        }
        callback(null);
    });
};

// Returns entities from query. Invokes callback(error, entities) when done.
module.exports.get = function(query, callback) {
    var tableService = getTableService();
    createTableIfNotExists(tableService, function(error) {
        if (error) {
            callback(error);
            return;
        }

        // get
        tableService.queryEntities(query, function (error, entities) {
            if (error) {
                callback(error);
                return;
            }
            callback(null, entities);
        });
    });
}

var createTableIfNotExists = function(tableService, callback) {
    tableService.createTableIfNotExists('journey', function(error) {
        if (error) {
            callback(error);
            return;
        }
        callback(null);
    });
};

var getTableService = function () {
    var azure = require('azure');

    // The NTVS can't see the AppSettings, so if null, must be debugging, use Development Storage
    var tableService = process.env.StorageAccountName === undefined
                       ? azure.createTableService("devstoreaccount1",
                                                   "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==",
                                                   "127.0.0.1:10002")
                       : azure.createTableService(process.env.StorageAccountName,
                                                   process.env.StorageAccountKey,
                                                   process.env.StorageAccountTableStoreHost);
    return tableService;
};
