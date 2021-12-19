# vs-openapi-designer [Preview]

 VS Code extension for previewing [OpenApi Schema's](https://github.com/OAI/OpenAPI-Specification) within VS Code.

 Find it in the [VS Code MarketPlace](https://marketplace.visualstudio.com/items?itemName=philosowaffle.openapi-designer).

## Features

- Preview OpenApi specs in side panel in VS Code or in Browser
- Swagger 2.0 Spec previewing and validation
  - YAML/JSON
  - Single and Multi-File (both local and remote references)
- OpenApi 3.0 Spec previewing and validation
  - YAML/JSON
  - Single and Multi-File (both local and remote references)

## Usage

- Open the root of your schema
- `ctrl-shft-p` > `OpenApi Designer: Preview`
- Other Available Commands
  - `OpenApi Designer: Preview` - opens preview using your default view preference
  - `OpenApi Designer: Preview In Side Panel` - open preview in side panel
  - `OpenApi Designer: Preview In Browser` - open preivew in browser
  - `OpenApi Designer: Compile Schema` - Compiles a unified schema and dereferences all `$refs` into a single file

## Requirements

- None

## Extension Settings

This extension contributes the following settings:

- `openApiDesigner.defaultPort`: default port for serving the Swagger UI, default `9005`
- `openApiDesigner.previewInBrowser`: whether to open preview in the Browser or in VS Code side panel, default `false`

## Known Issues

See known issues [here](https://github.com/philosowaffle/vs-openapi-designer/issues).  If your issue is not already listed there please log a new one.

## Release Notes

See [CHANGELOG](https://github.com/philosowaffle/vs-openapi-designer/blob/master/CHANGELOG.md).

-----------------------------------------------------------------------------------------------------------

## Contributing

### Development

- cd dir, `npm install` to install needed dependencies
- F5 to launch extension and validate
- `npm install -g vsce` For packaging and publishing
    - `vsce package` - To build pre-release pacakages
    - To side load in VS Code `ctrl-shft-p`, `Install From VSIX`, locate output from `package`

#### Using Docker Dev Env

A VS Code development environment is provided via docker. Simply launch the docker container, then open VS Code in your browser.

1. `> docker-compose up -d`
1. http://localhost:8443
1. VS Code should launch with the workspace loaded
1. For testing:
  1. `vsce package` - builds pre-release packages
  1. VSIX file will be created, right click, Install, Reload, extension should be available in the dev environment now