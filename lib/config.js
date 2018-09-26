var fs = require('fs');
var decomment = require('decomment');
var log = require('./log');

const configFile = '/translations.json';

module.exports = {
    /**
     * Responsible for parsing configuration file
     * @param {parseCallback} cb - Callback
     */
    parse: function (cb) {
        fs.readFile(configFile, function (err, data) {
            if (err)
                throw err;

            var res = {
                'translations': []
            };
            try {
                res = JSON.parse(decomment(data.toString()));
            } catch (e) {
                log.error('Problem while parsing your configuration file:', e.message);
            }

            return cb(res);
        });
    }
    /**
     * @callback parseCallback
     * @param {Object} config - Configuration file as an object
     */
};
