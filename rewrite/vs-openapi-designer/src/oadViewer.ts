import * as vscode from 'vscode';
import * as path from "path";
import oadLogger from "./oadLogger";

var logger = oadLogger();

export class Viewer {
    
    context: vscode.ExtensionContext;
    port: number;
    uri: vscode.Uri;
    Emittor: vscode.EventEmitter<vscode.Uri>;
    onDidChange: vscode.Event<vscode.Uri>;
    currentPanel: vscode.WebviewPanel | undefined;

    constructor(context:vscode.ExtensionContext, port:number, previewUri:string) {
        this.context = context;
        this.port = port;
        this.uri = vscode.Uri.parse(previewUri);
        this.Emittor = new vscode.EventEmitter<vscode.Uri>();	
        this.onDidChange = this.Emittor.event;
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
        this.currentPanel.onDidDispose(() => this.dispose());
    }

    register() {
        var ds = [];
        var disposable = vscode.workspace.registerTextDocumentContentProvider('openapidesigner', this);
        ds.push(disposable);
        return ds;
    }

    setPort(port:number) {
        this.port = port;
    }
    
    update() {
        if(this.currentPanel) {
            this.currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
            this.display();
        }

        this.Emittor.fire(this.uri);
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
export function oadViewer(context:vscode.ExtensionContext, port:number, previewUri:string) {
    return new Viewer(context, port, previewUri)
}