"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const oadLogger_1 = require("./oadLogger");
const oadServer_1 = require("./oadServer");
const util_1 = require("./util");
const oadViewer_1 = require("./oadViewer");
const watch = require('node-watch');
var logger = (0, oadLogger_1.default)();
var defaultPort = 9005;
var previewUri = 'openapidesigner://preview';
var server;
var watcher;
var viewer;
function start(openApiFile, targetDir, port, hostname, openBrowser, context) {
    server = (0, oadServer_1.oadServer)(port, openApiFile, context.extensionPath);
    logger.log("Created server for: " + openApiFile + " on port: " + port);
    server.io.on('connection', function (socket) {
        logger.log("Connection for: " + openApiFile);
        var socketKey = ++server.lastSocketKey;
        server.connections[socketKey] = socket;
        socket.on('disconnect', function () {
            delete server.connections[socketKey];
        });
        socket.on('uiReady', function (data) {
            (0, util_1.bundle)(openApiFile).then(function (bundled) {
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
    if (openBrowser) {
        vscode.env.openExternal(vscode.Uri.parse(server.serverUrl));
    }
    else {
        createViewer(context, port);
    }
}
function startWatchingDirectory(targetDir, openApiFile) {
    watcher = watch(targetDir, { recursive: true }, function (eventType, name) {
        (0, util_1.bundle)(openApiFile).then(function (bundled) {
            logger.log("File changed. Sent updated spec to the browser. File: " + openApiFile + " port: " + server.port);
            var bundleString = JSON.stringify(bundled, null, 2);
            server.io.emit('updateSpec', bundleString);
        }, function (err) {
            logger.log('Error: ' + err);
            server.io.emit('showError', err);
        });
    });
}
function createViewer(context, port) {
    logger.log("Creating Viewer");
    viewer = (0, oadViewer_1.oadViewer)(context, port, previewUri);
    var ds = viewer.register();
    context.subscriptions.push(...ds);
    viewer.setPort(server.port);
    viewer.display();
    viewer.update();
}
function runDesigner(context, openBrowser) {
    logger.log('Running OpenApiDesigner');
    var config = vscode.workspace.getConfiguration('openApiDesigner');
    var port = config.defaultPort || defaultPort;
    var fileName = getActiveFile();
    var fileDir = getActivePath();
    if (server == null) {
        start(fileName, fileDir, port, "localhost", openBrowser, context);
    }
    else {
        // Server exists, update viewer.
        updateUI(fileName, fileDir, openBrowser);
    }
}
function updateUI(openApiFile, targetDir, openInBrowser) {
    watcher.close();
    (0, util_1.bundle)(openApiFile).then(function (bundled) {
        logger.log("Set new OpenApi File: " + openApiFile + " port: " + server.port);
        var bundleString = JSON.stringify(bundled, null, 2);
        server.io.emit('updateSpec', bundleString);
    }, function (err) {
        logger.log('Error: ' + err);
        server.io.emit('showError', err);
    });
    if (openInBrowser) {
        vscode.env.openExternal(vscode.Uri.parse(server.serverUrl));
    }
    else {
        viewer.update();
    }
    startWatchingDirectory(targetDir, openApiFile);
}
function getActiveFile() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return "";
    }
    var doc = editor.document;
    return doc.fileName;
}
function getActivePath() {
    var activeFile = getActiveFile();
    return (0, util_1.getPathFromFile)(activeFile);
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vs-openapi-designer" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(vscode.commands.registerCommand('vs-openapi-designer.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from vs-openapi-designer!');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('openapidesigner.runDesignerInSideView', function () {
        runDesigner(context, false);
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map