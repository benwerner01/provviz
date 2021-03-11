import Color from 'color';
import { PROVENANVE_VIEW_DEFINITIONS, VisualisationSettings } from '../components/contexts/VisualisationContext';
import {
  PROVJSONBundle, PROVJSONDocument, PROVVIZ_ATTRIBUTE_DEFINITIONS, RELATIONS, tbdIsProvVizShape,
} from './document';

const DEFAULT_NODE_SHAPE = {
  agent: 'house',
  activity: 'box',
  entity: 'oval',
};

const renderAttributeValue = (value: any) => (typeof value === 'object' ? value.$ : value);

const mapNodeToDot = (variant: 'agent' | 'activity' | 'entity', settings: VisualisationSettings) => (
  [id, attributes]: [string, { [attributeKey: string]: any; }],
) => {
  const shape = (attributes['provviz:shape'] && tbdIsProvVizShape(attributes['provviz:shape']))
    ? attributes['provviz:shape']
    : DEFAULT_NODE_SHAPE[variant];
  const fillcolor = attributes['provviz:color'] || settings.palette[variant];
  const fontcolor = Color(fillcolor).isLight() ? '#000000' : '#FFFFFF';

  const filteredAttributes = Object.entries(attributes || {})
    .filter(([key]) => PROVVIZ_ATTRIBUTE_DEFINITIONS.find((a) => a.key === key) === undefined);

  return [
    `"${id}" [shape="${shape}" label="${id}" style="filled" fillcolor="${fillcolor}" fontcolor="${fontcolor}"]`,
    (
      filteredAttributes.length > 0
      && !settings.hideAllNodeAttributes
      && !attributes['provviz:hideAttributes']
    ) ? [
        `"${id}_attributes" [shape="note" label="${filteredAttributes
          .map(([attributeID, value]) => `${attributeID} = ${renderAttributeValue(value)}`).join('\n')}"]`,
        `"${id}" -> "${id}_attributes" [style="dotted" dir="none"]`,
      ] : [],
  ].flat().join('\n');
};

const mapBundleToDots = (
  bundle: PROVJSONBundle, settings: VisualisationSettings, hiddenNodes: string[],
): string => [
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('agent')
    ) ? {} : bundle.agent || {})
    .filter(([id]) => !hiddenNodes.includes(id))
    .map(mapNodeToDot('agent', settings))),
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('activity')
    ) ? {} : bundle.activity || {})
    .filter(([id]) => !hiddenNodes.includes(id))
    .map(mapNodeToDot('activity', settings))),
  ...(Object
    .entries((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].nodes.includes('entity')
    ) ? {} : bundle.entity || {})
    .filter(([id]) => !hiddenNodes.includes(id))
    .map(mapNodeToDot('entity', settings))),
  ...RELATIONS.map(({ name, domainKey, rangeKey }) => Object
    .values((
      settings.view !== null
      && !PROVENANVE_VIEW_DEFINITIONS[settings.view].relations.includes(name)
    ) ? {} : bundle[name] || {})
    .filter((value) => (
      !hiddenNodes.includes(value[domainKey])
      && !hiddenNodes.includes(value[rangeKey])))
    .map((value) => (
      `"${value[domainKey]}" -> "${value[rangeKey]}" [label="${name}"${name === 'alternateOf' ? ' dir="both"' : ''}]`
    ))).flat(),
].join('\n');

const getAllHiddenNodes = (settings: VisualisationSettings) => ({
  agent, activity, entity, bundle,
}: PROVJSONDocument): string[] => [
  ...Object.entries({ ...agent, ...activity, ...entity })
    .filter(([id, attributes]) => (
      attributes['provviz:hide'] === true
      || settings.hiddenNamespaces.findIndex((prefix) => id.split(':')[0] === prefix) >= 0))
    .map(([id]) => id),
  ...Object.values(bundle || {})
    .map(getAllHiddenNodes(settings))
    .flat(),
];

export const mapDocumentToDots = (
  document: PROVJSONDocument,
  settings: VisualisationSettings,
): string => {
  const hiddenNodes = getAllHiddenNodes(settings)(document);
  return [
    'digraph  {',
    'rankdir="BT";',
    ...(Object
      .entries(document.bundle || {})
      .map(([bundleID, bundle]) => [
        `subgraph "cluster_${bundleID}" {`,
        `label="${bundleID}";`,
        mapBundleToDots(bundle, settings, hiddenNodes),
        '}',
      ])).flat(),
    mapBundleToDots(document, settings, hiddenNodes),
    '}',
  ].join('\n');
};
