# ns-wingman
(node server wingman) 
[![npm version](https://badge.fury.io/js/ns-wingman.svg)](https://badge.fury.io/js/ns-wingman)

## Synopsis
This module simplifies some of the common tasks needed for a NodeJS application running as a server.
#####Included features:
* Logs start and stop of server and includes process id.
* Catches unhandledRejection and uncaughtException, writes to log, calls cleanup() and exit().
* Traps and ignores SIGHUP.
* Traps SIGINT, writes to log and exits gracefully.
* Listens to beforeExit event and calls cleanup() and exit().
* Allows user to register a cleanup function and set a timeout prior to calling exit().
* Searches nconf configuration for WinstonConsoleTransport and WinstonFileTransport properties. If found, applies.
* Provides an easy winston interface through exported variable winstonWingman.

**Note:** *This class uses winston for logging.* 
*To write to the log use one of two interfaces below:*
* var winston = require('winston');
* var winston = require('ns-wingman').winstonWingman.winston;

## Install
```
$ npm install ns-wingman --save
```


## Usage
```javascript
let nconf = require('nconf');
let server = require('ns-wingman');

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
```

## Documentation
The class is documented with JSDoc. 

## Author
Bill Hodges  
