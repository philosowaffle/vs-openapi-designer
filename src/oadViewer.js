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

        // Wiring up new interface, probably need to rethink the architecture here
        // https://code.visualstudio.com/api/extension-guides/webview
        const panel = vscode.window.createWebviewPanel(
            'openApiPreviewer',
            'OpenApi Preview - ' + path.basename(editor.document.fileName.toLowerCase()),
            vscode.ViewColumn.Two,
            {}
        );
        panel.webview.html = this.provideTextDocumentContent(this.uri);
        // End new wire up

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