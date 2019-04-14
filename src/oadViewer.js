'use strict';

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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
        try{
            var indexPath = path.join(__dirname, "..", "index.html");
            logger.log('Index.html: ' + indexPath);

            var baseHtml = fs.readFileSync(indexPath).toString('utf-8');

            // if loading in browser
            //var finalHtml = baseHtml.replace(/{PREVIEW_URI}/gi, "http://localhost:9005");
            //return finalHtml;
            
            //Else Get resource paths
            var swagger_editor_dist_path = path.join(this.context.extensionPath, 'node_modules', 'swagger-editor-dist');

            var swagger_editor_css = vscode.Uri.file(path.join(swagger_editor_dist_path, 'swagger-editor.css')).with({ scheme: 'vscode-resource' }).toString(true);
            var swagger_editor_favicon_32_png = vscode.Uri.file(path.join(swagger_editor_dist_path, "favicon-32x32.png")).with({ scheme: 'vscode-resource' }).toString(true);
            var swagger_editor_favicon_16_png = vscode.Uri.file(path.join(swagger_editor_dist_path, "favicon-16x16.png")).with({ scheme: 'vscode-resource' }).toString(true);
            var swagger_editor_bundle_js = vscode.Uri.file(path.join(swagger_editor_dist_path, "swagger-editor-bundle.js")).with({ scheme: 'vscode-resource' }).toString(true);
            var swagger_editor_standalone_preset_js = vscode.Uri.file(path.join(swagger_editor_dist_path, "swagger-editor-standalone-preset.js")).with({ scheme: 'vscode-resource' }).toString(true);
            
            var socket_io = vscode.Uri.file(path.join(this.context.extensionPath, "node_modules", "socket.io", "socket.io.js")).with({ scheme: 'vscode-resource' }).toString(true);
            
            // Replace resource paths
            //var finalHtml = baseHtml.replace(/{SERVER_URL}/gi, "http://localhost:9005");
            // finalHtml = finalHtml.replace("/node_modules/swagger-editor-dist/favicon-32x32.png", swagger_editor_css);
            // finalHtml = finalHtml.replace("/node_modules/swagger-editor-dist/favicon-16x16.png", swagger_editor_favicon_32_png);
            // finalHtml = finalHtml.replace("/node_modules/swagger-editor-dist/favicon-16x16.png", swagger_editor_favicon_16_png);
            // finalHtml = finalHtml.replace("/node_modules/swagger-editor-dist/swagger-editor-bundle.js", swagger_editor_bundle_js);
            // finalHtml = finalHtml.replace("/node_modules/swagger-editor-dist/swagger-editor-standalone-preset.js", swagger_editor_standalone_preset_js);
            // finalHtml = finalHtml.replace("/socket.io/socket.io.js", socket_io);

            var finalHtml = `
			<html>
				<body style="margin:0px;padding:0px;background:#fafafa;">
					<div style="position:fixed;height:100%;width:100%;">
					<iframe src="http://localhost:${this.port}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>
					</div>
                </body>
            <html>`;
		
            return finalHtml;
        } catch (e){
            logger.log(e);
        }
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
                retainContextWhenHidden: true,
                //localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules'))]
            } 
        );
        
        this.currentPanel.webview.html = this.provideTextDocumentContent();
        //this.currentPanel.onDidDispose(() => this.dispose(), null, null);
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