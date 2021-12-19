"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    return new Logger();
}
exports.default = oadLogger;
//# sourceMappingURL=oadLogger.js.map