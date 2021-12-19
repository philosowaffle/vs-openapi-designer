// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import oadLogger from "./oadLogger";
import { oadServer, Server } from "./oadServer";
import { getPathFromFile, bundle } from "./util";
import { oadViewer, Viewer } from "./oadViewer";

const watch = require('node-watch');

var logger = oadLogger();
var defaultPort = 9005;
var previewUri = 'openapidesigner://preview';

var server:Server;
var watcher:any;
var viewer:Viewer;

function start(openApiFile:string, targetDir:string, port:number, hostname:string, openBrowser:boolean, context:vscode.ExtensionContext) {    
    server = oadServer(port, openApiFile, context.extensionPath);

    logger.log("Created server for: " + openApiFile + " on port: " + port);

    server.io.on('connection', function(socket) {
        logger.log("Connection for: " + openApiFile);

        var socketKey = ++server.lastSocketKey;
        server.connections[socketKey] = socket;
        socket.on('disconnect', function() {
            delete server.connections[socketKey];
        });        

        socket.on('uiReady', function(data) {
            bundle(openApiFile).then(function (bundled) {
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
        vscode.env.openExternal(vscode.Uri.parse(server.serverUrl));
    } else {
        createViewer(context, port);
    }
  }

  function startWatchingDirectory(targetDir:string, openApiFile:string){
    watcher = watch(targetDir, {recursive: true}, function(eventType:any, name:string) {
        bundle(openApiFile).then(function (bundled) {
            logger.log("File changed. Sent updated spec to the browser. File: " + openApiFile + " port: " + server.port);
            var bundleString = JSON.stringify(bundled, null, 2);
            server.io.emit('updateSpec', bundleString);
        }, function (err) {
            logger.log('Error: ' + err);
            server.io.emit('showError', err);
        });
    });
}

function createViewer(context: vscode.ExtensionContext, port:number){
    logger.log("Creating Viewer");
    viewer = oadViewer(context, port, previewUri);
    var ds = viewer.register();
    context.subscriptions.push(...ds);
    viewer.setPort(server.port);
    viewer.display();
    viewer.update();
}

function runDesigner(context: vscode.ExtensionContext, openBrowser: boolean) {
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

function updateUI(openApiFile:string, targetDir:string, openInBrowser:boolean){
    watcher.close();

    bundle(openApiFile).then(function (bundled) {
        logger.log("Set new OpenApi File: " + openApiFile + " port: " + server.port);
        var bundleString = JSON.stringify(bundled, null, 2);
        server.io.emit('updateSpec', bundleString);
    }, function (err) {
        logger.log('Error: ' + err);
        server.io.emit('showError', err);
    });

    if (openInBrowser) {
        vscode.env.openExternal(vscode.Uri.parse(server.serverUrl));
    } else {
        viewer.update();
    }

    startWatchingDirectory(targetDir, openApiFile)
}

function getActiveFile():string {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return "";
    }

    var doc = editor.document;
    return doc.fileName;
}

function getActivePath():string {
    var activeFile = getActiveFile();
    return getPathFromFile(activeFile);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
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

// this method is called when your extension is deactivated
export function deactivate() {}
