var http = require('http');
var https = require('https');

var log = require('./log');

const varPrefix = ':';
const varRegex = varPrefix +'[a-z|_|\-|.]+';

/** -----
 * Translate URL according to Gitlab request body
 * @param {string} url - URL to translate
 * @param {Object} gitlabBody - Request body from Gitlab
 */
function translateUrl (url, gitlabBody) {
    var regex = new RegExp(varRegex, 'g', 'i');
    var matches = url.match(regex);

    var i = 0;
    for (; i < matches.length; i++) {
        url = url.replace(matches[i], eval('gitlabBody.'+ matches[i].substring(1)));
    }

    return url;
}

/** -----
 * Translate body according to Gitlab request body
 * @param {Object} body - Body to translate
 * @param {Object} gitlabBody - Request body from Gitlab
 */
function translateBody (body, gitlabBody) {
    body = JSON.stringify(body);

    var regex = new RegExp(varRegex, 'g', 'i');
    var matches = body.match(regex);

    var i = 0;
    for (; i < matches.length; i++) {
        var value = eval('gitlabBody.'+ matches[i].substring(1));

        if (typeof value === 'object') {
            value = JSON.stringify(value);
            body = body.replace('"'+ matches[i] +'"', value);
        } else {
            body = body.replace(matches[i], value);
        }
    }

    //todo: :__original-data__ keyword

    return JSON.parse(body);
}

/** -----
 * Forward an incoming web hook to another service endpoint
 * @param {Object} target - Target object from translation
 * @param {string} path - An already translated target's path
 * @param {Object} body - An already translated body
 * @param {forwardResult} done - Callback
 */
function forwardWebhook(target, path, body, done) {
    // Set default variables if necessary
    var proto = (typeof target.protocol !== 'undefined')? target.protocol.toLowerCase() : "http";
    var port = proto === "http" ? 80 : 443;
    var method = ((typeof target.method !== 'undefined')) ? target.method.toUpperCase() : "GET";
    proto = (proto === "http") ? http : https;
    port = (typeof target.port !== 'undefined')? target.port : port;

    // Prepare request
    body = JSON.stringify(body);
    var options = {
        hostname: target.host,
        port: port,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    // Send request
    var req = proto.request(options, function () {
        done(true);
    });

    // catch error
    req.on('error',function (e) {
        log.error('Outgoing request failed', e.message);
        done(false)
    });

    // write data to request body
    req.end(body);
}
/**
 * @callback forwardResult
 * @param {boolean} res - True on success, false otherwise
 */

module.exports = {
    /**
     * Execute the translation if possible
     * @param {Object} translation - Translation object from configuration file
     * @param {Object} gitlabBody - Request body from Gitlab
     * @param {string} gitlabToken - Token from Gitlab to identify trigger
     * @param {processResult} done - Callback (only executed if translation has to be processed)
     */
    process: function (translation, gitlabBody, gitlabToken, done) {
        var controlPassed = true;

        // Check token if provided
        if (typeof translation.token !== 'undefined') {
            if (translation.token !== gitlabToken) {
                controlPassed = false;
            }
        }

        // Check condition if provided
        if (typeof translation.condition !== 'undefined') {
            var condition = translation.condition.replace(varPrefix, 'gitlabBody.');
            if (!eval(condition)) {
                controlPassed = false;
            }
        }

        if (controlPassed) {
            var url = translateUrl(translation.target.path, gitlabBody);
            var body = translateBody(translation.body, gitlabBody);

            // Forward web hook request
            forwardWebhook(translation.target, url, body, function (res) {
                return done(res, translation);
            });
        }
    },
    /**
     * @callback processResult
     * @param {boolean} status - True if translation was executed, false otherwise
     * @param {Object} translation - Translation object
     */

    translateUrl: translateUrl,
    translateBody: translateBody,
    forwardWebhook: forwardWebhook
};
