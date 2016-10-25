
let nconf = require('nconf');
let server = require('../lib/ns-wingman');

let winston = require('winston');
// Define cleanup function
let cleanup = () => {
    console.log('cleanup');
};

// Initialize the server
server.init('app.log', 'config.json', cleanup, 10);

// Log the value of a configuration property
winston.info(nconf.get('name'));

// Change a value of the winston console
server.winstonWingman.setConsoleTransport({colorize: false});

winston.info('should be in black and white now');

