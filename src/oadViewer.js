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

        this.extensionPath = context.extensionPath;
        this.currentPanel = undefined;
        this.disposables = [];
    }

    provideTextDocumentContent(uri) {
        var port = this.port;
        var html =  `
        <!DOCTYPE html>
<!-- HTML for static distribution bundle build -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swagger Editor</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Roboto,sans-serif;
      font-size: .8em;
      line-height: 1.42857143;
      margin: 0px;
    }

    #swagger-editor .editor-wrapper #ace-editor {
      height: 100% !important;
    }

    #errors-container {
      color: rgb(53, 52, 52);
      background: #fafafa;
      padding: 10px;      
      font-family: Roboto,sans-serif;
    }

    #error-message{
      font-size: 1.3em;
    }

    #errors {
      color: #690606;
      font-size: 1.0em !important;
      /* white-space: pre-wrap; */
    }

    #editor-wrapper {
      height: 100%;
      border:1em solid #000;
      border:none;
    }

    .Pane2 {
      overflow-y: scroll;
      width: 100% !important;
    }

  </style>
  <link href="node_modules/swagger-editor-dist/swagger-editor.css" rel="stylesheet">
  <link rel="icon" type="image/png" href="node_modules/swagger-editor-dist/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="node_modules/swagger-editor-dist/favicon-16x16.png" sizes="16x16" />
</head>

<body style="margin:0px;padding:0px;background:#fafafa;">
  <div style="position:fixed;height:100%;width:100%;">
    <div id="swagger-editor"></div>
  </div>
<script src="node_modules/swagger-editor-dist/swagger-editor-bundle.js"></script>
<script src="node_modules/swagger-editor-dist/swagger-editor-standalone-preset.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script>
  window.onload = function() {
    console.log("Script Start");
    // Build a system
    var editor = SwaggerEditorBundle({
      dom_id: '#swagger-editor',
      layout: 'EditorLayout',
      requestInterceptor: function(request){
        request.mode = "cors";
        return request;
      },
      presets: [
        SwaggerEditorStandalonePreset
      ]
    });
    window.editor = editor;

    console.log("Swagger UI created.");

    var socket = io.connect();

    console.log("Socket created");

    var errorsContainer = document.getElementById('errors-container');
    var errors = document.getElementById('errors');
    var swaggerEditor = document.getElementById('swagger-editor');
    socket.on('updateSpec', function(data) {
      console.log(data);
      var scrollElement = document.getElementsByClassName('Pane2')[0];
      var tempScrollTop = scrollElement ? scrollElement.scrollTop : 0;
      swaggerEditor.style.display = 'block';
      errorsContainer.style.display = 'none';
      editor.specActions.updateLoadingStatus("success");
      editor.specActions.updateSpec(data);
      if (tempScrollTop) {
        setTimeout(function() {
          scrollElement.scrollTop = tempScrollTop;
        }, 100);
      }
    });
    socket.on('showError', function(data) {
      errorsContainer.style.display = 'block';
      swaggerEditor.style.display = 'none';
      console.log(data);
      data = data.replace(/[^\\]\\n/g, '<br>').replace(/\\t/g, '&emsp;');
      errors.innerHTML = data;
    });

    console.log("About to call emit.");

    socket.emit('uiReady', {});

    console.log("Emit called.");
  };
</script>

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position:absolute;width:0;height:0">
  <defs>
    <symbol viewBox="0 0 20 20" id="unlocked">
      <path d="M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V6h2v-.801C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8z"></path>
    </symbol>

    <symbol viewBox="0 0 20 20" id="locked">
      <path d="M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8zM12 8H8V5.199C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8z"/>
    </symbol>

    <symbol viewBox="0 0 20 20" id="close">
      <path d="M14.348 14.849c-.469.469-1.229.469-1.697 0L10 11.819l-2.651 3.029c-.469.469-1.229.469-1.697 0-.469-.469-.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-.469-.469-.469-1.228 0-1.697.469-.469 1.228-.469 1.697 0L10 8.183l2.651-3.031c.469-.469 1.228-.469 1.697 0 .469.469.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c.469.469.469 1.229 0 1.698z"/>
    </symbol>

    <symbol viewBox="0 0 20 20" id="large-arrow">
      <path d="M13.25 10L6.109 2.58c-.268-.27-.268-.707 0-.979.268-.27.701-.27.969 0l7.83 7.908c.268.271.268.709 0 .979l-7.83 7.908c-.268.271-.701.27-.969 0-.268-.269-.268-.707 0-.979L13.25 10z"/>
    </symbol>

    <symbol viewBox="0 0 20 20" id="large-arrow-down">
      <path d="M17.418 6.109c.272-.268.709-.268.979 0s.271.701 0 .969l-7.908 7.83c-.27.268-.707.268-.979 0l-7.908-7.83c-.27-.268-.27-.701 0-.969.271-.268.709-.268.979 0L10 13.25l7.418-7.141z"/>
    </symbol>


    <symbol viewBox="0 0 24 24" id="jump-to">
      <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z"/>
    </symbol>

    <symbol viewBox="0 0 24 24" id="expand">
      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
    </symbol>

  </defs>
</svg>
<pre id='errors-container'>
  <div id='error-message'>There was an error while processing your files. Please fix the error and save the file.</div>
  <div id='errors'></div>
</pre>
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
                retainContextWhenHidden: true
            } 
        );
        this.currentPanel.webview.html = this.provideTextDocumentContent(this.uri);

         // Handle messages from the webview
          this.currentPanel.webview.onDidReceiveMessage(message => { vscode.window.showErrorMessage(message.text); }, null, this.disposables);
         //this.currentPanel.onDidChangeViewState(e => { this.update() }, null, this.disposables);
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
        } else {
            this.display();
        }
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