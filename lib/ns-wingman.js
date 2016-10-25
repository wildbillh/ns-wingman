/**
 * <h3>Node Server Wingman</h3>
 * <h3>Description</h3>
 * Contains common features used in a node standalone server.<br/>
 * Integrates configuration, logging, signal trapping and error handling.<br/>
 * Uses [winston-wingman]{@link https://github.com/wildbillh/winston-wingman} and [winston]{@link https://github.com/winstonjs/winston} for logging and [nconf]{@link https://github.com/indexzero/nconf} for configuration.
 * <h3>Features</h3>
 *
 * <li>Logs start and stop of server and includes process id.</li>
 * <li>Catches unhandledRejection and uncaughtException, writes to log, calls cleanup() and exit().</li>
 * <li>Traps and ignores SIGHUP.</li>
 * <li>Traps SIGINT, writes to log and exits gracefully.</li>
 * <li>Listens to beforeExit event and calls cleanup() and exit().</li>
 * <li>Allows user to register a cleanup function and set a timeout prior to calling exit().</li>
 * <li>Searches nconf configuration for WinstonConsoleTransport and WinstonFileTransport properties. If found, applies.</li>
 * <li>Provides an easy winston interface through exported variable winstonWingman.</li>
 * </ul>
 * @module
 * @requires winston-wingman
 * @requires nconf
 *
 */

let path = require('path');
let fs = require('fs');
let winstonWingman = require('winston-wingman');
let winston = winstonWingman.winston;
let nconf = require('nconf');

/**
 * Expose the winstonWingman interface. With this exposure, users can easily change
 * winston configurations with the provided interface.
 * See the [winston-wingman]{@link https://www.npmjs.com/package/winston-wingman} documentation for details.
 */
exports.winstonWingman = winstonWingman;



/**
 * Call the cleanup function and then exit after the given timeout.
 * @param {function} cleanup
 * @param {number} timeout timeout value in milliseconds
 * @param {number} exitCode
 * @private
 */
let handleCleanup = (cleanup, timeout, exitCode = 0) => {

    if (!Number.isInteger(timeout)) {
        timeout = 0;
    }
    if (!Number.isInteger(exitCode)) {
        exitCode = 0;
    }
    // if the cleanup function is defined call it.
    cleanup && cleanup();

     setTimeout( () => {
         process.exit(exitCode);
     }, timeout);
 };


/**
 *  Handles several common tasks that stand-alone Node applications would utillze.
 *  Writes standard server start and stop messages to the log file and traps signals
 *  and unhandled Promise rejections.<br/>
 *  If an nconf value of WinstonConsoleTransport or WinstonFileTransport are found,
 *  the configs will be merged into the default transports and applied.
 *  @param {string} [initialLogFilename=null] Initial log filename to use. If defaulted or
 *  null is passed then the filename 'app.log' is used.
 *  Note that if the log filename is overwritten in the config file, this file will only
 *  be used for a short duration at startup.
 *  @param {string} [configFile=null] The name of the nconf compatible config file
 *  @param {function} [cleanup=null] Function to call to clean up resources prior to exit
 *  @param {number} [timeout=0] Number of milliseconds to wait before calling exit
 */
let init = (initialLogFilename = null, configFile = null, cleanup = null, timeout = 0) => {
    let DEFAULT_LOGFILE = 'app.log';

    // Note if the user supplies a winston file transport in the config file with a different filename
    // then this file will be be interim only.
    // If initialLogFilename is supplied use it, otherwise generate a default name
    // Open the logfile in the current working directory
    if (initialLogFilename) {
        winstonWingman.init(initialLogFilename);
    }
    else {
        winstonWingman.init(path.normalize(`${process.cwd()}/${DEFAULT_LOGFILE}`));
    }

    process.on('beforeExit', () => {
        handleCleanup(cleanup, timeout, 0);
    });

    process.on('uncaughtException', (err) => {
        winston.error(`Uncaught Exception: ${err}`);
        handleCleanup(cleanup, timeout, 1);
    });

    // If a promise is rejected but unhandled, run cleanup and allow the loop to continue
    process.on('unhandledRejection', (reason, p) => {
        winston.error(`UnhandledRejection: ${reason} - ${p}`);
        handleCleanup(cleanup, timeout, 2);
    });

    // Set up signal handlers to exit gracefully
    process.on('SIGINT', function() {
        winston.info(`Received SIGINT on pid ${process.pid}. Attempting to close server gracefully`);
        handleCleanup(cleanup, timeout, 3);
    });

    // On Unix, handling SIGHUP causes the server to ignore it.
    process.on('SIGHUP', function() {
        winston.info(`Received SIGINT on pid ${process.pid}.`);
    });

    // if given, try to load the config file
    if (configFile) {
        try {
            fs.accessSync(configFile);
        }
        catch (err) {
            winston.error(`Could not open file: ${configFile}, exiting`);
            process.exit(4);
        }
        try {
            // Load up any transport configs from the config file
            nconf.file(configFile);

            let fileTransport = nconf.get('winstonFileTransport');
            if (fileTransport) {
                winstonWingman.mergeFileTransport(fileTransport);
            }

            let consoleTransport = nconf.get('winstonConsoleTransport');
            if (consoleTransport) {
                winstonWingman.mergeConsoleTransport(consoleTransport);
            }
        }
        catch (err) {
            winston.error(`${err}`);
            process.exit(5);
        }
    }

    // Write to the log that the process has started.
    winston.info(`Server started on pid ${process.pid}`);

// ---------------------------------------------------------------------------------
// Called when the process is finally exiting
    process.on('exit', function(code){
        winston.info(`Server on pid ${process.pid} is finished with exit code ${code}`);
    });

};

exports.init = init;

