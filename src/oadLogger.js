
class Logger {
    constructor() { }

    log(message) {
        console.log(message);
    }
}

/**
 * Get's a logger for the extension.
 * 
 * @return {Logger|null}
 */
function oadLogger() {
    return new Logger()
}

module.exports = oadLogger;