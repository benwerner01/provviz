import Color from 'color';
import { PROVENANVE_VIEW_DEFINITIONS, VisualisationSettings } from '../components/contexts/VisualisationContext';
import {
  PROVJSONBundle, PROVJSONDocument, relations,
} from './document';

const getNodeColor = (id: string, { palette }: VisualisationSettings) => palette
  .overrides.find(({ nodeID }) => nodeID === id)?.color;

const NODE_SHAPE = {
  agent: 'house',
  activity: 'box',
  entity: 'oval',
};

const mapNodeToDot = (variant: 'agent' | 'activity' | 'entity', settings: VisualisationSettings) => (id: string) => {
  const shape = NODE_SHAPE[variant];
  const fillcolor = getNodeColor(id, settings) || settings.palette[variant];
  const fontcolor = Color(fillcolor).isLight() ? '#000000' : '#FFFFFF';

  return `"${id}" [shape="${shape}" label="${id}" style="filled" fillcolor="${fillcolor}" fontcolor="${fontcolor}"]`;
};

const mapBundleToDots = (json: PROVJSONBundle, settings: VisualisationSettings): string => [
  ...(Object.entries(json.bundle || {}).map(([bundleID, value]) => [
    `subgraph "cluster_${bundleID}" {`,
    `label="${bundleID}";`,
    mapBundleToDots(value, settings),
    '}',
  ])).flat(),
  ...(Object
    .keys((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('agent')
    ) ? {} : json.agent || {})
    .map(mapNodeToDot('agent', settings))),
  ...(Object
    .keys((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('activity')
    ) ? {} : json.activity || {})
    .map(mapNodeToDot('activity', settings))),
  ...(Object
    .keys((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('entity')
    ) ? {} : json.entity || {})
    .map(mapNodeToDot('entity', settings))),
  ...relations.map(({ name, domainKey, rangeKey }) => Object
    .values((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].relations.includes(name)
    ) ? {} : json[name] || {})
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
