import { VisualisationSettings } from '../components/contexts/VisualisationContext';
import { PROVJSONBundle, PROVJSONDocument, relations } from './document';

const getNodeColor = (id: string, { palette }: VisualisationSettings) => palette
  .overrides.find(({ nodeID }) => nodeID === id)?.color;

const mapBundleToDots = (json: PROVJSONBundle, settings: VisualisationSettings): string => [
  ...(Object.entries(json.bundle || {}).map(([bundleID, value]) => [
    `subgraph "cluster_${bundleID}" {`,
    `label="${bundleID}";`,
    mapBundleToDots(value, settings),
    '}',
  ])).flat(),
  ...(Object.entries(json.agent || {}).map(([agentID, _], i) => (
    `"${agentID}" [shape="house" label="${agentID}" style="filled" fillcolor="${getNodeColor(agentID, settings) || settings.palette.agent}"]`
  ))),
  ...(Object.entries(json.activity || {}).map(([acitivtyID, _], i) => (
    `"${acitivtyID}" [shape="box" label="${acitivtyID}" style="filled" fillcolor="${getNodeColor(acitivtyID, settings) || settings.palette.activity}"]`
  ))),
  ...(Object.entries(json.entity || {}).map(([entityID, _]) => (
    `"${entityID}" [shape="oval" label="${entityID}" style="filled" fillcolor="${getNodeColor(entityID, settings) || settings.palette.entity}"]`
  ))),
  ...relations.map(({ name, domainKey, rangeKey }) => Object
    .values(json[name] || {})
    .map((value) => (
      `"${value[domainKey]}" -> "${value[rangeKey]}" [label="${name}"${name === 'alternateOf' ? ' dir="both"' : ''}]`
    ))).flat(),
].join('\n');

export const mapDocumentToDots = (
  json: PROVJSONDocument,
  settings: VisualisationSettings,
): string => [
  'digraph  {',
  'rankdir="BT";',
  mapBundleToDots(json, settings),
  '}',
].join('\n');
