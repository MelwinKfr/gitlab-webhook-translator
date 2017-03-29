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
            if (!eval(translation.condition)) {
                controlPassed = false;
                message = 'Token is not corresponding'
            }
        }

        if (controlPassed) {
            //todo Build URL
            //todo Build body
            //todo Send request
            done(true, message)
        } else {
            done(false, message)
        }
    }
    /**
     * @callback processResult
     * @param {boolean} status - True if translation was executed, false otherwise
     * @param {string} message - Reason of failure (only set if status is false)
     */
};
