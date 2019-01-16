const vscode = require('vscode');
const fs = require('fs');
const open = require('open');
const watch = require('node-watch');

const oadServer = require('./oadServer');
const oadLogger = require('./oadLogger');
const oadViewer = require('./oadViewer');
const util = require('./util');

var defaultPort = 9005;
var previewUri = 'openapidesigner://preview';
var logger = oadLogger();

var server;
var watcher;
var viewer;

function start(openApiFile, targetDir, port, hostname, openBrowser, context) {    
    server = oadServer(port, openApiFile);

    logger.log("Created server for: " + openApiFile + " on port: " + port);

    server.io.on('connection', function(socket) {
        var socketKey = ++server.lastSocketKey;
        server.connections[socketKey] = socket;
        socket.on('disconnect', function() {
            delete server.connections[socketKey];
        });

        logger.log("Connection for: " + openApiFile);

        socket.on('uiReady', function(data) {
            util.bundle(openApiFile).then(function (bundled) {
                logger.log("Sending init file to: " + openApiFile);
                var bundleString = JSON.stringify(bundled, null, 2);
                server.io.emit('updateSpec', bundleString);
            }, function (err) {
                server.io.emit('showError', err);
                logger.log('Error: ' + err);
            });
        });
    });
    
    startWatchingDirectory(targetDir, openApiFile);

    server.listen(hostname);
    if (openBrowser){
        open(server.serverUrl);
    } else {
        createViewer(context, port);
    }
  }

function startWatchingDirectory(targetDir, openApiFile){
    watcher = watch(targetDir, {recursive: true}, function(eventType, name) {
        util.bundle(openApiFile).then(function (bundled) {
            logger.log("File changed. Sent updated spec to the browser. File: " + openApiFile + " port: " + server.port);
            var bundleString = JSON.stringify(bundled, null, 2);
            server.io.emit('updateSpec', bundleString);
        }, function (err) {
            logger.log('Error: ' + err);
            server.io.emit('showError', err);
        });
    });
}

function build (openApiFile, bundleTo) {
    util.bundle(openApiFile).then(function (bundled) {
        var bundleString = JSON.stringify(bundled, null, 2);
        if (typeof bundleTo === 'string') {
          fs.writeFile(bundleTo, bundleString, function(err) {
            if (err) {
                logger.log(err);
              return;
            }
            logger.log('Saved bundle file at ' + bundleTo);
          });
        }
      }, function (err) {
        logger.log(err);
      });
  }

function createViewer(context, port){
    logger.log("Creating Viewer");
    viewer = oadViewer(context, port, previewUri);
    var ds = viewer.register();
    context.subscriptions.push(...ds);
    viewer.setPort(server.port);
    viewer.display();
    viewer.update();
}

function updateUI(openApiFile, targetDir, openInBrowser){
    watcher.close();

    util.bundle(openApiFile).then(function (bundled) {
        logger.log("Set new OpenApi File: " + openApiFile + " port: " + server.port);
        var bundleString = JSON.stringify(bundled, null, 2);
        server.io.emit('updateSpec', bundleString);
    }, function (err) {
        logger.log('Error: ' + err);
        server.io.emit('showError', err);
    });

    if (openInBrowser) {
        open(server.serverUrl);
    } else {
        viewer.update();
    }

    startWatchingDirectory(targetDir, openApiFile)
}

function runDesigner(context, openBrowser) {
    logger.log('Running OpenApiDesigner');

    var config = vscode.workspace.getConfiguration('openApiDesigner');
    var port = config.defaultPort || defaultPort;

    var fileName = getActiveFile();
    var fileDir = getActivePath();
        
    if(server == null) {
        start(fileName, fileDir, port, "localhost", openBrowser, context);
    } else {
        // Server exists, update viewer.
        updateUI(fileName, fileDir, openBrowser);
    }
}

function getActiveFile() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    var doc = editor.document;
    return doc.fileName;
}

function getActivePath() {
    var activeFile = getActiveFile();
    return util.getPathFromFile(activeFile);
}

function shutdown() {
    logger.log('Killing server.');
    server.close();
    watcher.close();
    server = null;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    context.subscriptions.push(vscode.commands.registerCommand('openapidesigner.runDesigner', function () {
        var config = vscode.workspace.getConfiguration('openApiDesigner');
        var openBrowser = config.previewInBrowser || false;
        runDesigner(context, openBrowser);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openapidesigner.runDesignerInSideView', function () {
        runDesigner(context, false);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openapidesigner.runDesignerInBrowser', function () {
        runDesigner(context, true);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('openapidesigner.compileFiles', function () {
        build(getActiveFile(), getActivePath() + "/openapi.json");
    }));

    vscode.workspace.onDidCloseTextDocument((textDocument) => {
        if(textDocument.uri.toString() == previewUri){
            shutdown();
        }
    });

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (!event.affectsConfiguration('openapidesigner')) return;
    });
}

// this method is called when your extension is deactivated
function deactivate() {
    console.log('Shutting down.');
    shutdown();
}

exports.activate = activate;
exports.deactivate = deactivate;