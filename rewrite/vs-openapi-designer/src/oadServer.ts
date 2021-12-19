
import * as http from "http";
import * as socketio from "socket.io";
import * as path from "path";
import oadLogger from "./oadLogger";

const express = require("express");

var logger = oadLogger();

interface SocketDictionary {
    [index: number]: socketio.Socket;
}

// Server for the Viewer.
export class Server {
    port: number;
    fileName: string;
    extensionPath: string;
    serverUrl: string;
    server: http.Server;
    io: socketio.Server;
    connections: SocketDictionary;
    lastSocketKey: number;

    constructor(port:number, fileName:string, extensionPath:string){
        this.port = port;
        this.fileName = fileName;
        this.extensionPath = extensionPath
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
        for(var key in this.connections){
            this.connections[key].removeAllListeners();
            this.connections[key].disconnect();            
            logger.log("Closing socket " + key + " for: " + this.fileName);
        }

        /* after all the sockets are destroyed, we may close the server! */
        this.server.close(function(err){
            if(err) throw err;
            // logger.log('Server stopped for: ' + this.fileName);
        });
    }

    listen(hostname:string) {
        var p = this.port;
        this.serverUrl = `http://${hostname}:${p}`;
        this.server.listen(this.port,hostname);
        logger.log(`Listening on ${this.serverUrl}`);
    }
}

/**
 * Get's a server for the given port and swaggerFile.
 *
 * @param {number} port
 * @param {string} swaggerFile
 * @return {Server|null}
 */
export function oadServer(port:number, swaggerFile:string, extensionPath:string) {
    return new Server(port, swaggerFile, extensionPath)
}