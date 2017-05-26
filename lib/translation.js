var http = require('http');
var https = require('https');
var querystring = require('querystring');

var log = require('./log');

const varPrefix = ':';
const varPrefixRegex = new RegExp(varPrefix, 'g');
const varRegex = new RegExp(varPrefix +'[a-z|_|\-|.]+', 'g', 'i');

/** -----
 * Translate URL according to Gitlab request body
 * @param {string} url - URL to translate
 * @param {Object} gitlabBody - Request body from Gitlab
 * @returns {string} - Translated URL, empty on error
 */
function translateUrl (url, gitlabBody) {
    var matches = url.match(varRegex);
    var i = 0;
    var error = false;
    for (; i < matches.length; i++) {
        var value = 'undefined';
        try {
            value = eval('gitlabBody.'+ matches[i].substring(1));
        } catch (e) {
            log.error('Problem while evaluating variable "'+ matches[i] +'":', e.message);
            error = true;
        }

        url = url.replace(matches[i], value);
    }

    return error ? '' : url;
}

/** -----
 * Translate body according to Gitlab request body
 * @param {Object} body - Body to translate
 * @param {Object} gitlabBody - Request body from Gitlab
 * @returns {string} - Translated JSON formatted body, empty on error
 */
function translateBody (body, gitlabBody) {
    body = JSON.stringify(body);
    var matches = body.match(varRegex);

    var i = 0;
    var error = false;
    for (; i < matches.length; i++) {
        var value = 'undefined';
        try {
            value = eval('gitlabBody.'+ matches[i].substring(1));
        } catch (e) {
            log.error('Problem while evaluating variable "'+ matches[i] +'":', e.message);
            error = true;
        }

        if (typeof value === 'object') {
            value = JSON.stringify(value);
            body = body.replace('"'+ matches[i] +'"', value);
        } else {
            body = body.replace(matches[i], value);
        }
    }

    //todo: :__original-data__ keyword

    return error ? '' : JSON.parse(body);
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
    var proto = (typeof target.protocol !== 'undefined') ? target.protocol.toLowerCase() : "http";
    var port = proto === "http" ? 80 : 443;
    port = (typeof target.port !== 'undefined') ? target.port : port;
    var method = ((typeof target.method !== 'undefined')) ? target.method.toUpperCase() : "GET";
    var ctype = (typeof target.content_type !== 'undefined') ? target.content_type : 'application/json';
    body = (ctype === 'xform') ? querystring.stringify(body) : JSON.stringify(body);
    ctype = (ctype === 'xform') ? 'application/x-www-form-urlencoded' : 'application/json';

    // Prepare request
    var options = {
        hostname: target.host,
        port: port,
        path: path,
        method: method,
        headers: {
            'Content-Type': ctype,
            'Content-Length': Buffer.byteLength(body)
        }
    };

    // Send request
    proto = (proto === "http") ? http : https;
    var req = proto.request(options, function (res) {
        if (res.statusCode >= 200 && res.statusCode < 400 ) {
            done(true);
        } else {
            log.warn('Outgoing request failed ('+ res.statusCode +' - '+ res.statusMessage +')');

            var str = '';
            res.on('data', function (chunk) {
                str += chunk;
            });
            res.on('end', function () {
                log.debug('Request body |', str);
            });

            done(false);
        }

    });

    // catch error
    req.on('error',function (e) {
        log.error('Outgoing request failed', e.message);
        done(false)
    });

    // write data to request body
    req.write(body);
    req.end();
}
/**
 * @callback forwardResult
 * @param {boolean} res - True on success, false otherwise
 */

/** -----
 * Check if required attributes are there
 * @param {Object} translation - Translation object from config
 * @returns {boolean} - True if checks pass, false otherwise
 */
function checkTranslation(translation) {
    // Target
    if (typeof translation.target === 'undefined') {
        log.error('Object "target" is required!');
        return false;
    }

    var res = true;

    // Path
    if (typeof translation.target.path === 'undefined') {
        log.error('Attribute "target.path" is required!');
        res = false;
    }

    // Host
    if (typeof translation.target.host === 'undefined') {
        log.error('Attribute "target.host" is required!');
        res = false;
    }

    return res;
}

module.exports = {
    /**
     * Execute the translation if possible
     * @param {Object} translation - Translation object from configuration file
     * @param {Object} gitlabBody - Request body from Gitlab
     * @param {string} gitlabToken - Token from Gitlab to identify trigger
     * @param {processResult} done - Callback (only executed if translation has to be processed)
     */
    process: function (translation, gitlabBody, gitlabToken, done) {
        if (!checkTranslation(translation))
            return done(false, translation);

        var controlPassed = true;

        // Check token if provided
        if (typeof translation.token !== 'undefined') {
            if (translation.token !== gitlabToken) {
                controlPassed = false;
            }
        }

        // Check condition if provided
        try {
            if (typeof translation.condition !== 'undefined') {
                var condition = translation.condition.replace(varPrefixRegex, 'gitlabBody.');
                if (!eval(condition)) {
                    controlPassed = false;
                }
            }
        } catch (e) {
            log.error('Problem while evaluating condition: ' + e.message);
            controlPassed = false;
        }

        if (controlPassed) {
            var url = translateUrl(translation.target.path, gitlabBody);

            var body = {};
            if (typeof translation.body !== 'undefined')
                body = translateBody(translation.body, gitlabBody);

            // Check translations success
            if (url === '' || body === '')
                return done(false, translation);

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
    forwardWebhook: forwardWebhook,
    checkTranslation: checkTranslation
};
