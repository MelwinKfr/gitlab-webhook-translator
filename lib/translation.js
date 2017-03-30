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

    for (i = 0; i < matches.length; i++) {
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

    for (i = 0; i < matches.length; i++) {
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

module.exports = {
    /**
     * Execute the translation if possible
     * @param {Object} translation - Translation object from configuration file
     * @param {Object} gitlabBody - Request body from Gitlab
     * @param {string} gitlabToken - Token from Gitlab to identify trigger
     * @param {processResult} done - Callback
     */
    process: function (translation, gitlabBody, gitlabToken, done) {
        var controlPassed = true;
        var message = '';

        // Check token if provided
        if (typeof translation.token !== 'undefined') {
            if (translation.token !== gitlabToken) {
                controlPassed = false;
                message = 'Token is not corresponding'
            }
        }

        // Check condition if provided
        if (typeof translation.condition !== 'undefined') {
            var condition = translation.condition.replace(varPrefix, 'gitlabBody.');
            if (!eval(condition)) {
                controlPassed = false;
                message = 'Token is not corresponding'
            }
        }

        if (controlPassed) {
            var url = translateUrl(translation.url, gitlabBody);
            var body = translateBody(translation.body, gitlabBody);
            //todo Send request
            return done(true, message);
        } else {
            return done(false, message)
        }
    }
    /**
     * @callback processResult
     * @param {boolean} status - True if translation was executed, false otherwise
     * @param {string} message - Reason of failure (only set if status is false)
     */
};
