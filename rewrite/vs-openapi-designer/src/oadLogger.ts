
class Logger {
    constructor() { }

    log(message:string) {
        console.log(message);
    }
}

/**
 * Get's a logger for the extension.
 * 
 * @return {Logger|null}
 */
export default function oadLogger() {
    return new Logger()
}