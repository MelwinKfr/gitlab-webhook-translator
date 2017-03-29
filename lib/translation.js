var log = require('./log');

const varPrefix = ':';

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

        //Check token if provided
        if (typeof translation.token !== 'undefined') {
            if (translation.token !== gitlabToken) {
                controlPassed = false;
                message = 'Token is not corresponding'
            }
        }
        //Check condition if provided
        if (typeof translation.condition !== 'undefined') {
            var condition = translation.condition.replace(varPrefix, 'gitlabBody.');
            if (!eval(condition)) {
                controlPassed = false;
                message = 'Token is not corresponding'
            }
        }

        if (controlPassed) {
            //Translate URL
            this.translateUrl(translation.url, gitlabBody, function (translatedUrl) {
                //todo Build body
                //todo Send request
                return done(true, message)
            });
        } else {
            return done(false, message)
        }
    },
    /**
     * @callback processResult
     * @param {boolean} status - True if translation was executed, false otherwise
     * @param {string} message - Reason of failure (only set if status is false)
     */

    /**
     * Translate URL according to Gitlab request body
     * @param {string} url - URL to translate
     * @param {Object} gitlabBody - Request body from Gitlab
     * @param {urlResult} done - Callback
     */
    translateUrl: function (url, gitlabBody, done) {
        var regex = new RegExp(varPrefix +'[a-z|_|\-|.]+', 'g', 'i');
        var matches = url.match(regex);

        for (i = 0; i < matches.length; i++) {
            url = url.replace(matches[i], eval('gitlabBody.'+ matches[i].substring(1)));
        }

        return done(url);
    }
    /**
     * @callback urlResult
     * @param {string} translatedUrl - Translated URL
     */
};
