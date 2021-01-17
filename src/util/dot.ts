import { createMuiTheme } from '@material-ui/core/styles';
import { PROVJSONBundle, PROVJSONDocument, relations } from './document';

const defaultTheme = createMuiTheme();

export const palette = {
  danger: {
    main: '#dc3545',
  },
  entity: {
    light: '#fcfba9',
    main: '#fffc87',
    dark: '#e3e15d',
  },
  activity: {
    light: '#bbc8fc',
    main: '#9fb1fc',
    dark: '#7a8bcc',
  },
  agent: {
    light: '#ffdfa1',
    main: '#fed37f',
    dark: '#d6ae5c',
  },
  bundle: {
    light: defaultTheme.palette.grey['100'],
    main: defaultTheme.palette.grey['300'],
    dark: defaultTheme.palette.grey['500'],
  },
};

const mapBundleToDots = (json: PROVJSONBundle): string => [
  ...(Object.entries(json.bundle || {}).map(([bundleID, value]) => [
    `subgraph "cluster_${bundleID}" {`,
    `label="${bundleID}";`,
    mapBundleToDots(value),
    '}',
  ])).flat(),
  ...(Object.entries(json.agent || {}).map(([agentID, _], i) => (
    `"${agentID}" [shape="house" label="${agentID}" style="filled" fillcolor="${palette.agent.main}"]`
  ))),
  ...(Object.entries(json.activity || {}).map(([acitivtyID, _], i) => (
    `"${acitivtyID}" [shape="box" label="${acitivtyID}" style="filled" fillcolor="${palette.activity.main}"]`
  ))),
  ...(Object.entries(json.entity || {}).map(([entityID, _]) => (
    `"${entityID}" [shape="oval" label="${entityID}" style="filled" fillcolor="${palette.entity.main}"]`
  ))),
  ...relations.map(({ name, domainKey, rangeKey }) => Object
    .values(json[name] || {})
    .map((value) => (
      `"${value[domainKey]}" -> "${value[rangeKey]}" [label="${name}"${name === 'alternateOf' ? ' dir="both"' : ''}]`
    ))).flat(),
].join('\n');

export const mapDocumentToDots = (json: PROVJSONDocument): string => [
  'digraph  {',
  'rankdir="BT";',
  mapBundleToDots(json),
  '}',
].join('\n');
