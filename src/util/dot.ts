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

const renderPropertyValue = (value: any) => (typeof value === 'object' ? value.$ : value);

const mapNodeToDot = (variant: 'agent' | 'activity' | 'entity', settings: VisualisationSettings) => (
  node: [string, { [propertyKey: string]: any; }],
) => {
  const id = node[0];
  const shape = NODE_SHAPE[variant];
  const fillcolor = getNodeColor(id, settings) || settings.palette[variant];
  const fontcolor = Color(fillcolor).isLight() ? '#000000' : '#FFFFFF';

  const properties = Object.entries(node[1] || {});

  return [
    `"${id}" [shape="${shape}" label="${id}" style="filled" fillcolor="${fillcolor}" fontcolor="${fontcolor}"]`,
    (
      properties.length > 0
      && !settings.hideAllNodeProperties
      && !settings.hideAllPropertiesForNode.includes(id)
    ) ? [
        `"${id}_properties" [shape="note" label="${properties
          .filter(([propertyID]) => !settings.hidden.includes(`${id}_${propertyID}`))
          .map(([propertyID, value]) => `${propertyID}=${renderPropertyValue(value)}`).join('\n')}"]`,
        `"${id}" -> "${id}_properties" [style="dotted" dir="none"]`,
      ] : [],
  ].flat().join('\n');
};

const mapBundleToDots = (json: PROVJSONBundle, settings: VisualisationSettings): string => [
  ...(Object
    .entries(json.bundle || {})
    .filter(([id]) => !settings.hidden.includes(id))
    .map(([bundleID, value]) => [
      `subgraph "cluster_${bundleID}" {`,
      `label="${bundleID}";`,
      mapBundleToDots(value, settings),
      '}',
    ])).flat(),
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('agent')
    ) ? {} : json.agent || {})
    .filter(([id]) => !settings.hidden.includes(id))
    .map(mapNodeToDot('agent', settings))),
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('activity')
    ) ? {} : json.activity || {})
    .filter(([id]) => !settings.hidden.includes(id))
    .map(mapNodeToDot('activity', settings))),
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('entity')
    ) ? {} : json.entity || {})
    .filter(([id]) => !settings.hidden.includes(id))
    .map(mapNodeToDot('entity', settings))),
  ...relations.map(({ name, domainKey, rangeKey }) => Object
    .values((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].relations.includes(name)
    ) ? {} : json[name] || {})
    .filter((value) => (
      !settings.hidden.includes(value[domainKey])
      && !settings.hidden.includes(value[rangeKey])))
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
