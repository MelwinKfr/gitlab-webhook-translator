var express = require('express');
var app = express();

var Config = require('./lib/config');
var log = require('./lib/log');

app.get('/', function (req, res) {
    res.send('Gitlab webhook translator is listening on port 80')
});

app.listen(80, function () {
    log.info('Gitlab webhook translator is listening on port 80');
});

// Check conf
Config.parse(function (config) {
    var msg = 'Your configuration contains '+ config.translations.length +' translations';
    if (config.translations.length === 0) {log.warn(msg)} else {log.info(msg)}
});
