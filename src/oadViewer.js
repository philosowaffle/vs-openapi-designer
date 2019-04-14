'use strict';

const vscode = require('vscode');
const path = require('path');

const oadLogger = require('./oadLogger');

var logger = oadLogger();

class Viewer {
    constructor(context, port, previewUri) {
        this.context = context;
        this.port = port;
        this.uri = vscode.Uri.parse(previewUri);
        this.Emmittor = new vscode.EventEmitter();	
        this.onDidChange = this.Emmittor.event;
        this.currentPanel = undefined;
    }

    provideTextDocumentContent() {
        var html = `
        <html>
            <body style="margin:0px;padding:0px;background:#fafafa;">
                <div style="position:fixed;height:100%;width:100%;">
                <iframe src="http://localhost:${this.port}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>
                </div>
            </body>
        <html>`;
    
        return html;
    }

    display() {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        logger.log("Extension Path: " + this.context.extensionPath);

        this.currentPanel = vscode.window.createWebviewPanel(
            'openApiPreviewer',
            'OpenApi Preview - ' + path.basename(editor.document.fileName.toLowerCase()),
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            } 
        );
        
        this.currentPanel.webview.html = this.provideTextDocumentContent();
        this.currentPanel.onDidDispose(() => this.dispose(), null, null);
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
        if(this.currentPanel) {
            this.currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
            this.display();
        }

        this.Emmittor.fire(this.uri);
    }

    dispose() {
        this.currentPanel = undefined;
    }
}

/**
 * Creates a viewer for the given port.
 *
 * @param {object} context
 * @param {string} port
 * @param {string} previewUri
 * @return {Viewer|null}
 */
function oadViewer(context, port, previewUri) {
    return new Viewer(context, port, previewUri)
}

module.exports = oadViewer;