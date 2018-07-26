# openapi-designer README
 todo

## Features

features!

## Requirements

- Node.Js

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

-----------------------------------------------------------------------------------------------------------

## Working with Markdown

**Note:** You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+CMD+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (macOS) to see a list of Markdown snippets

**Enjoy!**

### Development
* cd dir, `npm install` to install needed dependencies
* F5 to launch extension and validate

https://code.visualstudio.com/docs/extensions/example-language-server
https://code.visualstudio.com/docs/extensionAPI/language-support#_syntax-highlighting
https://code.visualstudio.com/docs/extensionAPI/language-support


https://code.visualstudio.com/docs/extensions/publish-extension
npm install -g vsce

https://vscode-docs.readthedocs.io/en/stable/extensions/install-extension/
You can manually install an VS Code extension packaged in a .vsix file. Simply install using the VS Code command line providing the path to the .vsix file.

code myExtensionFolder\myExtension.vsix
The extension will be installed under your user .vscode/extensions folder. You may provide multiple  .vsix files on the command line to install multiple extensions at once.

You can also install a .vsix by opening the file from within VS Code. Run File | Open File... or  kb(workbench.action.files.openFile) and select the extension .vsix.

https://stackoverflow.com/questions/18874689/force-close-all-connections-in-a-node-js-http-server