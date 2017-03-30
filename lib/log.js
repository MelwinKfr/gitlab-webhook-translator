var log = require('npmlog');

log.enableColor();
log.prefixStyle = {fg: ''};
log.addLevel('debug', 100000, {fg: 'blue'});

module.exports = log;


