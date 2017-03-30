var fs = require('fs');
var log = require('./log');

const configFile = '/translations.json';

module.exports = {
    /**
     * Responsible for parsing configuration file
     * @param {parseCallback} cb - Callback
     */
    parse: function(cb) {
        fs.readFile(configFile, function (err, data) {
            if (err)
                throw err;

            return cb(JSON.parse(data.toString()));
        });
    }
    /**
     * @callback parseCallback
     * @param {Object} config - Configuration file as an object
     */
};
