// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

var path = require('path');
var fs = require('fs');
var open = require('open');
var watch = require('node-watch');
var JsonRefs = require('json-refs');
var yaml = require('js-yaml');

var defaultPort = 9000;
var previewUri = 'openapidesigner://preview';

var servers = {};

class Server {
    constructor(context, port, fileName, targetDir){
        this.context = context;
        this.port = port;
        this.fileName = fileName;
        this.targetDir = targetDir;
        this.serverUrl = "";

        var express = require('express');
        var app = express();    
        this.server = require('http').createServer(app);
        this.io = require('socket.io')(this.server);

        this.connections = {};
        this.lastSocketKey = 0;

        app.use(express.static(__dirname + "/"));
        app.get('/', function(req, res) {
            res.sendFile(__dirname + "/index.html");
        });
    }

    close() {
        /* loop through all sockets and destroy them */
        Object.keys(this.connections).forEach(socketKey =>function(socketKey){
            this.connections[socketKey].disconnect();
            this.connections[socketKey].destroy();
            console.log("Closing socket " + socketKey + " for: " + this.fileName);
        });

        /* after all the sockets are destroyed, we may close the server! */
        this.server.close(function(err){
            if(err) throw err();
            console.log('Server stopped for: ' + this.fileName);
        });
    }

    listen(hostname) {
        var p = this.port;
        this.server.listen(this.port,hostname, function() {
            this.serverUrl = `http://${hostname}:${p}`;
            console.log(`Listening on ${this.serverUrl}`);
        });

        return this.serverUrl;
    }
}

class Viewer {
    constructor(context, port) {
        this.context = context;
        this.port = port;
        this.uri = vscode.Uri.parse(previewUri);
        this.Emmittor = new vscode.EventEmitter();
        this.onDidChange = this.Emmittor.event;
    }

    provideTextDocumentContent(uri, token) {
        var port = this.port || defaultPort;
        var html =  `
        <html>
            <body style="margin:0px;padding:0px;overflow:hidden;background:#fafafa;">
                <div style="position:fixed;height:100%;width:100%;">
                <iframe src="http://localhost:${port}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>
                </div>
            </body>
        </html>
        `;
        return html;
    }

    display() {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        return vscode.commands.executeCommand('vscode.previewHtml', this.uri, vscode.ViewColumn.Two, 'OpenApi Preview - ' + path.basename(editor.document.fileName.toLowerCase()))
        .then(success => { }, reason => {
            vscode.window.showErrorMessage(reason);
        });
    }

    register() {
        var ds = [];
        var disposable = vscode.workspace.registerTextDocumentContentProvider('openapidesigner', this);
        ds.push(disposable);
        return ds;
    }

    setPort(port) {
        this.port = port;
    }
    
    update() {
        this.Emmittor.fire(this.uri);
    }
};

function start(swaggerFile, targetDir, port, hostname, openBrowser, context) {
    defaultPort++;
    
    var server = new Server(context, port, swaggerFile, targetDir);
    servers[swaggerFile] = server;

    console.log("Created server for: " + swaggerFile + " on port: " + port);

    server.io.on('connection', function(socket) {
        var socketKey = ++server.lastSocketKey;
        server.connections[socketKey] = socket;
        socket.on('disconnect', function() {
            delete server.connections[socketKey];
        });

        console.log("Connection for: " + swaggerFile);

        socket.on('uiReady', function(data) {
            bundle(swaggerFile).then(function (bundled) {
                console.log("Sending init file to: " + swaggerFile);
                server.io.emit('updateSpec', JSON.stringify(bundled));
            }, function (err) {
                server.io.emit('showError', err);
                console.log('Error: ' + err);
            });
        });
    });
    
    watch(targetDir, {recursive: true}, function(eventType, name) {
        bundle(swaggerFile).then(function (bundled) {
            console.log("File changed. Sent updated spec to the browser. File: " + swaggerFile);
            var bundleString = JSON.stringify(bundled, null, 2);
            server.io.emit('updateSpec', bundleString);
        }, function (err) {
            console.log('Error: ' + err);
            server.io.emit('showError', err);
        });
    });

    var serverUrl = server.listen(hostname);
    if (openBrowser){
        open(serverUrl);
    } else {
        createViewer(context, swaggerFile);
    }
  }

function dictToString(dict) {
    var res = [];
    for (const [k, v] of Object.entries(dict)) {
      res.push(`${k}: ${v}`);
    }
    return res.join('\n');
  }
  
function bundle(swaggerFile) {
    var root = yaml.safeLoad(fs.readFileSync(swaggerFile, 'utf8'));
    var options = {
        filter : ['relative', 'remote'],
        resolveCirculars: true,
        location: swaggerFile,
        loaderOptions : {
        processContent : function (res, callback) {
            callback(undefined, yaml.safeLoad(res.text));
        }
        }
    };
    JsonRefs.clearCache();
    return JsonRefs.resolveRefs(root, options).then(function (results) {
        var resErrors = {};
        for (const [k,v] of Object.entries(results.refs)) {
        if ('missing' in v && v.missing === true)
            resErrors[k] = v.error;
        }

        if (Object.keys(resErrors).length > 0) {
        return Promise.reject(dictToString(resErrors));
        }

        return results.resolved;
    }, function (e) {
        var error = {};
        Object.getOwnPropertyNames(e).forEach(function (key) {
            error[key] = e[key];
        });
        return Promise.reject(dictToString(error));
    });
}

function createViewer(context, fileName){
    console.log("Creating Viewer for: " + fileName);
    var viewer = new Viewer(context);
    var ds = viewer.register();
    context.subscriptions.push(...ds);
    viewer.setPort(servers[fileName].port);
    viewer.display();
    viewer.update();
}

function runDesigner(context) {
    console.log('Running OpenApiDesigner');

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    var config = vscode.workspace.getConfiguration('openApiDesigner');
    var port = config.defaultPort || defaultPort;
    var openBrowser = config.previewInBrowser || false;

    var doc = editor.document;
    var fileName = doc.fileName.toLowerCase();
    var filePath = fileName.substring(0, fileName.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = fileName.substring(0, fileName.lastIndexOf("/")); // !windows
        
    if(!(servers[fileName] && servers[fileName].listening)) {
        start(fileName, filePath, port, "localhost", openBrowser, context);
    } else {
        // Server exists, update viewer.
        createViewer(context, fileName);
    }    
}

function shutdown() {

    Object.keys(servers).forEach(serverKey =>function(serverKey){
        servers[serverKey].close();
        delete servers[serverKey];
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    let disposable = vscode.commands.registerCommand('extension.runDesigner', function () {
        runDesigner(context);
    });

    vscode.workspace.onDidCloseTextDocument((textDocument) => {
        console.log('onDidCloseTextDocument');
        if(textDocument.uri.toString() == previewUri){
            console.log('Killing server');
            shutdown();
        }
    });
    context.subscriptions.push(disposable);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
    console.log('Shutting down.');
    shutdown();
}

exports.deactivate = deactivate;