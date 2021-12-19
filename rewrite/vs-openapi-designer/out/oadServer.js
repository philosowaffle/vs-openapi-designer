"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oadServer = exports.Server = void 0;
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const oadLogger_1 = require("./oadLogger");
const express = require("express");
var logger = (0, oadLogger_1.default)();
// Server for the Viewer.
class Server {
    constructor(port, fileName, extensionPath) {
        this.port = port;
        this.fileName = fileName;
        this.extensionPath = extensionPath;
        this.serverUrl = "";
        var app = express();
        this.server = http.createServer(app);
        this.io = new socketio.Server(this.server);
        this.connections = {};
        this.lastSocketKey = 0;
        app.use(express.static(this.extensionPath));
        app.use('/node_modules', express.static(path.join(this.extensionPath, 'node_modules')));
        logger.log("Creating server for: " + fileName + " on port: " + port);
    }
    close() {
        /* loop through all sockets and destroy them */
        for (var key in this.connections) {
            this.connections[key].removeAllListeners();
            this.connections[key].disconnect();
            logger.log("Closing socket " + key + " for: " + this.fileName);
        }
        /* after all the sockets are destroyed, we may close the server! */
        this.server.close(function (err) {
            if (err)
                throw err;
            // logger.log('Server stopped for: ' + this.fileName);
        });
    }
    listen(hostname) {
        var p = this.port;
        this.serverUrl = `http://${hostname}:${p}`;
        this.server.listen(this.port, hostname);
        logger.log(`Listening on ${this.serverUrl}`);
    }
}
exports.Server = Server;
/**
 * Get's a server for the given port and swaggerFile.
 *
 * @param {number} port
 * @param {string} swaggerFile
 * @return {Server|null}
 */
function oadServer(port, swaggerFile, extensionPath) {
    return new Server(port, swaggerFile, extensionPath);
}
exports.oadServer = oadServer;
//# sourceMappingURL=oadServer.js.map