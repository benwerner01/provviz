# ProvViz - An Interactive React PROV Visualiser Component


## React Props

| Name | Type | Description |
| --- | --- | --- |
| `document` | `object` | The PROV document to be visualised, in its PROV-JSON format |
| `onChange` | `function` \| `null` | When a `function` is provided, the PROV document state is controlled by the parent component and `function` is called when the PROV document is modified in the ProvViz Component. When `null` is provided the PROV document state is controlled by the ProvViz Component.<br />**Function Signature:**<br />`function(updatedDocument: object) => void`  |
| `documentName` | `string` | The name of the PROV document, used as the filename when the visualisation is exported as an image |
| `wasmFolderURL` | `string` | The endpoint where the required GraphViz WASM module can be accessed |
| `width` | `number` | The width (in pixels) |
| `height` | `number` | The height (in pixels) |
| `initialSettings` | `object` | The visualisation settings used to initialise the ProvViz component |
| `onSettingsChange` | `function` | The callback `function` called when the visualisation settings change<br />**Function Signature:**<br />`function(updatedSettings: object) => void` |

## Developer Environment

To start the local developer environment:
- use `yarn install` to install the NPM dependencies
- use `yarn storybook` to run the StoryBook environment

