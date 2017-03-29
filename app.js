var express = require('express');
var app = express();

var config = require('./lib/config');
var log = require('./lib/log');

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(80, function () {
    log.info('Gitlab companion is listening on port 80');
});

// Check conf
config.parse(function (config) {
    var msg = 'Your configuration contains '+ config.translations.length +' translations';
    if (config.translations.length == 0) {log.warn(msg)} else {log.info(msg)}
});
