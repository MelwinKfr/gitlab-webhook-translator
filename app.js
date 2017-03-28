var log = require('npmlog');
log.enableColor();
log.prefixStyle = {fg: ''};

var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(80, function () {
    log.info('Gitlab companion is listening on port 80');
});
