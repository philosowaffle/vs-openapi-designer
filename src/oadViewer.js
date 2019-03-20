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

        this.extensionPath = context.extensionPath;
        this.currentPanel = undefined;
        this.disposables = [];
    }

    provideTextDocumentContent(uri) {
        var port = this.port;
        var html =  `
        <html>
            <body style="margin:0px;padding:0px;background:#fafafa;">
                <div style="position:fixed;height:100%;width:100%;">
                <iframe src="http://localhost:${port}" frameborder="0" height="100%" width="100%"></iframe>
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

        if(this.currentPanel) {
            this.currentPanel.reveal(vscode.ViewColumn.Two);
            return this;
        }

        // https://code.visualstudio.com/api/extension-guides/webview
        // https://github.com/Microsoft/vscode-extension-samples/blob/master/webview-sample/src/extension.ts
        this.currentPanel = vscode.window.createWebviewPanel(
            'openApiPreviewer',
            'OpenApi Preview - ' + path.basename(editor.document.fileName.toLowerCase()),
            vscode.ViewColumn.Two,
            {
                enableScripts: true, // enable javascript in webview
                retainContextWhenHidden: true,
                localResourceRoots: [ 
                    vscode.Uri.file(this.extensionPath) // And restrict the webview to only loading content from our extension's directory.
                ]
            } 
        );
        this.currentPanel.webview.html = this.provideTextDocumentContent(this.uri);

         // Handle messages from the webview
         this.currentPanel.webview.onDidReceiveMessage(message => { vscode.window.showErrorMessage(message.text); }, null, this.disposables);
         this.currentPanel.onDidChangeViewState(e => { this.update() }, null, this.disposables);
         this.currentPanel.onDidDispose(() => this.dispose(), null, this.disposables);

         return this;
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
        }

        this.Emmittor.fire(this.uri);
    }

    dispose() {
        this.currentPanel.dispose();
        this.currentPanel = undefined;
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
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