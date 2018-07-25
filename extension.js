// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

var path = require('path');
var fs = require('fs');
var open = require('open');
var watch = require('node-watch');
var JsonRefs = require('json-refs');
var yaml = require('js-yaml');
var swaggerEditor = require('swagger-editor-dist');


var server;

class Viewer {
    constructor(context, port) {
        this.context = context;
        this.port = port;
        this.uri = vscode.Uri.parse('openapidesigner://preview');
        this.Emmittor = new vscode.EventEmitter();
        this.onDidChange = this.Emmittor.event;
    }

    provideTextDocumentContent(uri, token) {
        var port = this.port || 9000;
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

    update() {
        this.Emmittor.fire(this.uri);
    }
};

function start(swaggerFile, targetDir, port, hostname, openBrowser, context) {
    var express = require('express');
    var app = express();
    server = require('http').createServer(app);
    var io = require('socket.io')(server);

    var viewer = new Viewer(context);
    var ds = viewer.register();
    context.subscriptions.push(...ds);

    app.get('/', function(req, res) {
      res.sendFile(__dirname + "/static/index.html");
    });
  
    app.use(express.static(__dirname + "/static/"));
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    io.on('connection', function(socket) {
        socket.on('uiReady', function(data) {
          bundle(swaggerFile).then(function (bundled) {
            socket.emit('updateSpec', JSON.stringify(bundled));
          }, function (err) {
            socket.emit('showError', err);
            console.log('Error: ' + err);
          });
        });
      });
  
    watch(targetDir, {recursive: true}, function(eventType, name) {
      bundle(swaggerFile).then(function (bundled) {
        console.log("File changed. Sent updated spec to the browser.");
        var bundleString = JSON.stringify(bundled, null, 2);
        io.sockets.emit('updateSpec', bundleString);
      }, function (err) {
        console.log('Error: ' + err);
        io.sockets.emit('showError', err);
      });
    });
  
    server.listen(port,hostname, function() {
      var serverUrl = `http://${hostname}:${port}`;
      console.log(`Listening on ${serverUrl}`);
      if (openBrowser) open(serverUrl);
    });
   
    viewer.display();
    viewer.update();
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

function runDesigner(context) {
    console.log('Running OpenApiDesigner');

    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    var config = vscode.workspace.getConfiguration('openApiDesigner');
    var defaultPort = config.defaultPort || 9000;
    var openBrowser = config.previewInBrowser || false;
    var specVerion = config.openApiVersion || "2";

    var doc = editor.document;
    var fileName = doc.fileName.toLowerCase();
    var filePath = fileName.substring(0, fileName.lastIndexOf("\\")); // windows

    if(filePath == "")
        filePath = fileName.substring(0, fileName.lastIndexOf("/")); // !windows
    
    start(fileName, filePath, defaultPort, "localhost", openBrowser, context);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    let disposable = vscode.commands.registerCommand('extension.runDesigner', function () {
        runDesigner(context);
    });

    context.subscriptions.push(disposable);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
    console.log('Shutting down.');
    server.close();
}

exports.deactivate = deactivate;