import Color from 'color';
import { PROVENANVE_VIEW_DEFINITIONS, VisualisationSettings } from '../components/contexts/VisualisationContext';
import { PROVJSONBundle, RELATIONS } from './document';

const getNodeColor = (id: string, { palette }: VisualisationSettings) => palette
  .overrides.find(({ nodeID }) => nodeID === id)?.color;

const NODE_SHAPE = {
  agent: 'house',
  activity: 'box',
  entity: 'oval',
};

const renderAttributeValue = (value: any) => (typeof value === 'object' ? value.$ : value);

const mapNodeToDot = (variant: 'agent' | 'activity' | 'entity', settings: VisualisationSettings) => (
  node: [string, { [attributeKey: string]: any; }],
) => {
  const id = node[0];
  const shape = NODE_SHAPE[variant];
  const fillcolor = getNodeColor(id, settings) || settings.palette[variant];
  const fontcolor = Color(fillcolor).isLight() ? '#000000' : '#FFFFFF';

  const attributes = Object.entries(node[1] || {});

  return [
    `"${id}" [shape="${shape}" label="${id}" style="filled" fillcolor="${fillcolor}" fontcolor="${fontcolor}"]`,
    (
      attributes.length > 0
      && !settings.hideAllNodeAttributes
      && !settings.hideAllAttributesForNode.includes(id)
    ) ? [
        `"${id}_attributes" [shape="note" label="${attributes
          .filter(([attributeID]) => !settings.hidden.includes(`${id}_${attributeID}`))
          .map(([attributeID, value]) => `${attributeID} = ${renderAttributeValue(value)}`).join('\n')}"]`,
        `"${id}" -> "${id}_attributes" [style="dotted" dir="none"]`,
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
  ...RELATIONS.map(({ name, domainKey, rangeKey }) => Object
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
  json: PROVJSONBundle,
  settings: VisualisationSettings,
): string => [
  'digraph  {',
  'rankdir="BT";',
  mapBundleToDots(json, settings),
  '}',
].join('\n');
