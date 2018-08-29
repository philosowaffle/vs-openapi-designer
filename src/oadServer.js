'use strict';

const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const oadLogger = require('./oadLogger');

var logger = oadLogger();

// Server for the Viewer.
class Server {
    constructor(port, fileName){
        this.port = port;
        this.fileName = fileName;
        this.serverUrl = "";

        var app = express();    
        this.server = http.createServer(app);
        this.io = socketio(this.server);

        this.connections = {};
        this.lastSocketKey = 0;

        app.use(express.static(__dirname + "/../"));
        app.get('/', function(req, res) {
            res.sendFile(__dirname + "/../index.html");
        });

        logger.log("Creating server for: " + fileName + " on port: " + port);
    }

    close() {
        /* loop through all sockets and destroy them */
        for(var key in this.connections){
            this.connections[key].disconnect();
            this.connections[key].destroy();
            logger.log("Closing socket " + key + " for: " + this.fileName);
        }

        /* after all the sockets are destroyed, we may close the server! */
        this.server.close(function(err){
            if(err) throw err();
            logger.log('Server stopped for: ' + this.fileName);
        });
    }

    listen(hostname) {
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
function oadServer(port, swaggerFile) {
    return new Server(port, swaggerFile)
}

module.exports = oadServer;